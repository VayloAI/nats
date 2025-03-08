import { NatsClient } from "../src";

export const client = new NatsClient({
  connection: {
    servers: "127.0.0.1:4222",
    name: "test_client",
  },
});

await client.connect();
await client.initStream("test_stream", ["test_stream.*"]);
