/**
 * Created by pekko1215 on 2018/11/22.
 */
const {Card,ItemCard} = require('../CardGame');

function Common(cost,charge,power,name,url){
    return class extends Card {
        constructor(player){
            super(cost,charge,power,player);
            this.name = name;
            this.url = url;
        }
    }
}

function UsedItem(cost,charge,name,url,fn){
    return class extends ItemCard {
        constructor(player){
            super(cost,charge,player);
            this.name = name;
            this.url = url;
            this.use = fn;
        }
    }
}

module.exports = [
    Common(1,1,0,"新聞を読む人のイラスト（おじいさん）","https://4.bp.blogspot.com/-DVGmD3Le1xA/WwJa9IsTbLI/AAAAAAABMPY/pg_Z2ieEcy4xzlAIXLyUm3Zl1dR5khuogCLcBGAs/s800/shinbun_ojiisan.png"),
    Common(1,1,0,'綺麗な髪のイラスト（おじいさん）','https://4.bp.blogspot.com/-hH0gqhAROcM/W5H_3p4C-0I/AAAAAAABOwU/KEc-iKIJSXk88qXGMMYshI4_adAjh1GCwCLcBGAs/s800/hair_biyou_kirei_ojiisan.png'),
    Common(1,2,1,'和服を着た高齢の男性のイラスト','https://2.bp.blogspot.com/-zOcWzK0oV0c/W6DTNJPWljI/AAAAAAABO6Q/rHhxs__dWlIkEzobsCYH8kgtc16UcXziACLcBGAs/s800/fashion_wafuku_old_man.png'),
    Common(2,3,2,'篠笛を吹く人のイラスト（男性）','https://1.bp.blogspot.com/-uNox5In9ogU/W6DTiYawWJI/AAAAAAABO9I/bq9usagSb_gFT0bIPJ0hejoRRyYONKSvwCLcBGAs/s800/music_shinobue_man.png'),
    class extends ItemCard {
        constructor(player){
            super(3,1,player);
            this.name = "迷惑駐車のイラスト";
            this.url = "https://3.bp.blogspot.com/-0FmVCFpTTHg/V0QnZWF_KZI/AAAAAAAA64M/Xuy6ynbLIKgCF7d88ETmzXIT6cGTjm-MwCLcB/s800/car_meiwaku_chusya.png";
            this.text = "敵のチャージャー1枚をランダムにチャージする。"
        }
        canUse(){
            if(this.player.target.charger.filter(card => {
                return !card.costed
            }).length){
                return true;
            }
        }
        async use(){
            var arr = this.player.target.charger.filter(card=>!card.costed).shuffle();
            var card = arr.pop();
            this.player.target.useCost(card);
        }
    }
]