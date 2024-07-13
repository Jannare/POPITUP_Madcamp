var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var testRouter = require('./routes/test');

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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/test', testRouter);

// /user/:id 쳤을 때 id를 보냄
// app.get('/user/:id', (req, res) => {
//   const param = req.params //Parameter  
//   console.log(param)
//   console.log(param.id)

//   res.json({'animal': param.id})

// });

// mysql-node.js
// app.get('/testSelect', async (req, res) => {
//   const conn = await getConn();
//   const query = 'SELECT TEST_ID, TEST_TXT FROM TB_TEST';
//   let [rows, fields] = await conn.query(query, []);
//   conn.release();

//   res.send(rows);
// });
// mysql-node.js

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
