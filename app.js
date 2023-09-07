var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

var userRouter = require("./routes/user");

var app = express();

// session setup

const store = new MongoDBStore({
  uri: "mongodb://localhost:27017/pets",
  collection: "sessions",
});

store.on("error", function (error) {
  console.error(error);
});

app.use(session({
  secret: "STANlee31",
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    secure: false,
    maxAge: 1 * 24 * 60 * 60 * 1000
  }
}))

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
