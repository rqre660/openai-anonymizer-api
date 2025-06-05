export default async function handler(req, res) {
  const { text } = req.body;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing API key" });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
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

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content ?? "(處理失敗)";
  res.status(200).json({ result });
}
