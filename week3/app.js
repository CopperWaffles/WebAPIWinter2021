//const { debug } = require('console')
const e = require('express')
var express = require('express')
var app = express()
var mongoose = require('mongoose')
var serv = require('http').Server(app)
var io = require('socket.io')(serv,{})
var debug = true
require('./db')
require('./models/Player')

var PlayerData = mongoose.model('player')

//file comms
app.get('/',function(req,res)
{
    res.sendFile(__dirname+'/client/index.html')
})

app.use('/client',express.static(__dirname+'/client'))

//server side comms
serv.listen(3000, function()
{
    console.log('Connected on Port 3000')
})

var SocketList ={}
//var PlayerList = {}

// WEEK 4 GameObject Class
var GameObject = function()
{
    var self = {
        x:400,
        y:300,
        spX:0,
        spY:0,
        id:"",
    }
    self.update = function()
    {
        self.updatePosition()
    } 
    self.updatePosition = function()
    {
        self.x += self.spX
        self.y += self.spY
    }
    self.getDist = function(point)
    {
        return Math.sqrt(Math.pow(self.x - point.x,2) + Math.pow(self.y - point.y,2))
    }

    return self
}

var Player = function(id)
{
    var self = GameObject()
    self.id = id
    self.number = Math.floor(Math.random()*10)
    self.right = false
    self.left = false
    self.up = false
    self.down = false
    self.attack = false
    self.mouseAngle = 0
    self.speed = 10
    self.hp = 10
    self.hpMax = 10
    self.score = 0

    var playerUpdate = self.update

    self.update = function()
    {
        self.updateSpeed()
        playerUpdate()
   //     if(Math.random()<0.1)
  //  {
   //     self.shoot(Math.random()*360)
  //  }
        if(self.attack)
    {
        self.shoot(self.mouseAngle)
    }
    }

    //player shoot
    self.shoot = function(angle)
    {
        var b = Bullet(self.id,angle);
        b.x = self.x
        b.y = self.y
    }

    self.updateSpeed = function()
    {
        if(self.right){
            self.spX = self.speed
        }else if(self.left){
            self.spX = -self.speed
        }else{
            self.spX = 0
        }

        if(self.up){
            self.spY = -self.speed
        }else if(self.down){
            self.spY = self.speed
        }else{
            self.spY = 0
        }
    }

    self.updatePosition = function()
    {
        if(self.right)
        self.x += self.speed
        if(self.left)
        self.x -= self.speed
        if(self.up)
        self.y -= self.speed
        if(self.down)
        self.y += self.speed
    }

    self.getInitPack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            hp:self.hp,
            hpMax:self.hpMax,
            score:self.score
        }
    }

    self.getUpdatePack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            hp:self.hp,           
            score:self.score
        }
    }

    Player.list[id] = self

    initPack.player.push(self.getInitPack())

    return self
}

Player.list = {}
//player connection and movement functions
Player.onConnect = function(socket)
{
    var player = new Player(socket.id)

     //receive input
     socket.on('keypress', function(data)
     {
         if(data.inputId === 'up')
             player.up = data.state
         if(data.inputId === 'down')
             player.down = data.state
         if(data.inputId === 'left')
             player.left = data.state
         if(data.inputId === 'right')
             player.right = data.state
         if(data.inputId === 'attack')
             player.attack = data.state
         if(data.inputId === 'mouseAngle')
             player.mouseAngle = data.state
     })

     socket.emit('init', {
         player:Player.getAllInitPack(),
         bullet:Bullet.getAllInitPack()

     })
}

Player.getAllInitPack = function(){
    var players = []
    for(var i in Player.list){
        players.push(Player.list[i].getInitPack())
    }
    return players
}

Player.onDisconnect = function(socket)
{
    delete Player.list[socket.id]
    removePack.player.push(socket.id)
}

Player.update = function()
{
    var pack =[]
    for(var i in Player.list)
    {
        var player = Player.list[i]
        player.update()
        pack.push(player.getUpdatePack())
    }
    return pack
}

//bullet class
var Bullet = function(parent,angle)
{
    var self = GameObject()
    self.id = Math.random()
    self.spX = Math.cos(angle/180*Math.PI) * 10
    self.spY = Math.sin(angle/180*Math.PI) * 10
    self.parent = parent

    self.timer = 0
    self.toRemove = false   
    
    var bulletUpdate = self.update
    self.update = function()
    {
        if(self.timer++ > 100)
        {
            self.toRemove = true
        }
        bulletUpdate()
        for(var i in Player.list)
        {
            var p = Player.list[i]
            if(self.getDist(p)<25 && self.parent !== p.id)
            { //damage and HP
                p.hp -= 1

                if(p.hp <= 0){
                    var shooter = Player.list[self.parent]

                    if(shooter){
                        shooter.score += 1
                    }

                    p.hp = p.hpMax
                    p.x = Math.random() * 800
                    p.y = Math.random() * 800
                }

                self.toRemove = true               
            }
        }
    }
    self.getInitPack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y            
        }
    }

    self.getUpdatePack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y        
        }
    }

    Bullet.list[self.id] = self

    initPack.bullet.push(self.getInitPack())

    return self
}
Bullet.list = {}

Bullet.update = function()
{
    //creates bullets
    //if(Math.random()<0.1)
    //{
      //  Bullet(Math.random()*360)
    //}
    var pack =[]
    for(var i in Bullet.list)
    {
        var bullet = Bullet.list[i]
        bullet.update()
        if(bullet.toRemove)
        {
            delete Bullet.list[i]
            removePack.bullet.push(bullet.id)
        }
        else
        {
            pack.push(bullet.getUpdatePack())
        }       
    }
    return pack
}

Bullet.getAllInitPack = function(){
    var bullets = []
    
    for(var i in Bullet.list){
        bullets.push(Bullet.list[i].getInitPack())
    }
    return bullets
}

//==============User collection setuup
//var Players = {
  //  "Matt":"123",
    //"Tyler":"asd",
    //"Bob":"321",
    //"Hans":"qwe",
//}

var isPasswordValid = function(data,cb)
{
   
    PlayerData.findOne({username:data.username},function(err,username){
        cb(data.password == username.password)
    })
}

var isUsernameTaken = function(data,cb)
{
    PlayerData.findOne({username:data.username},function(err,username){

        if(username == null){
            cb(false)
        }
        else{
            cb(true)
        }
    })
}

var addUser = function(data)
{
    //Players[data.username] = data.password
    new PlayerData(data).save()
}

//Connection to game
io.sockets.on('connection', function(socket)
{
    console.log('Socket Connected')

    socket.id = Math.random()
    // socket.x = 0
    // socket.y = Math.floor(Math.random()*600)
    // socket.number = Math.floor(Math.random()*10)

    //add to list
    SocketList[socket.id] = socket
    
   
    //sign in event
    socket.on('signIn', function (data) {
       // if(isPasswordValid(data)) {
         //   Player.onConnect(socket)
           // socket.emit('connected', socket.id)
            //socket.emit('signInResponse',{success:true})
       // }else
       // {
         //   socket.emit('signInResponse',{success:false})
        //}
        isPasswordValid(data,function(res){
            if(res){
                Player.onConnect(socket)
                //send id to client
                socket.emit('connected', socket.id)
                socket.emit('signInResponse', {success: true})
            }else{
                socket.emit('signInResponse', {success: false})
            }
        })
    })

    //sign up event
    socket.on('signUp', function(data){
       //if(isUsernameTaken(data))
      // {
        //   socket.emit('signUpResponse',{success:false})
      // }else{
        //   addUser(data)
          // socket.emit('signUpResponse',{success:true})
       //}
       isUsernameTaken(data, function(res){
           if(res){
               socket.emit('signUpResponse',{success:false})
           }else{
               addUser(data)
               socket.emit('signUpResponse',{success:true})
           }
       })
    })

    //diconnect event
    socket.on('disconnect', function(){
        delete SocketList[socket.id]
        Player.onDisconnect(socket)        
    })

    //chat event
    socket.on('sendMessageToServer', function(data){
       var playerName = (" " + socket.id).slice(2,7)
       for(var i in SocketList)
       {
           SocketList[i].emit('addToChat', playerName + ": " + data)
       }         
    })


    socket.on('evalServer', function(data){
        if(!debug)
        {
            return
        }     
        var res = eval(data)
        socket.emit('evalResponse', res)
     })

    // socket.on('sendMsg', function(data)
    // {
    //     console.log(data.message)
    // })
    // socket.on('sendBtnMsg',function(data)
    // {
    //     console.log(data.message)
    // })

    // socket.emit('messageFromServer',{
    //     message:'Hey Jordan'
    // })
})

    var initPack = {player:[],bullet:[]}
    var removePack = {player:[],bullet:[]}

//Setup Update loop
setInterval(function(){
 // var pack = Player.update();
 var pack =
 {
     player:Player.update(),
     bullet:Bullet.update()
 }
    for(var i in SocketList)
    {        
        var socket = SocketList[i]
        socket.emit('init',initPack)  
        socket.emit('update',pack) 
        socket.emit('remove',removePack)       
    }
   initPack.player = []
   initPack.bullet = []
   removePack.player = []
   removePack.bullet = []
}, 1000/30)