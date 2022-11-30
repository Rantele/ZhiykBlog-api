/*
 * @Author: Rantele
 * @Date: 2022-11-26 20:44:12
 * @LastEditors: Rantele
 * @LastEditTime: 2022-11-30 20:59:50
 * @Description:AboutController
 *
 */

const { query, trans } = require('../../util/mysql')
//验证用户权限
const roleVerify = require('../../util/roleVerify')
getVersionHistory = (req, res) => {
  query('select * from version_history')
    .then((result) => {
      res.send({
        code: 200,
        message: '操作成功',
        data: result,
      })
    })
    .catch((err) => {
      console.log('[catch]:', err)
      res.status(500).send({
        code: -1,
        message: '服务器错误',
      })
    })
}

createVersionRecord = (req, res) => {
  //vertify role
  if (!roleVerify.roleValid(req.user.roles, [4])) {
    return res.status(403).send({
      code: -1,
      message: 'No Permission',
    })
  }
  const { type, content, time } = req.body
  if (!type || !content || !time) {
    return res.status(403).send({
      code: -1,
      message: '无效参数',
    })
  } else {
    trans('insert into version_history SET type=?,content=?,time=?', [type, content, time])
      .then((result) => {
        res.send({ code: 200, message: '创建成功' })
      })
      .catch((err) => {
        console.log('[catch]:', err)
        res.status(500).send({
          code: -1,
          message: '服务器错误',
        })
      })
  }
}

updateVersionRecord = (req, res) => {
  //vertify role
  console.log(req.user.roles)
  if (!roleVerify.roleValid(req.user.roles, [4])) {
    return res.status(403).send({
      code: -1,
      message: 'No Permission',
    })
  }
  const { id, type, content, time } = req.body
  if (!id || !type || !content || !time) {
    return res.status(403).send({
      code: -1,
      message: '无效参数',
    })
  } else {
    console.log(id, type, content, time)
    query('update version_history set type=?,content=?,time=? where id=?', [type, content, time, id])
      .then((result) => {
        res.send({ code: 200, message: '修改成功' })
      })
      .catch((err) => {
        console.log('[catch]:', err)
        res.status(500).send({
          code: -1,
          message: '服务器错误',
        })
      })
  }
}

deleteVersionRecord = (req, res) => {
  //vertify role
  if (!roleVerify.roleValid(req.user.roles, [4])) {
    return res.status(403).send({
      code: -1,
      message: 'No Permission',
    })
  }
  const { id } = req.body
  trans([
    {
      sql: 'DELETE FROM version_history WHERE id=?',
      values: [id],
    },
  ])
    .then(() => {
      res.send({
        code: 200,
        message: '删除成功',
      })
    })
    .catch((err) => {
      console.log('[catch]:', err)
      res.status(500).send({
        code: -1,
        message: '服务器错误',
      })
    })
}

module.exports = {
  getVersionHistory,
  createVersionRecord,
  updateVersionRecord,
  deleteVersionRecord,
}
