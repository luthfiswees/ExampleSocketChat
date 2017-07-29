const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const session = require('express-session');
// const socketSession = require("socket.io-session-middleware");
// const sharedsession = require('express-socket.io-session');

// Initialize session
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  // store: new connect.session.MemoryStore(),
  // cookieParser: connect.cookieParser("secret")
}));

// // Use share session in socket
// io.use(sharedsession(session));
// io.use(socketSession(session));

// Connect mongoose to mongo database
mongoose.connect('mongodb://localhost/SocketExample', {'useMongoClient': true});

// Define schema here
var Schema = mongoose.Schema;

// Create schema here
// Chat room schema
var chat_room_schema = new Schema({
  owner: String,
  isGroup: Boolean
});
// Chat message schema
var chat_message_schema = new Schema({
  message: String,
  chat_room_id: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});
// User schema
var user_schema = new Schema({
  username: String,
  chat_room: [chat_room_schema],
  chat_message: [chat_message_schema]
});

// create Mongoose model here
var ChatRoom = mongoose.model('ChatRoom', chat_room_schema);
var ChatMessage = mongoose.model('ChatMessage', chat_message_schema);
var User = mongoose.model('User', user_schema);

// App routes
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/chat', function(req, res){
  res.sendFile(__dirname + '/chat.html');
});

app.get('/test_socket', function(req, res){
  io.sockets.emit('chat message', 'test_socket');
  res.send('signal emitted');
});

// Socket operations
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('join', function(name){
    // Search for corresponding username
    User.findOne({username: name}, function(err, user){
      if (err){
        // Create database entry for new user
        var new_user = new User({
          username: name,
          chat_room: [],
          chat_message: []
        });
        console.log('new user');
        console.log(new_user);

        // Save new entry
        new_user.save(function(err){
          if (err){
            console.log('User registration failed');
          } else {
            console.log('User entry successfully created');
          }
        });
        // Redirect to chat
        io.emit('redirect', '/chat');
        // socket.handshake.session.username = new_user.username;
        // socket.handshake.session.save();

        // socket.request.session.username = new_user.username;
        // socket.request.session.save(function(err){
        //   if(err){
        //     console.log('New: ' + err);
        //   }
        // });

        // socket.session.username = new_user.username;
        console.log('New');
      } else {
        console.log('old user');
        console.log(user);

        // Redirect to chat
        io.emit('redirect', '/chat');
        // socket.handshake.session.username = user.username;
        // socket.handshake.session.save();

        // socket.request.session.username = user.username;
        // socket.request.session.save(function(err){
        //   if (err){
        //     console.log('Old Error: ' + err);
        //   }
        // });

        // socket.session.username = user.username;
        console.log('Not new');
      }
    });
  });
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
