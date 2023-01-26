# prpc

rpc/channel communication based on libp2p

## example
**rpc**
```typescript
import { serve, fetch } from "prpc"

// server side
const { handle } = serve(libp2p)
await handle("add", (data: number) => data + 1)

// client side
const stream = await libp2p.dialProtocol(addr, "add")
await fetch(stream, 1) // 2
```

**channel**
```typescript
import { serve, open } from "prpc"

// server side
const { channel } = serve(libp2p)
await channel("adding", ({ inputChannel, outputChannel }) =>
    inputChannel.attach((data: number) => {
      let n = 0
      setInterval(() => {
        n += 1
        outputChannel.post(data + n)
      }, 1000)
    }),
)

// client side
const stream = await libp2p.dialProtocol(addr, "adding")
const { inputChannel, outputChannel } = open(stream)
inputChannel.post(1)
for await (const msg of outputChannel) {
    console.log(msg) // 2 3 4 5 ...
}
```

