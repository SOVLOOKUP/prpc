import { Func, Send, server } from "../src";
import { jsonCodec } from "./jsonCodec";
import type { Data } from "./types";
import { newNode } from "./node";

const repeatingService = async () => {
  let num: number = 0;
  let sender: Send<number>;
  let task: NodeJS.Timeout;

  const func: Func<number, number> = async (data, chan) => {
    const { send, done } = chan;
    if (sender === undefined) sender = send;
    if (data !== 0) {
      // send data instead of num
      num = data;
      clearInterval(task);
      task = setInterval(() => {
        send(num);
      }, 1000);
    } else {
      clearInterval(task);
      await done();
    }
  };
  return func;
};

export const startServer = async () => {
  const libp2p = await newNode();

  // default codec
  const { handle, serve } = server(libp2p);

  await handle<number, number>(
    "add",
    async (data, chan) => {
      // throw new Error("some error");
      await chan.send(data + 1);
      await chan.done();
    },
  );

  await handle<number, number>(
    "adding",
    async (data, chan) => {
      await chan.send(data + 1);
      await chan.send(data + 2);
      await chan.send(data + 3);
      await chan.done();
    },
  );

  // Infinity push handler
  await serve<number, number>(
    "repeating",
    repeatingService,
  );

  await serve<number, number>(
    "channelAdd",
    () => (data, chan) => chan.send(data + 1),
  );

  // json codec
  const json = server(libp2p, { codec: jsonCodec });

  await json.handle<Data, Data>("addJson", async (data, chan) => {
    await chan.send({ value: data.value + 1 });
    await chan.done();
  });

  await json.handle<Data, Data>(
    "addingJson",
    async (input, chan) => {
      await chan.send({ value: input.value + 1 });
      await chan.send({ value: input.value + 2 });
      await chan.send({ value: input.value + 3 });
      await chan.done();
    },
  );

  return libp2p.getMultiaddrs()[0];
};
