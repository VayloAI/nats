import { JsMsg } from "@nats-io/jetstream";
import { ConnectionOptions } from "@nats-io/transport-node";

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export type ConsumeFn = (message: JsMsg) => Promise<unknown>;

export type NatsClientOptions = {
  connection: ConnectionOptions;
  logger?: Logger;
};

export type ConsumerOptions = {
  stream: string;
  name: string;
};
