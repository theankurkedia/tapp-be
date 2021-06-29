const app = require('express')();
const http = require('http').createServer(app);
const PORT = 8080;
const io = require('socket.io')(http);
let {
  addUser,
  getUser,
  deleteUser,
  getUsersInRoom,
  getOtherUserInRoom,
} = require('./users');

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

io.on('connection', (socket) => {
  socket.on('login', ({ name, room }, callback) => {
    console.log(name, ' joined');
    const { user, error } = addUser(socket.id, name, room);
    if (error) return callback({ error });
    socket.join(user.room);
    socket.in(room).emit('notification', {
      title: "Someone's here",
      description: `${user.name} just entered the room`,
    });
    io.in(room).emit('users', getUsersInRoom(room));
    callback({ success: true });
  });

  socket.on('sendMessage', (message) => {
    const user = getUser(socket.id);
    if (user) {
      let other = getOtherUserInRoom(user.room, user.name);
      if (other) {
        io.to(other.id).emit('message', { user: user.name, text: message });
      }
    }
  });

  socket.on('updateScore', () => {
    const user = getUser(socket.id);
    if (user) {
      let other = getOtherUserInRoom(user.room, user.name);
      if (other) {
        io.to(other.id).emit('scoreUpdated', { user: user.name });
      }
    }
  });

  socket.on('gameOver', () => {
    const user = getUser(socket.id);
    if (user) {
      let other = getOtherUserInRoom(user.room, user.name);
      if (other) {
        io.to(other.id).emit('announceWinner', { user: user.name });
      }
    }
  });

  socket.on('reset', () => {
    const user = getUser(socket.id);
    if (user) {
      let other = getOtherUserInRoom(user.room, user.name);
      if (other) {
        io.to(other.id).emit('resetGame', { user: user.name });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    const user = deleteUser(socket.id);
    if (user) {
      let other = getOtherUserInRoom(user.room, user.name);
      if (other) {
        io.to(other.id).emit('notification', {
          title: 'Someone just left',
          description: `${user.name} just left the room`,
        });
      }
      io.in(user.room).emit('users', getUsersInRoom(user.room));
    }
  });
});
