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

// 특정 p_id에 해당하는 데이터를 가져오는 라우터
router.get('/get/:p_id', async (req, res) => {
  const p_id = req.params.p_id; // URL 파라미터에서 pid 값을 가져옴
  const conn = await getConn();

  const selectQuery = 'SELECT p_id, p_name, p_location, p_region, p_latitude, p_longitude, p_startdate, p_enddate, startdate, enddate, p_status, p_intro, p_detail, p_interest, p_imageurl, startdate, enddate FROM popupstore WHERE p_id = ?';
  const filename = `${p_id}image.png`;
  const filepath = `http://3.34.41.15:3000/images/${filename}`; // 로컬 파일 경로를 URL 경로로 변환

  const updateQuery = 'UPDATE popupstore SET p_imageurl = ? WHERE p_id = ?';
  const updateStatusQuery = `
  UPDATE popupstore
  SET p_status = CASE
      WHEN CURDATE() < p_startdate THEN '예정'
      WHEN CURDATE() BETWEEN p_startdate AND p_enddate THEN '진행중'
      WHEN CURDATE() > p_enddate THEN '종료'
  END
  WHERE p_id = ?;`;



  try {
    // p_imageurl 필드를 업데이트
    await conn.query(updateQuery, [filepath, p_id]);
    await conn.query(updateStatusQuery, [p_id]);

    // 업데이트된 데이터를 선택
    let [rows, fields] = await conn.query(selectQuery, [p_id]);
    conn.release();

    if (rows.length > 0) {
      // 날짜 필드를 년/월/일 형식으로 변환
      const row = rows[0];
      const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = ('0' + (d.getMonth() + 1)).slice(-2);
        const day = ('0' + d.getDate()).slice(-2);
        return `${year}/${month}/${day}`;
      };
      
      conn.release();
      row.p_startdate = formatDate(startdate);
      row.p_enddate = formatDate(enddate);

      res.send(row); // 결과 행을 포함해 데이터 전송
    } else {
      res.status(404).send({ message: 'Record not found' });
    }
  } catch (error) {
    conn.release();
    res.status(500).send({ message: 'Error fetching data', error });
  }
});



module.exports = router;
