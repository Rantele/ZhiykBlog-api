/*
 * @Author: Rantele
 * @Date: 2022-10-10 11:42:55
 * @LastEditors: Rantele
 * @LastEditTime: 2022-10-18 22:14:28
 * @Description:Redis<Version:5.0.14.1>封装
 *
 */

//引入Redis
const redis = require("redis");
//Redis相关配置
const { RedisConfig } = require("../config");

const _createClient = () => {
  //url格式： redis[s]://[[username][:password]@][host][:port][/db-number]
  const rClient = redis.createClient({
    url: `redis://:${RedisConfig.password}@${RedisConfig.host}:${RedisConfig.port}`,
  });
  //error log
  rClient.on("error", (err) => {
    console.log("Redis Client Error:", err);
  });

  rClient.connect();
  return rClient;
};

const redisClient = _createClient();

//redis.set()封装
setItem = (key, val, exprires = 60 * 5) => {
  redisClient.set(key, val);
  redisClient.expire(key, exprires);
  // redisClient.quit();
};

//redis.get()封装
getItem = (key) => {
  return new Promise((resolve, reject) => {
    redisClient
      .get(key)
      .then((val) => {
        resolve(val); //val:value|null
      })
      .catch((err) => {
        reject(err);
      });
  });
};
delItem = (key) => {
  return new Promise((resolve, reject) => {
    redisClient
      .del(key)
      .then((val) => {
        resolve(val); //val:value|null
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports = {
  getItem,
  setItem,
  delItem,
};
