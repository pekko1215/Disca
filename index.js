const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'))


const {CardGame} = require('./CardGame');
const pool = require('./cards/volume1');

var deck1 = Array(pool.length*6).fill(0).map((d,i)=>pool[i%pool.length]);
var deck2 = Array(pool.length*6).fill(0).map((d,i)=>pool[i%pool.length]);


var game = new CardGame(deck1,deck2);

var rooms = {};

class Room {
    constructor(s1){
        this.sockets = [s1];
    }
    addSocket(s){
        if(this.sockets.length == 1) {
            this.sockets.push(s);
            return true;
        }else{
            return false;
        }
    }
    async start(){
        if(this.sockets.length!= 2) return
        this.sockets.shuffle();
        this.game = new CardGame(deck1,deck2);
        this.game.players.forEach((p,i)=>{
            p.socket = this.sockets[i];
            p.socket.emit('init',{
                my:p.getSendMyData(),
                target:p.target.getSendTargetData()
            })
            p.socket.on('getAll',(fn)=>{
                fn(p.getAllData())
            })
        });
        while(true){
            console.log(this.game.player1.deck)
            console.log(this.game.player2.deck)
            await this.game.play();
        }
    }
}


io.on('connection', (socket) => {
    var roomId;
    socket.on('join',(msg,fn)=>{
        if(msg.roomId in rooms){
            rooms[msg.roomId].addSocket(socket);
            rooms[msg.roomId].start()
        }else{
            rooms[msg.roomId] = new Room(socket);
        }
    })
});


http.listen(33331);