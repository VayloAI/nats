import {
  connect,
  ConnectionOptions,
  NatsConnection,
} from "@nats-io/transport-node";
import { Consumer, jetstream, jetstreamManager } from "@nats-io/jetstream";

import {
  ConsumeFn,
  ConsumerOptions,
  Logger,
  NatsClientOptions,
} from "./types/client";

export class NatsClient {
  connection: ConnectionOptions;
  nc?: NatsConnection;
  logger: Logger;

  maxAge = 86_400 * 1e9; // 24 hours

  constructor({ connection, logger = console }: NatsClientOptions) {
    this.connection = connection;
    this.logger = logger;
  }

  async connect() {
    this.nc = await connect(this.connection);
    this.logger.debug(`Connected to NATS with ${this.nc.getServer()}`);

    void this.nc.closed().then(() => {
      this.logger.debug("NATS connection closed!");
    });

    return this;
  }

  /**
   * Get consumer if exists, otherwise add new consumer and return it
   */
  async getConsumer({ stream, name }: ConsumerOptions) {
    if (!this.nc) {
      throw new Error("Client isn't connected");
    }

    const jsm = await jetstreamManager(this.nc);
    const js = jetstream(this.nc);
    try {
      return await js.consumers.get(stream, name);
    } catch {
      await jsm.consumers.add(stream, {
        ack_policy: "explicit",
        deliver_policy: "new",
        name,
        durable_name: name,
      });
      return await js.consumers.get(stream, name);
    }
  }

  /**
   * Add handler for consumer message
   */
  async consume(consumer: Consumer, asyncFn: ConsumeFn, maxMessages?: number) {
    const msgs = await consumer.consume({
      max_messages: maxMessages,
    });
    for await (const m of msgs) {
      asyncFn(m)
        .then(() => {
          m.ack();
        })
        .catch((err: Error) => {
          this.logger.error(`Failed processing consume: ${err.message}`);
          m.nak();
        });
    }
  }

  async initStream(name: string, subjects: string[], maxAge = this.maxAge) {
    if (!this.nc) {
      throw new Error("Client isn't connected");
    }

    const jsm = await jetstreamManager(this.nc);
    try {
      return await jsm.streams.info(name);
    } catch {
      return await jsm.streams.add({
        name,
        subjects,
        max_age: maxAge,
      });
    }
  }
}
