var express = require('express');
var router = express.Router();
const mysql = require('mysql2/promise');
const axios = require('axios');
const path = require('path');
const multer =require('multer');


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
    const response = await axios.post('https://api.gemini.com/v1/endpoint', {
      message: message
    }, {
      headers: {
        'Authorization': `Bearer ${geminiAPIKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    return null;
  }
}

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
  
    const geminiResponse = await getResponseFromGemini(userMessage);
  
    if (geminiResponse) {
      res.json({ response: geminiResponse });
    } else {
      res.status(500).json({ error: 'Failed to get response from Gemini API' });
    }
  });
  
