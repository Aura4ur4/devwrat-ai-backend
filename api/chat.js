export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  let model = "gemini-2.5-flash"; // primary
  const fallbackModel = "gemini-flash-latest"; // backup when overloaded

  try {
    const userMessages = req.body.messages || [];
    const prompt = userMessages.map(m => `${m.role}: ${m.content}`).join("\n");

    async function generate(modelName) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      return response.json();
    }

    // Try main model first
    let data = await generate(model);

    // Fallback if model is overloaded
    if (data.error && data.error.status === "UNAVAILABLE") {
      console.warn("Primary model overloaded, retrying with fallback...");
      data = await generate(fallbackModel);
    }

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      console.error("No valid response from Gemini:", data);
      return res.status(200).json({ reply: "⚠️ No reply generated. Please try again." });
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
}
