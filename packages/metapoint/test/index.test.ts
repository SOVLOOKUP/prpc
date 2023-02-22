import { h, peer, z } from "../src";
import { describe, expect, test } from "vitest";

const g = h.group({
  context: { name: 1 },
});

const endpoint = h.router({
  numberAdd: g.handler({
    func: async (data, { send, done, ctx }) => {
      await send(data + 1);
      await done();
    },
    input: z.number(),
    output: z.number(),
  }),
  addChan: g.service({
    func: () => async (data, { send }) => {
      await send(data + 1);
    },
    input: z.number(),
    output: z.number(),
  }),
});

const node1 = await peer({ endpoint });
const node2 = await peer();
const channel = await node2.connect<typeof endpoint>(node1.meta().addrs);

describe("test metapoint server/client", async () => {
  test("number test", async () => {
    const n = await channel("numberAdd");
    expect(await n(1)).toStrictEqual([2]);
  });
  test("string add chan", async () => {
    const c = await channel("addChan");
    await c.send(1);
    expect((await c.next()).value).toBe(2);
  });
});
