const { Server } = require("@hocuspocus/server");

const server = new Server({
  port: 1234,
  
  // You can easily add extensions here in the future
  // e.g., Database persistence, Redis scaling, Authentication, Webhooks
  async onConnect(data) {
    console.log(`[Hocuspocus] User connected to document: ${data.documentName}`);
  },
  
  async onDisconnect(data) {
    console.log(`[Hocuspocus] User disconnected from document: ${data.documentName}`);
  },
});

server.listen();
console.log("Hocuspocus Collaborative Server running on ws://localhost:1234");
