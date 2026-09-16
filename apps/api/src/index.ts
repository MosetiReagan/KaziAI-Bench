import { createServer } from "./server.js";

const port = parseInt(process.env.PORT || "4000", 10);
const server = createServer();

server.listen({ port, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`KaziAI Bench API listening at ${address}`);
});
