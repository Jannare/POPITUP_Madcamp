const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const axios = require('axios');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    const conn = await pool.getConnection();
    const userMessage = req.body.message;

    try {
        const [rows] = await conn.query(`
            SELECT p_name, p_location, p_startdate, p_enddate, p_status, p_intro, p_detail, p_category, p_hour 
            FROM popupstore 
            WHERE p_name LIKE ? OR p_intro LIKE ? OR p_detail LIKE ? OR p_location LIKE ? OR p_startdate LIKE ?
        `, [`%${userMessage}%`, `%${userMessage}%`, `%${userMessage}%`, `%${userMessage}%`, `%${userMessage}%`]);


        if (rows.length > 0) {
            // Combine user message with matched p_names
            const popupstoreDetails = rows.map(row => `
                Name: ${row.p_name}
                Location: ${row.p_location}
                Start Date: ${row.p_startdate}
                End Date: ${row.p_enddate}
                Status: ${row.p_status}
                Intro: ${row.p_intro}
                Detail: ${row.p_detail}
                Category: ${row.p_category}
                Hour: ${row.p_hour}
            `).join('\n');

            const queryMessage = `User message: "${userMessage}". Related popupstore details:\n${popupstoreDetails}`;



            // Use GEMINI API to generate content based on the queryMessage
            const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent(queryMessage);
            const response = await result.response;
            const text = await response.text();

            if (text) {
                console.log('Generated response:', text);
                res.status(200).send({ response: text });
            } else {
                res.status(500).send({ error: 'No response from generative model' });
            }
        } else {
            const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent(userMessage);
            const response = await result.response;
            const text = await response.text();
            
            if (text) {
                console.log('Generated response:', text);
                res.status(200).send({ response: text });
            } else {
                res.status(500).send({ error: 'No response from generative model' });
            }
        }
    } catch (error) {
        console.error('서버 에러가 발생했습니다:', error);
        res.status(500).send({ error: 'Server error' });
    } finally {
        conn.release();
    }
});

module.exports = router;
