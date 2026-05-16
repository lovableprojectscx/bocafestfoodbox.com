import server from "../dist/server/index.js";

export default async function handler(request, response) {
  const { fetch } = server;
  
  // Convert Node.js request to Web Request
  const protocol = request.headers['x-forwarded-proto'] || 'http';
  const host = request.headers['host'];
  const url = new URL(request.url, `${protocol}://${host}`);
  
  const webRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    // Note: Node.js request body streams are not directly compatible with Web Request body in some contexts,
    // but Vercel might pass it differently. We'll ignore body for GET/HEAD.
    // For POST, we might need a workaround but this is mostly a static SPA or SSR with simple actions.
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request : undefined,
    // For Vercel Edge/Node bridging, duplex is sometimes required for streams.
    duplex: 'half'
  });

  const webResponse = await fetch(webRequest, process.env, { executionCtx: {} });
  
  // Convert Web Response back to Node.js response
  response.status(webResponse.status);
  webResponse.headers.forEach((value, key) => {
    response.setHeader(key, value);
  });
  
  const body = await webResponse.arrayBuffer();
  response.send(Buffer.from(body));
}
