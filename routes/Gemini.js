const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const axios = require('axios');
require('dotenv').config();
const {GoogleGenerativeAI} = require('@google/generative-ai');
const { text } = require('stream/consumers');


const pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'madcamp123',
    database: 'testDB'
});

const geminiAPIKey = process.env.GEMINI_API_KEY;
const gemini = new GoogleGenerativeAI(geminiAPIKey);



router.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  
  // 로그 추가
  console.log('Received message:', userMessage);

  async function chat(prompt){
    try{
        const model = gemini.getGenerativeModel({model: 'gemini-pro'});
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        if (text) {
            res.status(200).send(text); // 전체 데이터 전송
            console.log(text);
            return 200
        }

    }

    catch (error){
        console.error(`서버 에러가 발생했습니다: ${error}`);
    }
    chat(userMessage);
    

}
});

module.exports = router;
