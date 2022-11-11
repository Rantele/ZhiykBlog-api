//引入mysql
let mysql = require('mysql2')
const { DBConfig } = require('../config')
//连接数据库，使用mysql的连接池方式
//连接池对象
const con = mysql.createPool(DBConfig)

//query语句
const query = (sql, values) => {
  return new Promise((resolve, reject) => {
    con.getConnection(function (err, conn) {
      if (err) reject(err)
      conn.execute(sql, values, (err, result) => {
        if (err) reject(err)
        else resolve(JSON.parse(JSON.stringify(result))) // 查询完之后释放连接
        con.releaseConnection(conn) // 释放连接
      })
    })
  })
}

//新增语句
const insert = (sql, value) => {
  return new Promise((resolve, reject) => {
    con.getConnection(function (err, conn) {
      conn.query(sql, value, function (error, results, fields) {
        if (error) {
          reject(err)
        } else {
          resolve(results.insertId)
        }
        con.releaseConnection(conn) // 释放连接
      })
    })
  })
}

//事务
const trans = (sql_list) => {
  return new Promise((resolve, reject) => {
    con.getConnection(function (err, conn) {
      if (err) {
        reject(err)
      } else {
        conn.beginTransaction()
        const sqlArr = Object.values(sql_list).map(({ sql, values }) => {
          return new Promise((resolve, reject) => {
            conn.query(sql, values, (error, res) => {
              if (error) {
                reject(err)
              } else {
                resolve()
              }
            })
          })
        })
        Promise.all(sqlArr)
          .then(() => {
            conn.commit()
            resolve()
          })
          .catch((err) => {
            conn.rollback()
          })
      }
      con.releaseConnection(conn) // 释放连接
    })
  })
}
module.exports = { query, trans, insert }
