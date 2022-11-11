//JWT配置
JWTConfig = {
  secret: "zhiyinku_jwt_secret",
  algorithms: ["HS256"],
  expiresIn: "7d", //有效期24h
};

//数据库配置
DBConfig = {
  dateStrings: true,
  host: "localhost",
  port: "3306",
  user: "root",
  password: "123456",
  database: "zykblog",
  multipleStatements: true,
};

//SMTP配置
SMTPConfig = {
  port: 465, //服务器端口
  host: "smtp.163.com", //服务器地址
  auth: {
    user: "zhiyinku@163.com", //发送邮箱
    pass: "TIOIPNYPGAJNOFIJ", //stmp授权码
  },
};

//Redis配置
RedisConfig = {
  port: 6379,
  host: "127.0.0.1",
  password: 123456,
};

module.exports = { JWTConfig, DBConfig, SMTPConfig, RedisConfig };
