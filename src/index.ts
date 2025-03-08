import {
  connect,
  ConnectionOptions,
  NatsConnection,
} from "@nats-io/transport-node";
import {
  Consumer,
  JetStreamClient,
  JetStreamManager,
  jetstreamManager,
} from "@nats-io/jetstream";

import {
  ConsumeFn,
  ConsumerOptions,
  Logger,
  NatsClientOptions,
  NatsPayload,
  NatsPublishOptions,
} from "./types/client";

export { MsgHdrsImpl as MessageHeaders } from "@nats-io/nats-core/internal";
export class NatsClient {
  connection: ConnectionOptions;
  nc?: NatsConnection;
  jsm?: JetStreamManager;
  js?: JetStreamClient;
  logger: Logger;

  maxAge = 86_400 * 1e9; // 24 hours

  constructor({ connection, logger = console }: NatsClientOptions) {
    this.connection = connection;
    this.logger = logger;
  }

  async connect() {
    this.nc = await connect(this.connection);
    this.logger.debug(`Connected to NATS with ${this.nc.getServer()}`);

    this.jsm = await jetstreamManager(this.nc);
    this.js = this.jsm.jetstream();
    void this.nc.closed().then(() => {
      this.logger.debug("NATS connection closed!");
    });

    return this;
  }

  isConnected(): this is {
    nc: NatsConnection;
    js: JetStreamClient;
    jsm: JetStreamManager;
  } {
    return (
      this.nc !== undefined && this.js !== undefined && this.jsm !== undefined
    );
  }

  /**
   * Get consumer if exists, otherwise add new consumer and return it
   */
  async getConsumer({ stream, name }: ConsumerOptions) {
    if (!this.isConnected()) {
      throw new Error("Client isn't connected");
    }

    try {
      return await this.js.consumers.get(stream, name);
    } catch {
      await this.jsm.consumers.add(stream, {
        ack_policy: "explicit",
        deliver_policy: "new",
        name,
        durable_name: name,
      });
      return await this.js.consumers.get(stream, name);
    }
  }

  /**
   * Add handler for consumer message
   */
  async consume(consumer: Consumer, asyncFn: ConsumeFn, maxMessages?: number) {
    const msgs = await consumer.consume({
      max_messages: maxMessages,
    });
    for await (const msg of msgs) {
      asyncFn(msg)
        .then(() => {
          msg.ack();
        })
        .catch((err: Error) => {
          this.logger.error(`Failed processing consume: ${err.message}`);
          msg.nak();
        });
    }
  }

  async publish(
    subject: string,
    payload: NatsPayload,
    options?: NatsPublishOptions,
  ) {
    if (!this.isConnected()) {
      throw new Error("Client isn't connected");
    }

    return await this.js.publish(subject, payload, options);
  }

  async initStream(name: string, subjects: string[], maxAge = this.maxAge) {
    if (!this.isConnected()) {
      throw new Error("Client isn't connected");
    }

    try {
      return await this.jsm.streams.info(name);
    } catch {
      return await this.jsm.streams.add({
        name,
        subjects,
        max_age: maxAge,
      });
    }
  }
}
