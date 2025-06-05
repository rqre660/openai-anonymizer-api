export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body; // ✅ 這裡直接解構，不是 req.json()

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing input text" });
    }

    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "請將以下文字中的地名、人名、公司名、學校名與組織名匿名化，用更中性的描述取代。",
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    const data = await apiResponse.json();

    if (!data.choices || data.choices.length === 0) {
      return res.status(500).json({ error: "No response from OpenAI" });
    }

    const result = data.choices[0].message.content;
    res.status(200).json({ result });
  } catch (error) {
    console.error("匿名處理錯誤：", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
