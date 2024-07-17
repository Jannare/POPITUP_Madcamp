var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var GeminiRouter = require('./routes/Gemini');
const popupRouter = require('./routes/popup'); // 실제 라우터 파일 경로
const popup_keywordsRouter = require('./routes/popup_keywords'); // 실제 라우터 파일 경로
const bodyParser = require('body-parser');
const cors = require('cors');
const {GoogleGenerativeAI} = require('@google/generative-ai');
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



var app = express();

//sequelize 설정
const {sequelize} = require('./models');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(function(req, res, next) {
  console.log(req.url, 'middle-ware');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // URL-encoded 바디 파싱
app.use('/', indexRouter);
app.use('/api/user', usersRouter);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/popup', popupRouter);
app.use('/chatbot', GeminiRouter);
app.use('/api/popup/keyword/', popup_keywordsRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

  // Sequelize 동기화
sequelize.sync();

module.exports = app;
