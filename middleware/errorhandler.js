const { verToken } = require("../util/token");

// 定义错误中间件
// middleware/errorhandler.js
function errorHandler(err, req, res, next) {
  const token = req.headers["authorization"];
  console.log(req.path);
  if (req.originalUrl === "/favicon.ico") {
    res.status(204).end();
  } else {
    verToken(token)
      .then((decoded) => {
        if (!decoded.uid || !decoded.roles) {
          return new Promise((resolve, reject) =>
            reject({ name: "undefined", message: "无效token" })
          );
        } else {
          req.user = decoded;
          return next();
        }
      })
      .catch((error) => {
        const resObj = {
          code: -1,
          message: error.message,
        };
        switch (error.name) {
          case "undefined":
          case "JsonWebTokenError":
            return res.status(403).send(resObj);
          case "TokenExpiredError":
            return res.status(401).send(resObj);
          default:
            return res.status(404).send({
              code: 404,
              message: "Not found",
            });
        }
      });
  }
}

module.exports = errorHandler;
