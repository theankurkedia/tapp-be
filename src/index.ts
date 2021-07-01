const app = require('express')();
const cors = require('cors');
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 8080;

const {
  addUser,
  getUser,
  deleteUser,
  getUsersInRoom,
  getOtherUserInRoom,
} = require('./users');

const { router } = require('./router');

app.use(cors());
app.use(router);

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

io.on('connection', (socket) => {
  socket.on('login', ({ name, room }, callback) => {
    console.log(name, ' joined');
    const { user, error } = addUser(socket.id, name, room);
    if (error) return callback({ error });
    socket.join(user.room);
    let users = getUsersInRoom(room);
    if (users.length === 2) {
      io.in(room).emit('startGame', {
        users,
        user: name,
        room,
      });
    }
    callback({ success: true });
  });

  function sendMessage(type) {
    const user = getUser(socket.id);
    if (user) {
      let other = getOtherUserInRoom(user.room, user.name);
      if (other) {
        io.to(other.id).emit('message', { user: user.name, type });
      }
    }
  }

  socket.on('updateScore', () => {
    sendMessage('scoreUpdated');
  });

  socket.on('gameOver', () => {
    sendMessage('announceWinner');
  });

  socket.on('reset', () => {
    sendMessage('resetGame');
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
