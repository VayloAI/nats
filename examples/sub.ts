import { NatsMessage } from "../src/types/client";
import { client } from "./client";

const consumer = await client.getConsumer({
  stream: "test_stream",
  name: "test_client",
});

// eslint-disable-next-line @typescript-eslint/require-await
await client.consume(consumer, async (msg: NatsMessage) => {
  client.logger.info(`${msg.seq}, ${msg.redelivered}, ${msg.string()}`);
  client.logger.info(msg.headers);
});
