export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    // Health check
    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "online",
          message: "Sushree AI is ready."
        }),
        { status: 200, headers: cors }
      );
    }

    // Chat API
    if (request.method === "POST") {
      try {
        let body = {};

        try {
          body = await request.json();
        } catch {
          body = {};
        }

        const message =
          typeof body.message === "string"
            ? body.message.trim()
            : "";

        if (!message) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Message is required."
            }),
            { status: 400, headers: cors }
          );
        }

        // Use Cloudflare Workers AI when an AI binding exists.
        if (env.AI) {
          const result = await env.AI.run(
            "@cf/meta/llama-3.1-8b-instruct",
            {
              messages: [
                {
                  role: "system",
                  content:
                    "You are Sushree AI, a helpful, friendly and intelligent AI assistant."
                },
                {
                  role: "user",
                  content: message
                }
              ]
            }
          );

          return new Response(
            JSON.stringify({
              success: true,
              reply:
                result?.response ||
                "I couldn't generate a response right now."
            }),
            { status: 200, headers: cors }
          );
        }

        // Safe response if AI binding has not been connected yet.
        return new Response(
          JSON.stringify({
            success: true,
            reply:
              "Sushree AI is online. The AI engine still needs to be connected."
          }),
          { status: 200, headers: cors }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Backend error.",
            details: error?.message || "Unknown error"
          }),
          { status: 500, headers: cors }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed."
      }),
      { status: 405, headers: cors }
    );
  }
};
