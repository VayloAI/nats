import { client } from "./client";
import { MessageHeaders } from "../src/index";

const msgHeaders = new MessageHeaders(777, "description");
msgHeaders.set("X-Custom-Header", "Hello wrold!");

await client.publish("test_stream.123", "hello world!", {
  headers: msgHeaders,
});

await client.publish(
  "test_stream.321",
  JSON.stringify({
    hello: "world",
  }),
);

process.exit(0);
