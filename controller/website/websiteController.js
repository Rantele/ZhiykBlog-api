/*
 * @Author: Rantele
 * @Date: 2022-10-16 12:56:26
 * @LastEditors: Rantele
 * @LastEditTime: 2022-10-25 17:16:10
 * @Description:
 *
 */

var fs = require("fs");
var path = require("path");
crypto = require("node:crypto"); //uuid
const moment = require("moment");
const {query} = require("../../util/mysql");
const { getImage, setImage, delImage, hasImage } = require("../../util/image");
const { setItem } = require("../../util/redis");
const formidable = require("formidable");
//获取website图片
getWSImg = (req, res) => {
  let name = req.params["name"];
  console.log(req.params);
  getImage(name, "_", "websites")
    .then((filepath) => {
      res.set({
        "Content-Type": "image/png",
        "Cache-Control": "max-age=604800",
      });
      res.sendFile(filepath, (err) => {
        if (err) {
          res.status(404);
        }
      });
    })
    .catch((err) => {
      console.log("[catch]:", err);
      res.status(404).send({
        code: -1,
        message: "资源不存在",
      });
    });
};

//获取websites信息
list = (req, res) => {
  console.log("-------");
  query("select * from websites")
    .then((result) => {
      res.send({
        code: 200,
        message: "操作成功",
        data: result,
      });
    })
    .catch((err) => {
      console.log("[catch]:", err);
      res.status(500).send({
        code: -1,
        message: "服务器错误",
      });
    });
};
//新增website
createWS = (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(500).send({
        code: -1,
        message: "服务器错误",
      });
    } else {
      let { parentId, title, name, description, link } = fields;
      const create_time = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
      const nowDate = Date.now();
      const iconType = files.iconfile.originalFilename.split(".").at(-1);
      const icon = nowDate + "_" + iconType;
      console.log(Number(parentId), title, name, description, link);
      if (!parentId || !title || !name || files === {}) {
        return res.status(403).send({
          code: -1,
          message: "参数不正确",
        });
      }
      setImage(nowDate, iconType, "websites", files.iconfile.filepath)
        .then(() => {
          //上传成功
          return query(
            "INSERT INTO websites (parentId,title,name,description,link,icon,createTime) VALUES (?,?,?,?,?,?,?)",
            [
              Number.parseInt(parentId),
              title,
              name,
              description || null,
              link || null,
              icon,
              create_time,
            ]
          );
        })
        .then(() => {
          res.send({
            code: 200,
            message: "创建成功",
          });
        })
        .catch((err) => {
          console.log(err);
          hasImage(nowDate + "." + iconType, "websites")
            .then((status) => {
              if (status) {
                delImage(nowDate + "." + iconType, "websites");
              }
              res.status(404).send({
                code: -1,
                message: "上传失败",
              });
            })
            .catch((error) => {
              console.log("[catch]:", error);
              res.status(500).send({
                code: -1,
                message: "服务器错误",
              });
            });
        });
    }
  });
};

//删除website
deleteWS = (req, res) => {
  const { id, parentId } = req.body;
  console.log(id, parentId);
  if (!id || !parentId) {
    return res.status(403).send({
      code: -1,
      message: "无效参数",
    });
  }
  if (parentId === 0) {
    //父节点 需要判断子节点是否为空
    query("select id from websites where parentId=?", [id])
      .then((result) => {
        if (result.length !== 0) {
          //子节点不为空，不允许删除
          return new Promise((resolve, reject) => {
            reject(201);
          });
        }
        return query("delete from websites where id=? and parentId=?", [
          id,
          parentId,
        ]);
      })
      .then(() => {
        res.send({
          code: 200,
          message: "删除成功",
        });
      })
      .catch((err) => {
        console.log("[catch]:", err);
        if (err === 201) {
          res.status(201).send({
            code: 201,
            message: "子节点不为空",
          });
        } else {
          res.status(500).send({
            code: -1,
            message: "服务器错误",
          });
        }
      });
  } else {
    //子节点删除
    query("select id from websites where id=? and parentId=?", [id, parentId])
      .then((result) => {
        if (result.length === 0) {
          return new Promise((resolve, reject) => {
            reject(404);
          });
        }
        return query("delete from websites where id=? and parentId=?", [
          id,
          parentId,
        ]);
      })
      .then(() => {
        res.send({
          code: 200,
          message: "删除成功",
        });
      })
      .catch((err) => {
        console.log("[catch]:", err);
        res.status(500).send({
          code: -1,
          message: "服务器错误",
        });
      });
  }
};
//修改website
updateWS = (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).send({
        code: -1,
        message: "服务器错误",
      });
    } else {
      let { id, parentId, title, name, description, link, icon } = fields;
      console.log(files);
      console.log(id, parentId, title, name, description, link);
      if (!id || !parentId || !title || !name || !icon) {
        return res.status(403).send({
          code: -1,
          message: "无效的参数",
        });
      }
      //判断是否修改图片
      let sql =
        "update websites set parentId=?,title=?,name=?,description=?,link=? where id=?";
      let sqlArr = [
        parseInt(parentId),
        title,
        name,
        description,
        link,
        parseInt(id),
      ];

      if (Object.keys(files).length !== 0) {
        //修改图片
        const nowDate = Date.now();
        const iconType = files.iconfile.originalFilename.split(".").at(-1);
        let newIcon = nowDate + "_" + iconType;
        sql =
          "update websites set parentId=?,title=?,name=?,description=?,link=?,icon=? where id=?";
        sqlArr = [
          parseInt(parentId),
          title,
          name,
          description,
          link,
          newIcon,
          parseInt(id),
        ];
        await setImage(
          nowDate,
          iconType,
          "websites",
          files.iconfile.filepath
        ).catch((err) => {
          console.log("[catch]:", err);
          res.status(500).send({
            code: -1,
            message: "服务器错误",
          });
        });
        await delImage(icon.split("_").join("."), "websites").catch((err) => {
          console.log("[catch]:", err);
        });
      }
      query(sql, sqlArr)
        .then(() => {
          res.send({
            code: 200,
            message: "修改成功",
          });
        })
        .catch((err) => {
          console.log("[catch]:", err);
          res.status(500).send({
            code: -1,
            message: "服务器错误",
          });
        });
    }
  });
};

//test
change = (req, res) => {
  setItem("86c8ac34-61a6-4c66-84f4-7ddf583ab970", "update");
  res.send("changed");
};

module.exports = {
  getWSImg,
  list,
  createWS,
  deleteWS,
  updateWS,
  change,
};
