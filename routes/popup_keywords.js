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

const getConn = async() => {
  return await pool.getConnection(async (conn) => conn);
};

// 특정 pid에 해당하는 데이터를 가져오는 라우터
router.get('/get/:pid', async (req, res) => {
  const pid = req.params.pid; // URL 파라미터에서 pid 값을 가져옴
  const conn = await getConn();

  const selectQuery = 'SELECT pid, keyword1, keyword2, keyword3, keyword4, keyword5, keyword6, keyword7, keyword8, keyword9, keyword10 FROM popupstore_keywords WHERE pid = ?';;

  try {


    // 업데이트된 데이터를 선택
    let [rows, fields] = await conn.query(selectQuery, [pid]);
    conn.release();
    console.log(rows)


    if (rows.length > 0) {
      res.send(rows[0]); // 결과 행을 포함해 데이터 전송
    } else {
      res.status(404).send({ message: 'Record not found' });
    }
  } catch (error) {
    conn.release();
    res.status(500).send({ message: 'Error fetching data', error });
  }
});

module.exports = router;
