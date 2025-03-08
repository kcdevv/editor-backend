import WebSocket, { WebSocketServer } from "ws";

interface Room {
  slug: string;
  code: string;
  output: string;
  sockets: WebSocket[];
  language: string;
}

const rooms: Room[] = [];

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  ws.on("message", (message: string) => {
    const messageData = JSON.parse(message);

    if (messageData.type === "join") {
      let room = rooms.find((room) => room.slug === messageData.room);
      if (room === undefined) {
        rooms.push({
          slug: messageData.room,
          code: "",
          output: "",
          sockets: [ws],
          language: "javascript",
        });
        room = rooms.find((room) => room.slug === messageData.room);
      } else {
        room.sockets.push(ws);
      }
      const toSend = JSON.stringify({
        type: "joined",
        room: messageData.room,
        code: room!.code,
        output: room!.output,
        language: room!.language,
      });
      ws.send(toSend);
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
    const room = rooms.find((room) => room.sockets.includes(ws));
    if (room) {
      room.sockets = room.sockets.filter((socket) => socket !== ws);
    }
  });
});
