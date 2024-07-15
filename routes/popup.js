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
router.get('/get/:p_id', async (req, res) => {
  const p_id = req.params.p_id; // URL 파라미터에서 pid 값을 가져옴
  const conn = await getConn();

  const selectQuery = 'SELECT p_id, p_name, p_location, p_latitude, p_longitude, p_startdate, p_enddate, p_status, p_intro, p_detail, p_interest, p_imageurl FROM popupstore WHERE p_id = ?';
  const filename = `${p_id}image.png`;
  const filepath = `/images/${filename}`; // 로컬 파일 경로를 URL 경로로 변환

  const updateQuery = 'UPDATE popupstore SET pimageurl = ? WHERE p_id = ?';
  const updateStatusQuery = `
  UPDATE popupstore
  SET pp_status = CASE
      WHEN CURDATE() < p_startdate THEN '예정중'
      WHEN CURDATE() BETWEEN p_startdate AND p_enddate THEN '진행중'
      WHEN CURDATE() > p_enddate THEN '종료'
  END
  WHERE p_id = ?;`;



  try {
    // pimageurl 필드를 업데이트
    await conn.query(updateQuery, [filepath, p_id]);
    await conn.query(updateStatusQuery, [p_id]);


    // 업데이트된 데이터를 선택
    let [rows, fields] = await conn.query(selectQuery, [p_id]);
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
