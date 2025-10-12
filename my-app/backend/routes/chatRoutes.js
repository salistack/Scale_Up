const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Check if Gemini API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️ GEMINI_API_KEY is not set in .env file!");
}

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { v4: uuidv4 } = require('uuid');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const models = [
    'gemini-1.5-flash-latest',
    'gemini-pro'
];

let chat;
let chatHistory = [];

// System prompt for business mentor
const SYSTEM_PROMPT = `You are an experienced business mentor and startup advisor. Your role is to provide guidance on:
- Business strategy and planning
- Marketing and customer acquisition
- Funding and financial management
- Product development and validation
- Team building and leadership
- Market research and competitive analysis
- Scaling and growth strategies

Provide concise, actionable advice. Be encouraging but realistic. Ask clarifying questions when needed. Keep responses under 200 words unless the user specifically asks for detailed information.`;

// List available models endpoint
router.get("/models", async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({ error: "Gemini AI not initialized" });
    }

    const models = await genAI.listModels();
    console.log("📋 Available models:", models);
    
    res.json({
      models: models.map(m => ({
        name: m.name,
        displayName: m.displayName,
        supportedMethods: m.supportedGenerationMethods
      }))
    });
  } catch (error) {
    console.error("Error listing models:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/mentor", auth, async (req, res) => {
  try {
    console.log("📩 Received chat request from user:", req.user.userId);
    
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Check if Gemini is initialized
    if (!genAI || !GoogleGenerativeAI) {
      console.error("Gemini AI not initialized");
      return res.status(500).json({ 
        error: "AI service not available. Please check server configuration.",
        details: "Gemini AI package not installed or initialized"
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not set");
      return res.status(500).json({ 
        error: "AI service not configured. Please contact administrator.",
        details: "Missing API key"
      });
    }

    console.log("🤖 Processing message:", message.substring(0, 50) + "...");

    // Try models in order of preference
    const modelsToTry = [
      "gemini-1.5-flash-latest",
      "gemini-pro"
    ];

    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 Trying model: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
        });

        // Map frontend history to Gemini's format
        const chatHistory = (history || []).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 500,
          },
        });

        const result = await chat.sendMessage(message);
        response = result.response.text();
        
        console.log(`✅ Success with model: ${modelName}`);
        break; // Success, exit loop
        
      } catch (error) {
        console.log(`❌ Failed with ${modelName}:`, error.message);
        lastError = error;
        continue; // Try next model
      }
    }

    if (!response) {
      throw lastError || new Error("All models failed");
    }

    console.log("✅ Generated response successfully");

    res.json({
      response,
      success: true,
    });
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    console.error("Error details:", error.message);
    
    res.status(500).json({
      error: "Failed to process your request. Please try again.",
      details: error.message,
    });
  }
});

module.exports = router;
