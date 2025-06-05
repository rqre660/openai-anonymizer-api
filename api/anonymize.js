export default async function handler(req, res) {
  // ✅ 正確 CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body; // ✅ 正確寫法，直接取 req.body（不是 req.json()）

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing input text" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "請將句子中可能涉及人名、地名、公司、學校的部分進行匿名處理，替換成更中性的描述，保持語意完整。",
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    const resultData = await response.json();

    const result = resultData?.choices?.[0]?.message?.content ?? "(無結果)";
    return res.status(200).json({ result });
  } catch (err) {
    console.error("匿名處理錯誤：", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
