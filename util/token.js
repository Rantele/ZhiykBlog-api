const jwt = require("jsonwebtoken");
const JWTSecret = "hiyinku_jwt_secret"; //密钥
const { JWTConfig } = require("../config");

//设置token
setToken = function (uid, roles) {
  return new Promise((resolve, reject) => {
    //注册token
    const token = jwt.sign({ uid, roles }, JWTSecret, {
      expiresIn: JWTConfig.expiresIn,
    });
    resolve(token);
  });
};

//验证token
verToken = function (token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject({ name: "undefined", message: "token is undefined" });
    } else {
      try {
        const info = jwt.verify(token.split(" ")[1], JWTSecret);
        resolve(info);
      } catch (err) {
        reject(err);
      }
    }
  });
};

module.exports = {
  setToken,
  verToken,
};
