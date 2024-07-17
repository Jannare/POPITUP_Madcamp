const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const axios = require('axios');
require('dotenv').config();

const pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'madcamp123',
    database: 'testDB'
});

const geminiAPIKey = process.env.GEMINI_API_KEY;

async function getResponseFromGemini(message) {
  try {
    const response = await axios.post('https:/api.gemini.com/v1/order/new', {
      message: message
    }, {
      headers: {
        'Authorization': `Bearer ${geminiAPIKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error communicating with Gemini API:', error.response ? error.response.data : error.message);
    return null;
  }
}

router.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  // 로그 추가
  console.log('Received message:', userMessage);
  console.log('Using API Key:', geminiAPIKey);

  const geminiResponse = await getResponseFromGemini(userMessage);

  if (geminiResponse) {
    res.json({ response: geminiResponse });
  } else {
    res.status(500).json({ error: 'Failed to get response from Gemini API' });
  }
});

module.exports = router;
