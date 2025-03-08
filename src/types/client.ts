import { JetStreamPublishOptions, JsMsg } from "@nats-io/jetstream";
import { ConnectionOptions, Payload } from "@nats-io/transport-node";

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export type NatsMessage = JsMsg;
export type NatsPayload = Payload;
export type NatsPublishOptions = Partial<JetStreamPublishOptions>;

export type ConsumeFn = (message: NatsMessage) => Promise<unknown>;

export type NatsClientOptions = {
  connection: ConnectionOptions;
  logger?: Logger;
};

export type ConsumerOptions = {
  stream: string;
  name: string;
};
