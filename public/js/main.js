/**
 * Created by pekko1215 on 2018/11/23.
 */
var socket = io();
var _cb;
var messageQueue = [];
var commandQueue = [];
var endCb;


var field = {
    my:{
        hand:[],
        charger:[]
    },
    target:{
        hand:[],
        charger:[]
    }
};
socket.on('init',(data)=>{
    field = data;
    init();
})

socket.on('message',async (data,fn)=>{
    execCommand(data,fn);
});

function execCommand(data,fn){
    async function _(){
        console.log('実行前',commandQueue)
        if(commandQueue.length == 0) return;
        var command = commandQueue[0];
        switch(command.data.type){
            case 'hand':
                command.fn(await hand(command.data.cards));
                await getAll();
                break;
            case 'cost':
                command.fn(await cost(command.data.cards));
                await getAll();
                break;
            case 'message':
                message(command.data.text)
                break
            case 'update':
                await getAll();
        }
        commandQueue.shift();
        console.log("実行後",commandQueue)
        _();
    }
    commandQueue.push({data,fn});
    if(commandQueue.length == 1){
        _();
    }
}

socket.on('update',()=>{
    getAll();
})

async function hand(cards){
    await getAll();
    return await new Promise(r=>{
        var $cards = $('#hand > div.minicard');
        var click = (i)=>{
            return (e)=>{
                r(i);
                $cards.off('click');
            }
        }
        if(cards.length == 0) r(null);
        cards.forEach((card,idx)=>{
            if(card !== false){
                $cards
                    .eq(idx)
                    .addClass('light')
                    .css({cursor:'pointer'})
                    .on('click',click(idx));
            }
        })
        endCb = r;
    })
}
async function cost(cards){
    await getAll();
    return await new Promise(r=>{
        var $cards = $('#charger > div.minicard');
        var click = (i)=>{
            return (e)=>{
                r(i);
                $cards.off('click');
            }
        }
        if(cards.length == 0) r(null);
        cards.forEach((card,idx)=>{
            if(card !== false){
                console.log($cards.eq(idx));
                $cards
                    .eq(idx)
                    .addClass('light')
                    .css({cursor:'pointer'})
                    .on('click',click(idx));
            }
        })
    })
}

async function getAll(){
    return await (new Promise(r=>{
        socket.emit('getAll',data=>{
            if(JSON.stringify(field) !== JSON.stringify(data)){
                field = data;
                console.log(field.status)
                update();
            }
            r();
        })
    }));
}

document.getElementById('connect').addEventListener('click',()=>{
    var key = document.getElementById('key').value;
    socket.emit('join',{
        roomId:key
    })
})

function cb(val){
    _cb(val);
    getAll();
}

function init(){
    field.my.hand.forEach(c=>{
        $('#hand').append(createMiniCard(c));
    });
    field.my.charger.forEach(c=>{
        $('#charger').append(createMiniCard(c));
    });
    field.target.hand.forEach(c=>{
        $('#targetHand').append(createMiniCard(c));
    });
    field.target.charger.forEach(c=>{
        $('#targetCharger').append(createMiniCard(c));
    })
    $('#end').prop("disabled",field.my.status !== 'standby');
    $('#game').show()
}

function update(){
    $('#hand').children().remove()
    field.my.hand.forEach(c=>{
        $('#hand').append(createMiniCard(c));
    });
    $('#charger').children().remove()
    field.my.charger.forEach(c=>{
        $('#charger').append(createMiniCard(c));
    });
    $('#targetHand').children().remove()
    field.target.hand.forEach(c=>{
        $('#targetHand').append(createMiniCard(c));
    });
    $('#targetCharger').children().remove()
    field.target.charger.forEach(c=>{
        $('#targetCharger').append(createMiniCard(c));
    })
    $('#end').prop("disabled",field.my.status !== 'standby');
}

function createMiniCard(card){
    var hidden = typeof card === 'number' || card === false;
    var el;
    if(hidden){
        el = $('<div class="minicard"></div>');
    }else{
        el = $(`
    <div class="minicard ${card.type}">
        <img src="${card.url}">
        <div class="data">
            <div class="cost">${card.cost}</div>
            <div class="charge">${card.charge}</div>
            <div class="power">${card.power}</div>
        </div>
    </div>
    `);
    }
    el.data({card})
    return el
}

function message(text){
    messageQueue.push(text);
    if(messageQueue.length == 1){
        popMessage();
    }
}

function popMessage() {
    if(!messageQueue.length) return;
    var text = messageQueue[0];
    var $mes = $(`<div class="message"></div>`);
    $mes.text(text);
    $(document.body).append($mes);
    setTimeout(()=>{
        $mes.remove();
        messageQueue.shift();
        popMessage();
    },2000)
}

$(document).on('mouseover','.minicard',(e)=>{
    var card = $(e.currentTarget).data('card');
    setCardView(card);
})


function setCardView(card){
    removeCardView();
    if(card === false || typeof card === 'number') return
    var el = $(`
        <div class="name">${card.name}</div>
        <div class="cost">${card.cost}</div>
        <div class="image">
            <img src="${card.url}">
        </div>
        <div class="text">${card.text||''}</div>
        <div class="charge">${card.charge}</div>
        ${card.type !== 'used' ?  `<div class="power">${card.power}</div>` :''}
    `)
    $('#cardView').addClass(card.type);
    $('#cardView').append(el);
}

function removeCardView(){
    $('#cardView').children().remove();
    $('#cardView').removeClass('character')
    $('#cardView').removeClass('used')
}

$('#end').click(e=>{
    if(endCb){
        endCb(null);
        endCb = null;
    }
})