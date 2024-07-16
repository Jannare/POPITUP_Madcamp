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
  const p_id = 'SELECT '

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

  const selectQuery = 'SELECT * FROM popupstore WHERE p_id = ?';
  const filename = `${p_id}image.jpg`;
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


router.post('/date', async (req, res) => {
  const { date } = req.body; //
  const conn = await getConn();

  const selectQuery = `
    SELECT * FROM popupstore 
    WHERE ? BETWEEN p_startdate AND p_enddate;
  `;

  try {
    // 주어진 date로 쿼리 실행
    const [rows] = await conn.query(selectQuery, [date]);
    
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

router.post('/checkFavorite', async (req, res) => {
  const { u_id } = req.body;
  const conn = await getConn();

  const selectQuery = `
    SELECT * FROM popupstore_interest WHERE u_id = ?
  `;

  try {
    const [rows] = await conn.query(selectQuery, [u_id]);
    
    if (rows.length > 0) {
      res.status(200).send(rows);
    } else {
      res.status(404).json({ message: 'No records found' });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});


router.post('/toggleFavorite', async (req, res) => {
  const { u_id, p_id } = req.body;
  const conn = await getConn();

  const selectQuery = `
    SELECT * FROM popupstore_interest WHERE u_id = ? AND p_id = ?
  `;
  
  const countTrueQuery = `
    SELECT COUNT(*) as true_count FROM popupstore_interest WHERE p_id = ? AND u_interest = 'TRUE'
  `;

  const updateQuery = `
    UPDATE popupstore_interest
    SET u_interest = CASE WHEN u_interest = 'TRUE' THEN 'FALSE' ELSE 'TRUE' END
    WHERE u_id = ? AND p_id = ?
  `;

  const updateCountQuery = `
    UPDATE popupstore_interest
    SET count = ?
    WHERE p_id = ?
  `;

  const insertQuery = `
    INSERT INTO popupstore_interest (u_id, p_id, u_interest, count)
    VALUES (?, ?, 'TRUE', 1)
  `;

  try {
    // u_id와 p_id가 일치하는 행 선택
    const [rows] = await conn.query(selectQuery, [u_id, p_id]);
    
    if (rows.length > 0) {
      // 클릭한 유저의 TRUE,FALSE를 바꿈
      await conn.query(updateQuery, [u_id, p_id]);
    } else {
      // 새로운 레코드 추가
      await conn.query(insertQuery, [u_id, p_id]);
    }

    // p_id가 일치하고 u_interest가 'true'인 행의 수를 셈
    const [countRows] = await conn.query(countTrueQuery, [p_id]);
    const trueCount = countRows[0].true_count;

    // count 값을 업데이트
    await conn.query(updateCountQuery, [trueCount, p_id]);

    // 변경된 레코드를 다시 선택
    const [updatedRows] = await conn.query(selectQuery, [u_id, p_id]);

    // 필요한 정보를 하나의 객체로 응답
    const response = {
      u_id: updatedRows[0].u_id,
      p_id: updatedRows[0].p_id,
      count: updatedRows[0].count,
      u_interest: updatedRows[0].u_interest
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});







module.exports = router;
