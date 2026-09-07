const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = 3000;

if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY belum ditemukan di file .env");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Simpan history chat per session (sederhana)
let chatHistory = [];
let isFirstMessage = true;

app.post("/api/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;
        const imageBase64 = req.body.image;

        if (!userMessage && !imageBase64) {
            return res.status(400).json({
                error: "Pesan atau gambar tidak boleh kosong"
            });
        }

        let contents = [];
        
        // System instruction untuk ERIC
        let systemPromptText = `Nama Anda adalah ERIC. Anda adalah asisten AI yang ramah dan membantu.

Aturan:
1. Jawab dengan bahasa Indonesia yang natural dan santai seperti chatting.
2. Gunakan paragraf pendek untuk menjelaskan.
3. Gunakan nomor (1., 2., 3.) untuk langkah-langkah.
4. Gunakan tanda pisah (-) untuk poin-poin.
5. Jangan gunakan simbol markdown seperti **, ##, __, dll.
6. Jawab langsung to the point seperti teman ngobrol.`;

        // Tambahkan instruksi perkenalan hanya untuk pertama kali
        if (isFirstMessage) {
            systemPromptText += `\n7. Perkenalkan diri Anda sebagai ERIC di awal percakapan ini.`;
            isFirstMessage = false;
        } else {
            systemPromptText += `\n7. Jangan perkenalkan diri Anda lagi karena sudah kenal. Langsung jawab pertanyaan user.`;
        }

        const systemPrompt = {
            text: systemPromptText
        };
        contents.push(systemPrompt);
        
        // Tambahkan history chat (5 percakapan terakhir)
        const recentHistory = chatHistory.slice(-10);
        for (const msg of recentHistory) {
            contents.push({
                text: msg
            });
        }
        
        if (imageBase64) {
            const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                throw new Error('Format gambar tidak valid');
            }
            
            const mimeType = matches[1];
            const base64Data = matches[2];
            
            contents.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }
        
        if (userMessage) {
            const userText = `User: ${userMessage}`;
            contents.push({
                text: userText
            });
            chatHistory.push(userText);
        }

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: contents
        });

        const reply = response.text;
        chatHistory.push(`ERIC: ${reply}`);

        // Batasi history agar tidak terlalu panjang
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }

        res.json({
            reply: reply
        });

    } catch (error) {
        console.error("Gemini API Error:", error);

        res.status(500).json({
            error: "Terjadi kesalahan saat menghubungi Gemini API"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});