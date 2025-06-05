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
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing input text" });
    }

    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: "請將以下句子中的人名、地名、公司名、組織名等可識別資訊匿名化，替換為更中性的描述，保留情感與語意。",
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    const resultData = await apiResponse.json();

    if (!resultData.choices || resultData.choices.length === 0) {
      return res.status(500).json({ error: "No response from OpenAI" });
    }

    const result = resultData.choices[0].message.content;
    res.status(200).json({ result });
  } catch (error) {
    console.error("處理錯誤：", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
