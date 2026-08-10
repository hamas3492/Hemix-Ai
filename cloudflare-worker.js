// Hemix AI - AgentRouter Proxy Worker
// Deploy on Cloudflare Workers (free) to bypass Aliyun WAF IP blocking
// 
// Setup:
// 1. Go to https://dash.cloudflare.com → Workers & Pages → Create
// 2. Name it "hemix-proxy" and paste this code
// 3. Go to Settings → Variables → Add:
//    AGENTROUTER_API_KEY = your_agentrouter_api_key
// 4. Deploy and copy the Worker URL (e.g. https://hemix-proxy.your-name.workers.dev)

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (request.method === "GET") {
      return new Response(JSON.stringify({ status: "ok", service: "hemix-proxy" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST supported" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.text();
      const apiKey = env.AGENTROUTER_API_KEY;

      if (!apiKey) {
        return new Response(JSON.stringify({ error: "AGENTROUTER_API_KEY not set" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const response = await fetch("https://agentrouter.org/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Originator": "codex_cli_rs",
          "User-Agent": "codex_cli_rs/0.101.0 (Mac OS 26.0.1; arm64) Apple_Terminal/464",
          "Version": "0.101.0",
        },
        body: body,
      });

      // Stream response back
      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", "*");

      return new Response(response.body, {
        status: response.status,
        headers: headers,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
