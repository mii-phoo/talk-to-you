const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/login1.html');
});



let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Matchmaking logic
  if (waitingUser) {
    // Waiting ဖြစ်နေသူ ရှိပါက Match ပေးခြင်း
    const peerSocket = waitingUser;
    waitingUser = null;

    socket.emit('matched', { peerId: peerSocket.id, initiator: true });
    peerSocket.emit('matched', { peerId: socket.id, initiator: false });
  } else {
    // မရှိသေးပါက တန်းစီစောင့်ဆိုင်းခိုင်းခြင်း
    waitingUser = socket;
  }

  // Signaling Data (Offer/Answer/ICE)
  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', {
      from: socket.id,
      signal: data.signal
    });
  });

  // Chat messaging
  socket.on('send-message', (data) => {
    io.to(data.to).emit('receive-message', data.message);
  });

  socket.on('disconnect', () => {
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));