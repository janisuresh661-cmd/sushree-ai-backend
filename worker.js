export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    // Health check
    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          online: true,
          message: "Sushree AI is ready."
        }),
        {
          status: 200,
          headers: cors
        }
      );
    }

    // Only POST is allowed for chat
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Method not allowed."
        }),
        {
          status: 405,
          headers: cors
        }
      );
    }

    try {
      const body = await request.json();

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
          {
            status: 400,
            headers: cors
          }
        );
      }

      // Gemini API key stored securely in Cloudflare
      if (!env.GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "GEMINI_API_KEY is not configured."
          }),
          {
            status: 500,
            headers: cors
          }
        );
      }

      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text:
                    "You are Sushree AI, a helpful, friendly and intelligent AI assistant. Answer clearly, naturally and helpfully."
                }
              ]
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: message
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await geminiResponse.json();

      if (!geminiResponse.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Gemini API error.",
            details: data
          }),
          {
            status: 502,
            headers: cors
          }
        );
      }

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I couldn't generate a response right now.";

      return new Response(
        JSON.stringify({
          success: true,
          reply: reply
        }),
        {
          status: 200,
          headers: cors
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server error.",
          details: error.message
        }),
        {
          status: 500,
          headers: cors
        }
      );
    }
  }
};
