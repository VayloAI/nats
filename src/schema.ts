import { Type as t, type Static } from "@sinclair/typebox";

export const Config = t.Object({
  servers: t.Array(t.String(), {
    default: ["127.0.0.1:4222"],
    description: "list of nats servers",
  }),
  name: t.String({
    default: "vaylo_client",
    description: "service static name for nats consumer",
  }),
});
export type Config = Static<typeof Config>;
