var express = require('express')
var mongoose = require('mongoose')
var app = express()
var path = require('path')
var bodyparser = require('body-parser')
const { createBrotliCompress } = require('zlib')
var serv = require('http').Server(app)
var io = require('socket.io')(serv,{})
//var router = express.router()

//require('./db')

//middleware
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}))
app.use(express.json())

mongoose.connect('mongodb://localhost:27017/asteroidGameEntries', {
    useNewUrlParser:true
}).then(function(){
    console.log("Connected to MongoDB Database")
}).catch(function(err){
    console.log(err)
})

//Load in database templates
require('./models/Score')
var Score = mongoose.model('highscores')

//POST route
app.post('/saveScore', function(req, res){
    console.log("Request Made");
    console.log(req.body)

    new Score(req.body).save().then(function(){
        console.log(req.body);
        res.redirect('highScores.html')
    })
})

app.get('/getData', function(req,res){   

    Score.find({}).then(function(score){
    
        res.json({score})
    })
})

app.use(express.static(__dirname+"/views"))

//File comm
app.get('/', function(req,res){
    res.sendFile(__dirname+'/views/index.html')
})

app.use('/views', express.static(__dirname+'/views'))

var SocketList = {}

io.sockets.on('connection', function(socket){
    console.log("Socket Connected")

    socket.id = Math.random()
    //add to list
    SocketList[socket.id] = socket
})

serv.listen(5000, function(){
    console.log("Listening on Port 5000")
})