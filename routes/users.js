var express = require('express');
var router = express.Router();
const mysql = require('mysql2/promise');
const path = require('path');

const pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'madcamp123',
    database: 'testDB'
});

// 사용자 생성 라우트
router.post('/register', async (req, res) => {
  const { u_id, u_password, u_nickname } = req.body;
  const conn = await getConn();

  try {
    console.log('Checking for existing user');
    const checkQuery = 'SELECT u_id FROM Users WHERE u_id = ?';
    const [existingUser] = await conn.query(checkQuery, [u_id]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 ID입니다. 다른 ID를 사용해주세요.' });
    } else {
      console.log('Creating new user');
      const insertQuery = 'INSERT INTO Users (u_id, u_password, u_nickname) VALUES (?, ?, ?)';
      await conn.query(insertQuery, [u_id, u_password, u_nickname]);
      res.status(201).json({ u_id, u_nickname });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

const getConn = async() => {
  return await pool.getConnection(async (conn) => conn);
};

router.post('/login', async (req, res) => {
  const { u_id, u_password } = req.body;
  const conn = await getConn();
  const query = 'SELECT u_id, u_password, u_nickname FROM Users WHERE u_id = ?';

  try {
    console.log('Fetching user for login');
    let [rows, fields] = await conn.query(query, [u_id]);
    
    if (rows.length > 0) {
      const user = rows[0];
      if (user.u_password === u_password) {
        const { u_id, u_nickname } = user;
        res.status(200).json({ u_id, u_nickname });
      } else {
        res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
      }
    } else {
      res.status(404).json({ message: '해당 ID를 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: '로그인 중 오류가 발생했습니다.', error });
  } finally {
    conn.release();
  }
});

router.post('/kakaologin', async (req, res) => {
  const { u_id, u_nickname } = req.body;
  const conn = await getConn();
  const selectQuery = 'SELECT u_id, u_password, u_nickname FROM Users WHERE u_id = ?';
  const insertQuery = 'INSERT INTO Users (u_id, u_password, u_nickname) VALUES (?, ?, ?)';

  try {
    console.log('Fetching user for kakaologin');
    let [rows, fields] = await conn.query(selectQuery, [u_id]);
    
    if (rows.length > 0) {
      const user = rows[0];
      const { u_id, u_nickname } = user;
      res.status(200).json({ u_id, u_nickname });
    } else {
      console.log('Creating new user for kakaologin');
      await conn.query(insertQuery, [u_id, u_id, u_nickname]);
      res.status(201).json({ u_id, u_nickname });
    }
  } catch (error) {
    console.error('Error during kakaologin:', error);
    res.status(500).json({ message: '로그인 중 오류가 발생했습니다.', error });
  } finally {
    conn.release();
  }
});

module.exports = router;
