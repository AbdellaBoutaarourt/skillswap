const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const sessions = {};

io.on("connection", socket => {
  socket.on("join-session", sessionId => {
    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }

   //add sessionId to sessions
    if (!sessions[sessionId].includes(socket.id)) {
      sessions[sessionId].push(socket.id);
    }
    socket.join(sessionId);

    // Notify only the second peer to initiate the connection
    if (sessions[sessionId].length === 2) {
      socket.emit("peer-joined");
    }

    // Update users in session
    io.to(sessionId).emit("users-in-session", sessions[sessionId]);
  });

  socket.on("signal", ({ sessionId, data }) => {
    socket.to(sessionId).emit("signal", data);
  });

socket.on("leave-session", sessionId => {
  socket.leave(sessionId);

  if (sessions[sessionId]) {
    sessions[sessionId] = sessions[sessionId].filter(id => id !== socket.id);

    //Notify all participants that someone has left
    io.to(sessionId).emit("peer-disconnected", socket.id);

    if (sessions[sessionId].length === 0) {
      delete sessions[sessionId];
    }

    io.to(sessionId).emit("users-in-session", sessions[sessionId] || []);
  }
});

  socket.on("disconnect", () => {
    for (const sessionId in sessions) {
      sessions[sessionId] = sessions[sessionId].filter(id => id !== socket.id);
      if (sessions[sessionId].length === 0) {
        delete sessions[sessionId];
      } else {
        io.to(sessionId).emit("users-in-session", sessions[sessionId]);
      }
    }
  });
});

const PORT = 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
