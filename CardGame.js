class Card {
	constructor(cost,charge,power,player){
		this.cost = cost;
		this.charge = charge;
		this.power = power;
		this.player = player;
		this.type = "character";
        this.name = null
        this.hidden = false;
    }
	async use(){}
    canUse(){return false}
    doCharge(){
        this.player.charge(this.charge)
    }
    canAttack(){return true}
    attack(){
        return this.power;
    }
    getDrop() {
        return 1;
    }
    async drop(){}
    toSendData(){
        if(this.hidden) return false;
        return {
            cost:this.cost,
            charge:this.charge,
            power:this.power,
            type:this.type,
            name:this.name,
            url:this.url,
            text:this.text
        }
    }

}

class ItemCard extends Card {
	constructor(cost,charge,player){
		super(cost,charge,0,player);
		this.type = "used"
	}
    canAttack(){return false}
	canUse(){return true}
}

Array.prototype.shuffle = function(){
    for(var i = this.length - 1; i > 0; i--){
        var r = Math.floor(Math.random() * (i + 1));
        [this[i],this[r]] = [this[r],this[i]];
    }
    return this;
}

class Player {
    constructor(deck,defcard){
        deck.shuffle();
        this.deck = deck;
        this.hand = Array(defcard).fill(0).map(d=>this.deckPop());
        this.charger = [];
        this.status = 'charge'
    }
    charge(c){
        this.charger.push(...Array(c).fill(0).map(()=> {
            var card = this.deckPop();
            card.position = 'charge'
            card.hidden = true;
            return card;
        }));
    }
    useCost(card) {
        card.costed = true;
        card.hidden = false;
        this.update();
        this.target.update();
    }
    deckPop(){
        var c = this.deck.pop();
        if(!c) throw 'deckBreak'
        return new c(this);
    }
    charging(){
        this.charger.filter(d=>!d.costed).forEach(c=>{
            this.addHand(c);
            c.position = 'hand'
        });
        this.charger = [];
        this.charge(1);
    }
    getCanCost(){
        return this.charger.filter(c=>!c.costed).length
    }
    addHand(card){
        card.hidden = false;
        this.hand.push(card);
    }
    end(){}

    async payCost(cost){
        while(cost){
            this.showMessage(`コスト:${cost}`);
            this.target.update();
            var arr = this.charger.map(c=>{
                if(c.costed){
                    return false;
                }
                return c.toSendData() || true
            });
            var idx = await this.select(arr,'cost');
            var card = this.charger[idx];
            if(arr[idx]) {
                this.useCost(card)
                cost--;
            }
        }
    }
    returnCard(card){;
        this.deck.push(card.constructor);
    }
    async use(card){
        this.showMessage(`${card.name}を発動！`);
        await this.payCost(card.cost);
        this.target.update();
        await card.use();
        this.hand = this.hand.filter(c=>c!=card);
        this.charge(card.charge);
        this.update();
        this.target.update();

    }
    async attack(card){
        this.showMessage(`${card.name}で攻撃！`);
        this.target.showMessage(`${card.name}の攻撃！`);
        await this.payCost(card.cost);
        this.target.update();
        var  p = await card.attack();
        await this.target.damage(p);
        this.returnCard(card);
        this.hand = this.hand.filter(c=>c!=card);
        this.charge(card.charge)
        this.update();
        this.target.update();
    }
    async select(cards,type='select'){
        return await this.message({
            type,
            cards
        })
    }
    async standSelect(){
        this.showMessage("スタンバイフェーズ")
        var arr = this.hand.map(c=>{
            if(c.cost > this.getCanCost()){
                return false;
            }
            var isAttack = c.canAttack();
            var isUse = c.canUse();
            if(!isAttack && !isUse) return false;
            return {
                card:c.toSendData(),
                type:isAttack ? 'attack' : 'use'
            }
        });
        var idx = await this.select(arr,'hand');
        if(idx === null) return false;
        var action = arr[idx];
        if(!action) return false;
        action.card = this.hand[idx];
        return action;
    }
    async damage(p){
        this.showMessage(`${p}のダメージ！`)
        while(p){
            this.showMessage(`のこり:${p}`);
            this.target.update();
            var arr = this.hand.map(c=>{
                if(c.getDrop()){
                    return c.toSendData();
                }else{
                    return false;
                }
            })
            var card = await this.select(arr,'hand');
            if(card === null)
                throw 'handBreak';
            card = this.hand[card];
            this.hand = this.hand.filter(c=>c!=card);
            card.drop();
            this.returnCard(card);
            p--;
        }
    }
    async message(obj){
        if(!this.socket) throw 'No socket';
        return await new Promise(r=>{
            this.socket.emit('message',obj,(o)=>{
                r(o);
            })
        })
    }
    showMessage(text){
        this.message({
            type:'message',
            text
        })
    }

    update(){
        this.message({
            type:'update'
        })
    }

    getSendMyData(){
        return {
            hand:this.hand.map(card=>{
                return card.toSendData();
            }),
            charger:this.charger.map((card,i)=>{
                return card.toSendData()
            }),
            status:this.status
        }
    }
    getSendTargetData(){
        return {
            hand:[...Array(this.hand.length).keys()],
            charger:this.charger.map((c,i)=>{
                if(c.hidden) return i;
                return c.toSendData();
            }),
            status:this.status
        }
    }
    getAllData(){
        return {
            my:this.getSendMyData(),
            target:this.target.getSendTargetData()
        }
    }
}

class CardGame {
    constructor(deck1,deck2){
        this.player1 = new Player(deck1,5);
        this.player2 = new Player(deck2,5);
        this.player1.target = this.player2;
        this.player2.target = this.player1;
        this.players = [this.player1,this.player2];
        this.status = "charge"
        this.player1.status = 'charge';
        this.player2.status = 'end';
    }
    async play(){
        var turnPlayer = this.players[0];
        switch(this.status){
            case 'charge':
                turnPlayer.charging();
                this.status = 'standby'
                turnPlayer.status = 'standby'
                break
            case 'standby':
                turnPlayer.status = 'standby'
                var cardAction = await turnPlayer.standSelect();
                if(!cardAction) {
                    turnPlayer.end();
                    this.status = 'charge'
                    turnPlayer.status = 'end'
                    this.players.reverse();
                    return
                }
                this.status = 'action';
                turnPlayer.status = 'action'
                switch(cardAction.type){
                    case 'use':
                        await turnPlayer.use(cardAction.card)
                        break
                    case 'attack':
                        await turnPlayer.attack(cardAction.card)
                        break
                }
                this.status = 'standby'
                turnPlayer.status = 'standby'
                this.players.forEach(p=>p.socket.emit('update'))
                break
        }
    }
}



module.exports = {CardGame,ItemCard,Card};