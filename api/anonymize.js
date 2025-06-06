const admin = require("firebase-admin");
const { readFileSync } = require("fs");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);


  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = async function handler(req, res) {
  // CORS 設定，允許跨來源請求
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing input text" });
    }

    // 呼叫 OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "你是一位擅長維護隱私的中文編輯。請將輸入文字中任何可能識別出當事人身分的內容（如人名、地名、公司或學校名稱、職稱、社群帳號、聯絡方式、專有名詞等）進行改寫，使用自然但模糊的方式處理，例如「一位朋友」、「某個城市」、「某間公司」、「一所學校」、「主管」、「老師」、「社群帳號」等不具指涉性的詞語。請保留原句語氣與情緒，讓內容聽起來像真實心聲，但不包含可識別資訊。只回傳修改後的句子，不需要任何解釋。"
          },
          {
            role: "user",
            content: text
          }
        ],
      }),
    });

    const resultData = await response.json();

    console.log("🔍 OpenAI 匿名結果：", JSON.stringify(resultData, null, 2));

    const result = resultData?.choices?.[0]?.message?.content?.trim() || "(無結果)";

    try {
      await db.collection("messages").add({
        original: text,
        anonymized: result,
        timestamp: Date.now()
      });
    } catch (dbError) {
      console.error("❌ Firestore 寫入錯誤：", dbError);
      return res.status(500).json({ error: "Failed to save to Firestore" });
    }

    return res.status(200).json({ anonymized: result });

  } catch (err) {
    console.error("❌ 匿名 API 錯誤：", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
