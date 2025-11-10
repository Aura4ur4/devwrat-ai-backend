import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages[] required" });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const model = "gemini-1.5-flash"; // fast & works well for short chat

    const userMessage = messages.map(m => m.content).join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topP: 0.9,
            maxOutputTokens: 512
          }
        })
      }
    );

    const data = await response.json();

    // Improved text extraction:
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output ||
      data?.candidates?.[0]?.content?.parts?.[0]?.data ||
      "Hmm... I couldn’t generate a reply.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
