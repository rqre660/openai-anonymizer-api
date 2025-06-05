import admin from "firebase-admin";
import { readFileSync } from "fs";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    readFileSync("./firebase-key.json", "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
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
        temperature: 0.3, // 降低隨機性，保持一致性
        messages: [
          {
            role: "system",
            content:
              "你是一個中文匿名化助手。請將輸入文字中出現的【人名、地名、公司名稱、學校名稱、職稱】進行匿名處理，取代為『某人』、『某地』、『某公司』、『某學校』等。請保留原句語意和語氣，僅回傳修改後的句子，不需要解釋說明。"
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
    
    // ✅ 寫入 Firestore
    await db.collection("messages").add({
      original: text,
      anonymized: result,
      timestamp: Date.now()
    });
    
    return res.status(200).json({ anonymized:result });

  } catch (err) {
    console.error("❌ 匿名 API 錯誤：", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
