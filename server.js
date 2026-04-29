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

// Rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة
  max: 20 // 20 طلب فقط
});

app.use(limiter);

// ========================================
// 🔹 إعدادات Gemini
// ========================================
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

// تنبيه إذا المفتاح ناقص
if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
}

// ========================================
// 🔹 Function Gemini (بدون تغيير)
// ========================================
async function askGemini(prompt) {
  try {
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

    const data = await response.json();

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ لا يوجد رد"
    );
  } catch (err) {
    console.error("Gemini Error:", err);
    return "❌ خطأ في الاتصال";
  }
}

// ========================================
// 🔹 API الشرح الذكي
// ========================================
app.post("/api/explain", async (req, res) => {
  const { question, answer } = req.body;

  const prompt = `
اشرح السؤال التالي لطلاب اختبار القدرات الكمي بطريقة واضحة وممتعة.

الشروط:
- الشرح يكون متوسط الطول
- استخدم إيموجي بسيطة
- اجعل الشرح سهل الفهم
- قسم الشرح بعناوين واضحة

📌 السؤال:
${question}

✅ الإجابة الصحيحة:
${answer}
`;

  const result = await askGemini(prompt);
  res.json({ result });
});

// ========================================
// 🔹 API سؤال مشابه
// ========================================
app.post("/api/similar", async (req, res) => {
  const { question } = req.body;

  const prompt = `
أنشئ سؤال قدرات كمي مشابه لهذا السؤال.

الشروط:
- أعط السؤال
- 4 خيارات (A,B,C,D)
- حدّد الإجابة الصحيحة

السؤال الأصلي:
${question}
`;

  const result = await askGemini(prompt);
  res.json({ result });
});

// ========================================
// 🔹 API الشات الذكي
// ========================================
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  const prompt = `
أنت مساعد متخصص فقط في اختبار القدرات الكمي.

القواعد:
- أجب فقط على أسئلة القدرات الكمي
- إذا كان السؤال خارج القدرات اعتذر بلطف
- أعط شرح واضح ومختصر

سؤال المستخدم:
${message}
`;

  const reply = await askGemini(prompt);
  res.json({ reply });
});

// ========================================
// 🔹 API خطة المذاكرة
// ========================================
app.post("/api/plan", async (req, res) => {
  const { level, weeks } = req.body;

  const prompt = `
أنشئ خطة مذاكرة قدرات كمي

المستوى: ${level}
عدد الأسابيع: ${weeks}

قسّمها على أيام ومهام يومية.
`;

  const plan = await askGemini(prompt);
  res.json({ plan });
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
