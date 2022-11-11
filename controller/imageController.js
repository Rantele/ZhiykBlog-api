/*
 * @Author: Rantele
 * @Date: 2022-10-16 09:12:22
 * @LastEditors: Rantele
 * @LastEditTime: 2022-10-28 18:55:17
 * @Description:
 *
 */

var fs = require("fs");
var path = require("path");
crypto = require("node:crypto"); //uuid
const moment = require("moment");
getImg = (req, res) => {
  let type = req.query.type;
  let img = req.query.img;
  const filePath = path.resolve(__dirname, `../public/images/${type}/${img}`);
  // 给客户端返回一个文件流 type类型
  res.set("content-type", { png: "image/png", jpg: "image/jpeg" }); //设置返回类型
  var stream = fs.createReadStream(filePath);
  var responseData = []; //存储文件流
  if (stream) {
    //判断状态
    stream.on("data", function (chunk) {
      responseData.push(chunk);
    });
    stream.on("end", function () {
      var finalData = Buffer.concat(responseData);
      res.write(finalData);
      res.end();
    });
  }
};

module.exports = {
  getImg,
};

/* 
type
{
  "css": "text/css",
  "gif": "image/gif",
  "html": "text/html",
  "ico": "image/x-icon",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "json": "application/json",
  "pdf": "application/pdf",
  "png": "image/png",
  "svg": "image/svg+xml",
  "swf": "application/x-shockwave-flash",
  "tiff": "image/tiff",
  "txt": "text/plain",
  "wav": "audio/x-wav",
  "wma": "audio/x-ms-wma",
  "wmv": "video/x-ms-wmv",
  "xml": "text/xml"
}



*/
