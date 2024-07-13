var express = require('express');
var router = express.Router();

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'madcamp123',
    database: 'testDB'
});

const getConn = async() => {
  return await pool.getConnection(async (conn) => conn);
};

// mysql-node.js
router.get('/', async (req, res) => { 
  //Express router method, 이 경로(./)로 요청이 들어오면 실행
  const conn = await getConn(); 
  //conn이 비동기함수 getConn을 불러옴 선언 (비동기 함수는 서버와 DB가 하나씩 주고 받지 않아도 됨.)
  const query = 'SELECT name, ouccupation FROM testTable'; 
  //실행할 SQL을 선언 FROM이하의 테이블에서 다음과 같은 'TEST_ID', 'TEST_TXT'를 보냄
  let [rows, fields] = await conn.query(query, []); 
  //const query를 통해 가져온 데이터를 [rows, field]로 저장함rows는 쿼리 결과의 행 데이터, field는 결과를 의미.
  conn.release();

  res.send(rows); //결과 행을 포함해 데이터 전송
});
// mysql-node.js

module.exports = router;
