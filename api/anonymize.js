export default async function handler(req, res) {
  // 加上 CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // 預檢請求快速回應
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await req.json();
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
            content: "請將以下文字中的人名、地名、公司名、學校名、組織名匿名化，用較中性詞語取代。保持語意和情感。",
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    const data = await response.json();
    res.status(200).json({ result: data.choices?.[0]?.message?.content ?? "(無結果)" });
  } catch (error) {
    console.error("匿名處理錯誤：", error);
    res.status(500).json({ error: "OpenAI request failed" });
  }
}
