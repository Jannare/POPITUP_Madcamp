var express = require('express');
var router = express.Router();
const mysql = require('mysql2/promise');
const axios = require('axios');
const path = require('path');
const multer =require('multer');

const pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'madcamp123',
    database: 'testDB'
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }  
});
const upload = multer({ storage: storage });

const getConn = async() => {
  return await pool.getConnection(async (conn) => conn);
};

async function getLatLong(address) {
  const apiKey = 'aaceda4bf7b6797934ac54cf9a2065b7'; // Replace with your actual API key
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`,
        'os': 'web',
        'origin': 'localhost'
      }
    });
    const data = response.data;
    if (data.documents.length > 0) {
      const { x, y } = data.documents[0].address;
      return { longitude: x, latitude: y };
    }
    throw new Error('No coordinates found');
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    throw new Error('Failed to fetch coordinates');
  }
}


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


// const a = Date.now() + path.extname(file.originalname);
// 특정 p_id에 해당하는 데이터를 가져오는 라우터
router.get('/get/:p_id', async (req, res) => {
  const p_id = req.params.p_id; // URL 파라미터에서 pid 값을 가져옴
  const conn = await getConn();
  

  const selectQuery = 'SELECT * FROM popupstore WHERE p_id = ?';
  // const filename = `${a}`;
  const filepath = `http://3.39.143.119:3000/images/${filename}`; // 로컬 파일 경로를 URL 경로로 변환

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
    // await conn.query(updateQuery, [filepath, p_id]); 이젠 굳이?
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

router.post('/myFavorite', async (req, res) => {
  const { u_id} = req.body;
  console.log('u_id:', u_id); // u_id 값을 터미널에 출력
  const conn = await getConn();
  const selectQuery = 'SELECT p_id FROM popupstore_interest WHERE u_id = ? AND u_interest = 1';


  try {
    const [rows] = await conn.query(selectQuery, [u_id]);
    
    if (rows.length > 0) {
      const p_ids = rows.map(row => row.p_id); // p_id 값들을 배열로 추출
      const placeholder = p_ids.map(() => '?').join(', '); // p_id 개수에 맞는 placeholder 생성

      const selectPopupQuery = `
        SELECT * FROM popupstore WHERE p_id IN (${placeholder})
      `;

      const [popupRows] = await conn.query(selectPopupQuery, p_ids);
      res.status(200).json(popupRows);
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

router.post('/myPopupStore', async (req, res) => {
  const {u_id} = req.body;
  console.log('u_id:', u_id); // u_id 값을 터미널에 출력
  const conn = await getConn();
  const selectQuery = 'SELECT p_id FROM popupstore WHERE u_id = ?';
  

  try {
    const [rows] = await conn.query(selectQuery, [u_id]);
    
    if (rows.length > 0) {
      const p_ids = rows.map(row => row.p_id); // p_id 값들을 배열로 추출
      const placeholder = p_ids.map(() => '?').join(', '); // p_id 개수에 맞는 placeholder 생성

      const selectPopupQuery = `
        SELECT * FROM popupstore WHERE p_id IN (${placeholder})
      `;

      const [popupRows] = await conn.query(selectPopupQuery, p_ids);
      res.status(200).json(popupRows);
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

router.post('/region', async (req, res) => {
  const { p_region } = req.body;
  const conn = await getConn();

  const selectQuery = `
    SELECT * FROM popupstore WHERE p_region = ?
  `;

  try {
    const [rows] = await conn.query(selectQuery, [p_region]);
    
    if (rows.length > 0) {
      res.status(200).json(rows);
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
    SELECT COUNT(*) as true_count FROM popupstore_interest WHERE p_id = ? AND u_interest = '1'
  `;

  const updateQuery = `
    UPDATE popupstore_interest
    SET u_interest = NOT u_interest
    WHERE u_id = ? AND p_id = ?
  `;

  const updateCountQuery = `
    UPDATE popupstore_interest
    SET count = ?
    WHERE p_id = ?
  `;

  const insertQuery = `
    INSERT INTO popupstore_interest (u_id, p_id, u_interest, count)
    VALUES (?, ?, 1, 1)
  `;

  try {
    // u_id와 p_id가 일치하는 행 선택
    const [rows] = await conn.query(selectQuery, [u_id, p_id]);
    
    if (rows.length > 0) {
      // 클릭한 유저의 u_interest 값을 토글
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

router.post('/myReview', async (req, res) => {
  const conn = await getConn();
  const {u_id} = req.body;
  console.log('u_id:', u_id); // u_id 값을 터미널에 출력
  

  const selectQuery = `
    SELECT p_id FROM popupstore_users_reviews WHERE u_id = ?
  `;

  try {
    const [rows] = await conn.query(selectQuery, [u_id]);
    
    if (rows.length > 0) {
      const p_ids = rows.map(row => row.p_id); // p_id 값들을 배열로 추출
      const placeholder = p_ids.map(() => '?').join(', '); // p_id 개수에 맞는 placeholder 생성

      const selectPopupQuery = `
        SELECT * FROM popupstore WHERE p_id IN (${placeholder})
      `;

      const [popupRows] = await conn.query(selectPopupQuery, p_ids);
      res.status(200).json(popupRows);
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



router.post('/review', async (req, res) => {
  const { p_id } = req.body;
  console.log('p_id:', p_id); // p_id 값을 터미널에 출력

  const conn = await getConn();

  const selectQuery = `
    SELECT u_nickname, grade, review FROM popupstore_users_reviews WHERE p_id = ?
  `;

  try {
    const [rows] = await conn.query(selectQuery, [p_id]);
    
    if (rows.length > 0) {
      res.status(200).json(rows);
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

router.post('/review/post', async (req, res) => {
  const { p_id, u_id, u_nickname, grade, review  } = req.body;
  console.log(  p_id, u_id, u_nickname, grade, review  ); // p_id 값을 터미널에 출력
  const conn = await getConn();

  const selectQuery = `
    SELECT u_nickname, grade, review FROM popupstore_users_reviews WHERE u_id = ? AND p_id = ?
  `;

  const insertQuery = 'INSERT INTO popupstore_users_reviews (p_id, u_id, u_nickname, grade, review) VALUES (?, ?, ?, ?, ?)';

  try {
    const [rows] = await conn.query(selectQuery, [u_id, p_id]);
    
    if (rows.length === 0) {
      await conn.query(insertQuery, [p_id, u_id, u_nickname, grade, review]);
      res.status(201).json({message: 'Review added successfully'})
    } else{
      res.status(409).json({message: 'Review already exists'});
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD" 형식으로 변환
};


router.post('/store/post', upload.single('p_image'), async (req, res) => {
  const {u_id, p_name, p_location, p_startdate, p_enddate, p_intro, p_detail, p_simplelocation, p_category, p_hour } = req.body;
  const p_imageurl = req.file ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : null;
  
  // 날짜 형식을 ISO 형식으로 변환
  const formattedStartDate = formatDate(p_startdate);
  const formattedEndDate = formatDate(p_enddate);

  // p_status를 계산
  let p_status;
  const today = new Date();
  const startDate = new Date(p_startdate);
  const endDate = new Date(p_enddate);

  if (today < startDate) {
    p_status = '예정';
  } else if (today >= startDate && today <= endDate) {
    p_status = '진행중';
  } else if (today > endDate) {
    p_status = '종료';
  }

  let p_region = null;
  if (p_location.includes('서울')) {
    p_region = '서울특별시';
  } else if (p_location.includes('경기')) {
    p_region = '경기도';
  } else if (p_location.includes('인천')) {
    p_region = '인천광역시';
  } else if (p_location.includes('강원')) {
    p_region = '강원도';
  } else if (p_location.includes('대전')) {
    p_region = '대전광역시';
  } else if (p_location.includes('부산')) {
    p_region = '부산광역시';
  } 

  try {
    // 주소로부터 위도와 경도 가져오기
    const { latitude, longitude } = await getLatLong(p_location);

    console.log(u_id, p_name, p_location, formattedStartDate, formattedEndDate, p_status, p_intro, p_detail, p_imageurl, p_simplelocation, p_category, p_hour, p_region, latitude, longitude); // 콘솔에 출력

    const conn = await getConn();

    const selectQuery = `
      SELECT p_name, p_location FROM popupstore WHERE p_name = ? AND p_location = ? AND p_startdate = ? AND p_enddate = ?
    `;

    const insertQuery = `
      INSERT INTO popupstore (u_id, p_name, p_location, p_startdate, p_enddate, p_status, p_intro, p_detail, p_interest, p_imageurl, p_simplelocation, p_category, p_hour, p_region, p_latitude, p_longitude) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [rows] = await conn.query(selectQuery, [p_name, p_location, formattedEndDate, formattedEndDate]);
    
    if (rows.length === 0) {
      await conn.query(insertQuery, [u_id, p_name, p_location, formattedStartDate, formattedEndDate, p_status, p_intro, p_detail, 0, p_imageurl, p_simplelocation, p_category, p_hour, p_region, latitude, longitude]);
      res.status(201).json({ message: 'popupInfo added successfully' });
    } else {
      res.status(409).json({ message: 'popup already exists' });
    }

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




module.exports = router;
