import express from "express";
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

const wss = new WebSocketServer({ server });

interface Room {
  slug: string;
  code: string;
  output: string;
  sockets: WebSocket[];
  language: string;
}

const rooms: Room[] = [];

wss.on("connection", (ws, req) => {
  console.log("Client connected");

  ws.on("message", (data) => {
    try {
      const message = data.toString();
      const messageData = JSON.parse(message);

      if (messageData.type === "join") {
        let room = rooms.find((room) => room.slug === messageData.room);
        if (!room) {
          room = {
            slug: messageData.room,
            code: "",
            output: "",
            sockets: [ws],
            language: "javascript",
          };
          rooms.push(room);
        } else {
          room.sockets.push(ws);
        }

        ws.send(
          JSON.stringify({
            type: "joined",
            room: messageData.room,
            code: room.code,
            output: room.output,
            language: room.language,
          })
        );
      }

      if (messageData.type === "code") {
        const room = rooms.find((room) => room.slug === messageData.room);
        if (room) {
          room.code = messageData.code;
          room.output = messageData.output;
          room.language = messageData.language;

          room.sockets.forEach((socket) => {
            if (socket !== ws) {
              socket.send(
                JSON.stringify({
                  type: "code",
                  code: messageData.code,
                  output: messageData.output,
                  language: messageData.language,
                })
              );
            }
          });
        }
      }
    } catch (error) {
      console.error("Invalid WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    rooms.forEach((room, index) => {
      room.sockets = room.sockets.filter((socket) => socket !== ws);
      if (room.sockets.length === 0) {
        rooms.splice(index, 1);
      }
    });
    console.log("Client disconnected");
  });
});

server.listen(PORT, "0.0.0.0" as any,() => {
  console.log(`🚀 Server running on port ${PORT}`);
});
