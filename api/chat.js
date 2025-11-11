import fetch from "node-fetch";

export default async function handler(req, res) {
  // ✅ Allow CORS from your Netlify site + local dev
  res.setHeader("Access-Control-Allow-Origin", "https://devwrat.in");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // 👈 handle preflight requests
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] required" });
    }

    const userPrompt = messages[messages.length - 1].content;
    const apiKey = process.env.GOOGLE_API_KEY;
    const model = "gemini-1.5-flash-latest";
  
    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 512 }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.error?.message ||
      "No valid reply from Gemini API.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("💥 Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
