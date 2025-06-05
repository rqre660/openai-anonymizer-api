export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await req.json(); // ✅ 這一行是關鍵！
    const { text } = body;

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
            content: "請將以下文字中的人名、地名、公司名、學校名、組織名等容易識別的資訊匿名化，用較中性描述取代。保留原意與情緒。",
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content ?? "(無結果)";
    res.status(200).json({ result });
  } catch (error) {
    console.error("匿名處理失敗：", error);
    res.status(500).json({ error: "OpenAI request failed" });
  }
}
