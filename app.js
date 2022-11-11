const express = require("express");
const { expressjwt } = require("express-jwt");
const { JWTConfig } = require("./config");
const errorHandler = require("./middleware/errorhandler");
const cors = require("cors");
var http = require("http");
var path = require("path");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
//Router
const userRouter = require("./routes/users");
const indexRouter = require("./routes/index");
const blogRouter = require("./routes/blog");

//app
const app = express();
var server = http.createServer(app);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
//设置允许跨域
// app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));

//解析token获取用户信息
app.use(
  expressjwt({
    secret: JWTConfig.secret,
    algorithms: JWTConfig.algorithms,
  }).unless({
    path: [
      "/user/login",
      "/user/register",
      "/user/sendmail",
      { url: /^\/index\/websites\/img\/.*/, methods: ["GET"] },
      { url: /^\/index\/banners\/img\/.*/, methods: ["GET"] },
      { url: /^\/user\/avatar\/.*/, methods: ["GET"] },
      { url: /^\/user\/md\/img\/.*/, methods: ["GET"] },
      { url: /^\/blog\/content\/.*/, methods: ["GET"] },
      "/blog/recommend",
      "/blog/latest",
      "/blog/hot",
      "/index/websites/list",
      "/index/banners/list",
      "/index/change",
    ],
  })
);

// token验证中间件;
app.use(errorHandler);

//Router
app.use("/user", userRouter);
app.use("/index", indexRouter);
app.use("/blog", blogRouter);

//listen on server
server.listen("3000", () => {
  console.log("listen on http://localhost:3000");
});
