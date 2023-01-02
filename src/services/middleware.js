const express = require("express");
const path = require("path");
const logger = require("morgan");
const passport = require("passport");
const cors = require("cors");
const helmet  = require("helmet");

module.exports = app = express();

app.use(cors());
app.use(logger("dev"));
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./public")));
app.use(passport.initialize());
app.use(function (err, req, res, next) {
  /*****************
   *locals provide request level info scoped to  that particular req eg res.locals.user
   *set locals, only providing error in development
   *****************/
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  /*****************
   *render the error page
   *****************/
  res.status(err.status || 500);
  res.render("error");
});

// app.use(helmet());