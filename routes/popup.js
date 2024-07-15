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

router.get('/getAll', async (req, res) => {
  const conn = await getConn();

  const selectAllQuery = 'SELECT * FROM popupstore';

  try {
    const [rows, fields] = await conn.query(selectAllQuery);
    conn.release();

    if (rows.length > 0) {

      res.status(200).send(rows); // 전체 데이터 전송
    } else {
      res.status(404).send({ message: 'No records found' });
    }
  } catch (error) {
    conn.release();
    res.status(500).send({ message: 'Error fetching data', error });
  }
});



// 특정 p_id에 해당하는 데이터를 가져오는 라우터
router.get('/get/:p_id', async (req, res) => {
  const p_id = req.params.p_id; // URL 파라미터에서 pid 값을 가져옴
  const conn = await getConn();

  const selectQuery = 'SELECT p_id, p_name, p_location, p_simplelocation, p_region, p_latitude, p_longitude, p_startdate, p_enddate, p_status, p_intro, p_detail, p_interest, p_imageurl, p_category FROM popupstore WHERE p_id = ?';
  const filename = `${p_id}image.png`;
  const filepath = `http://3.34.195.223:3000/images/${filename}`; // 로컬 파일 경로를 URL 경로로 변환

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
      conn.release();
      res.status(200).send(rows[0]); // 결과 행을 포함해 데이터 전송
    } else {
      res.status(404).send({ message: 'Record not found' });
    }
  } catch (error) {
    conn.release();
    res.status(500).send({ message: 'Error fetching data', error });
  }
});


router.get('/date', async (req, res) => {
  const { date } = req.query; // URL 쿼리 파라미터에서 date 값을 가져옴
  const conn = await getConn();

  const selectQuery = `
    SELECT * FROM popupstore 
    WHERE ? BETWEEN p_startdate AND p_enddate;
  `;

  try {
    // 주어진 date로 쿼리 실행
    const [rows, fields] = await conn.query(selectQuery, [date]);
    
    if (rows.length > 0) {
      res.status(200).send(rows); // 조건을 만족하는 레코드 전송
    } else {
      res.status(404).send({ message: 'No records found' });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});





module.exports = router;
