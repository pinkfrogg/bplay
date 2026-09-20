import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import fetch from 'node-fetch';

const trpc = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      fetch: fetch,
    }),
  ],
});

async function run() {
  try {
    const list = await trpc.catalog.list.query();
    console.log("Catalog list length:", list.length);
    console.log("First album related releases:", list[0]?.relatedReleases?.length || 0);
  } catch(e) {
    console.error(e);
  }
}
run();
