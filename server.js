import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();

// ========================================
// 🔹 Middleware
// ========================================
app.use(cors());
app.use(express.json());

// Rate limit (حماية من السبام)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20
});
app.use(limiter);

// ========================================
// 🔹 إعدادات Gemini
// ========================================
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
}

// ========================================
// 🔹 Function Gemini (محسنة)
// ========================================
async function askGemini(prompt) {
  try {
    if (!API_KEY) {
      return "❌ API KEY غير مضاف في السيرفر";
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    // 🔴 لو فيه خطأ من Gemini
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return "❌ فشل الاتصال بـ Gemini";
    }

    const data = await response.json();

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ لا يوجد رد"
    );

  } catch (err) {
    console.error("Server Error:", err);
    return "❌ خطأ في السيرفر";
  }
}

// ========================================
// 🔹 API الشرح الذكي
// ========================================
app.post("/api/explain", async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "البيانات ناقصة" });
    }

    const prompt = `
اشرح السؤال التالي لطلاب اختبار القدرات الكمي بطريقة واضحة وممتعة.

الشروط:
- الشرح متوسط
- استخدم إيموجي بسيطة
- اجعل الشرح سهل
- قسم بعناوين

📌 السؤال:
${question}

✅ الإجابة:
${answer}
`;

    const result = await askGemini(prompt);
    res.json({ result });

  } catch (err) {
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// ========================================
// 🔹 API سؤال مشابه
// ========================================
app.post("/api/similar", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "السؤال مطلوب" });
    }

    const prompt = `
أنشئ سؤال قدرات كمي مشابه:

- 4 خيارات (A,B,C,D)
- حدد الإجابة الصحيحة

السؤال:
${question}
`;

    const result = await askGemini(prompt);
    res.json({ result });

  } catch {
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// ========================================
// 🔹 API الشات الذكي
// ========================================
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "الرسالة فارغة" });
    }

    const prompt = `
أنت مساعد متخصص في القدرات الكمي فقط.

القواعد:
- أجب على القدرات فقط
- خارج ذلك اعتذر بلطف
- الشرح يكون واضح ومختصر

سؤال:
${message}
`;

    const reply = await askGemini(prompt);
    res.json({ reply });

  } catch {
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// ========================================
// 🔹 API خطة المذاكرة
// ========================================
app.post("/api/plan", async (req, res) => {
  try {
    const { level, weeks } = req.body;

    if (!level || !weeks) {
      return res.status(400).json({ error: "البيانات ناقصة" });
    }

    const prompt = `
أنشئ خطة مذاكرة قدرات كمي:

المستوى: ${level}
عدد الأسابيع: ${weeks}

قسّمها أيام + مهام يومية
`;

    const plan = await askGemini(prompt);
    res.json({ plan });

  } catch {
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// ========================================
// 🔹 Health Check
// ========================================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ========================================
// 🔹 الصفحة الرئيسية
// ========================================
app.get("/", (req, res) => {
  res.send("🚀 UFUQ AI Server is Running");
});

// ========================================
// 🔹 تشغيل السيرفر
// ========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
