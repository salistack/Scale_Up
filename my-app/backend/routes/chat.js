const express = require('express');
const router = express.Router();
const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MENTOR_SYSTEM_PROMPT = `You are an experienced business mentor and entrepreneurship advisor. Your role is to provide practical, actionable advice to entrepreneurs and startup founders.

Your expertise includes:
- Business strategy and planning
- Marketing and customer acquisition
- Fundraising and investor relations
- Product development
- Team building and leadership
- Financial management
- Scaling businesses

Guidelines:
- Be encouraging and supportive
- Provide specific, actionable advice
- Ask clarifying questions when needed
- Share relevant examples and best practices
- Keep responses concise but informative (2-3 paragraphs max)
- If asked about topics outside business/entrepreneurship, politely redirect to business topics

Always maintain a professional yet friendly tone.`;

router.post('/mentor', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    console.log('=== Chat Request ===');
    console.log('Message:', message);
    console.log('GROQ_API_KEY exists:', !!GROQ_API_KEY);
    console.log('GROQ_API_KEY length:', GROQ_API_KEY?.length);
    console.log('GROQ_API_KEY first 10 chars:', GROQ_API_KEY?.substring(0, 10));

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!GROQ_API_KEY || GROQ_API_KEY.trim() === '') {
      console.error('GROQ_API_KEY is not set in environment variables');
      return res.status(500).json({ 
        error: 'AI service not configured. Please contact administrator.',
        debug: 'API key missing'
      });
    }

    const messages = [
      { role: 'system', content: MENTOR_SYSTEM_PROMPT }
    ];

    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    });

    messages.push({
      role: 'user',
      content: message
    });

    console.log('Calling Groq API with model: llama-3.1-8b-instant');
    console.log('Number of messages:', messages.length);

    const response = await axios.post(GROQ_API_URL, {
      model: 'llama-3.1-8b-instant',
      messages: messages,
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('Groq API response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    const aiResponse = response.data.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    console.log('Groq response received successfully');
    console.log('Response length:', aiResponse.length);
    
    res.json({ response: aiResponse });

  } catch (error) {
    console.error('=== Chat Error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response headers:', error.response.headers);
      
      return res.status(error.response.status).json({ 
        error: 'AI service error',
        details: `Groq API returned ${error.response.status}`,
        message: error.response.data?.error?.message || error.response.data?.message || 'Unknown error',
        statusCode: error.response.status
      });
    } else if (error.request) {
      console.error('No response received from Groq API');
      console.error('Request:', error.request);
      
      return res.status(503).json({ 
        error: 'Failed to connect to AI service',
        details: 'No response received from server'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get mentor response',
      details: error.message 
    });
  }
});

module.exports = router;
