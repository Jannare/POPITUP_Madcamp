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
    // 중복 uid 확인
    const checkQuery = 'SELECT u_id FROM Users WHERE u_id = ?';
    const [existingUser] = await conn.query(checkQuery, [u_id]);

    if (existingUser.length > 0) {
      conn.release();
      return res.status(400).json({ error: '이미 존재하는 ID입니다. 다른 ID를 사용해주세요.' });
    } else {
      // 새로운 사용자 생성
      const insertQuery = 'INSERT INTO Users (u_id, u_password, u_nickname) VALUES (?, ?, ?)';
      await conn.query(insertQuery, [u_id, u_password, u_nickname]);
      conn.release();
      res.status(201).json({ u_id, u_nickname });
    }
  } catch (error) {
    conn.release();
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    // uid로 사용자 정보 조회
    let [rows, fields] = await conn.query(query, [u_id]);
    conn.release();
    
    if (rows.length > 0) {
      const user = rows[0];
      // 비밀번호 확인
      if (user.u_password === u_password) {
        // 로그인 성공 시 유저 정보 반환
        const { u_id, u_nickname } = user;
        res.status(200).json({ u_id, u_nickname });
      } else {
        // 비밀번호가 일치하지 않는 경우
        res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
      }
    } else {
      // uid가 존재하지 않는 경우
      res.status(404).json({ message: '해당 ID를 찾을 수 없습니다.' });
    }
  } catch (error) {
    conn.release();
    res.status(500).json({ message: '로그인 중 오류가 발생했습니다.', error });
  }
});



// // 유저 정보 불러오기
// router.get('/get/:uid', async (req, res) => { 
//   //Express router method, 이 경로(./)로 요청이 들어오면 실행
//   const uid = req.params.uid; // URL 파라미터에서 id 값을 가져옴
//   const conn = await getConn(); 
//   //conn이 비동기함수 getConn을 불러옴 선언 (비동기 함수는 서버와 DB가 하나씩 주고 받지 않아도 됨.)
//   const query = 'SELECT uid, upassword, unickname FROM Users WHERE uid = ?'; 
//   //실행할 SQL을 선언 FROM이하의 테이블에서 다음과 같은 'TEST_ID', 'TEST_TXT'를 보냄

//   try {

//     // 업데이트된 데이터를 선택
//     let [rows, fields] = await conn.query(query, [uid]);
//     conn.release();
//     console.log(rows)

//     if (rows.length > 0) {
//       res.send(rows[0]); // 결과 행을 포함해 데이터 전송
//     } else {
//       res.status(404).send({ message: 'userdata not found' });
//     }
//   } catch (error) {
//     conn.release();
//     res.status(500).send({ message: 'Error fetching data', error });
//   }
// });
// // mysql-node.js

module.exports = router;
