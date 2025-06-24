const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require("cors");

const app = express();

app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

let canvasJson = null;
let lastUpdateTime = 0;

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('request-canvas-state', () => {
    console.log('Client requested canvas state:', socket.id);
    
    if (canvasJson) {
      console.log('Sending existing canvas to client:', socket.id, 'Objects:', canvasJson.objects ? canvasJson.objects.length : 0);
      socket.emit('canvas-data', canvasJson);
    } else {
      console.log('No existing canvas data, sending empty canvas');
      const emptyCanvas = {
        version: "5.2.4",
        objects: [],
        background: "#fff"
      };
      socket.emit('canvas-data', emptyCanvas);
    }
  });

  socket.on('canvas-data', (data) => {
    const now = Date.now();
    
    
    if (now - lastUpdateTime < 16) { 
      return;
    }
    
    lastUpdateTime = now;
    
    
    canvasJson = data;
    console.log('Broadcasting real-time canvas update from:', socket.id, 'Objects:', data.objects ? data.objects.length : 0);
    
    
    socket.broadcast.emit('canvas-data', data);
  });

  socket.on('cursor-position', (data) => {
    socket.broadcast.emit('cursor-position', {
      ...data,
      socketId: socket.id
    });
  });

  socket.on('user-info', (userInfo) => {
    socket.broadcast.emit('user-joined', {
      socketId: socket.id,
      userInfo: userInfo
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    socket.broadcast.emit('user-left', {
      socketId: socket.id
    });
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT,"0.0.0.0", () => {
  console.log(`Real-time Socket.IO server running on port ${PORT}`);
  console.log('Features enabled: WebSocket transport, real-time canvas sync');
});

