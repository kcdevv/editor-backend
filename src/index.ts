import WebSocket, { WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT as number });

interface RoomData {
  slug: string;
  code: string;
  output: string;
  language: string;
}

// Store WebSocket connections in memory per room for broadcasting
const activeConnections: { [key: string]: WebSocket[] } = {};

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (data) => {
    try {
      const message = data.toString();
      const messageData = JSON.parse(message);

      if (messageData.type === "join") {
        let room = await prisma.room.findUnique({
          where: { slug: messageData.room },
        });

        // If room doesn't exist, create it in the database
        if (!room) {
          room = await prisma.room.create({
            data: { slug: messageData.room },
          });
        }

        if (!activeConnections[messageData.room]) {
          activeConnections[messageData.room] = [];
        }
        activeConnections[messageData.room].push(ws);

        ws.send(
          JSON.stringify({
            type: "joined",
            room: room.slug,
            code: room.code,
            output: room.output,
            language: room.language,
          })
        );
      }

      if (messageData.type === "code") {
        const roomSlug = messageData.room;

        // Update room code, output, and language in Prisma
        await prisma.room.update({
          where: { slug: roomSlug },
          data: {
            code: messageData.code,
            output: messageData.output,
            language: messageData.language,
          },
        });

        // Broadcast the updated code to all other clients in the same room
        if (activeConnections[roomSlug]) {
          activeConnections[roomSlug].forEach((socket) => {
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
    // Clean up connections when a client disconnects
    for (const roomSlug in activeConnections) {
      activeConnections[roomSlug] = activeConnections[roomSlug].filter(
        (socket) => socket !== ws
      );

      // Remove the room from active connections if it's empty
      if (activeConnections[roomSlug].length === 0) {
        delete activeConnections[roomSlug];
      }
    }
    console.log("Client disconnected");
  });
});
