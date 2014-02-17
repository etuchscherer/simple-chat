var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(3000);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

app.use(app.router);
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/app/bower_components'));
app.use(express.static(__dirname + '/node_modules/socket.io'));

io.sockets.on('connection', function (socket) {

  socket.on('user-joined', function(args) {
    console.log('user just joined');
    console.log(args);
    socket.broadcast.emit('notification', {
      message: args.name + ' just connected'
    });
  });

  socket.on('posted-message', function(args) {
    io.sockets.emit('server-message', args);
    console.log('a message was just posted');
  });
});
