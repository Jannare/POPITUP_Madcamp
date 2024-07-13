const express = require('express');
const { User } = require('../models'); //models 폴더로 들어간다
const router = express.Router();

// 사용자 생성 라우트
router.post('/create', async (req, res) => {
  const { username, password, nickname} = req.body;

  try {
    const newUser = await User.create({ username, password, nickname });
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
