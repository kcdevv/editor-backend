import express from "express";
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

const wss = new WebSocketServer({ server, host: "0.0.0.0" });

interface Room {
  slug: string;
  code: string;
  output: string;
  sockets: WebSocket[];
  language: string;
}

const rooms: Room[] = [];

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message: string) => {
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
  });

  ws.on("close", () => {
    rooms.forEach((room) => {
      room.sockets = room.sockets.filter((socket) => socket !== ws);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
