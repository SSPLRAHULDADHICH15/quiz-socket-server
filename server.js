const { createServer } = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = dev ? "*" : process.env.CORS_ORIGIN || "*";

const httpServer = createServer();

const io = new Server(httpServer, {
  pingInterval: 10000,
  pingTimeout: 20000,
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

let buzzerLocked = false;

io.on("connection", (socket) => {
  if (dev) console.log(`Client connected: ${socket.id}`);

  socket.on("disconnect", (reason) => {
    if (dev) console.log(`Client ${socket.id} disconnected: ${reason}`);
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });

  // Quiz events
  socket.on("showQuestion", (data) => io.emit("showQuestion", data));
  socket.on("hideQuestion", (data) => io.emit("hideQuestion", data));
  socket.on("navigateQuestion", (data) => io.emit("navigateQuestion", data));
  socket.on("timerUpdate", (data) => io.emit("timerUpdate", data));
  socket.on("resetTimer", (data) => io.emit("resetTimer", data));
  socket.on("stopTimer", () => io.emit("stopTimer"));
  socket.on("revealAnswer", (data) => io.emit("revealAnswer", data));
  socket.on("scoreUpdate", (data) => io.emit("scoreUpdate", data));
  socket.on("roundChange", (data) => io.emit("roundChange", data));
  socket.on("buzzerLocked", (data) => io.emit("buzzerLocked", data));

  socket.on("buzzerPressed", (data) => {
    if (buzzerLocked) return;
    buzzerLocked = true;
    io.emit("buzzerPressed", data);
    io.emit("stopTimer");
  });

  socket.on("resetBuzzer", () => {
    buzzerLocked = false;
    io.emit("resetBuzzer");
  });

  socket.on("buzzersUpdate", (buzzes) => io.emit("buzzersUpdate", buzzes));
});

// Graceful shutdown
let shuttingDown = false;
process.on("SIGINT", () => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("Shutting down Socket.IO server...");
  io.close();
  httpServer.close(() => process.exit(0));
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running at ${dev ? `http://localhost:${PORT}` : `production`}`);
});
