/*
 * @Author: Rantele
 * @Date: 2022-11-26 20:44:12
 * @LastEditors: Rantele
 * @LastEditTime: 2022-11-26 21:09:23
 * @Description:AboutController
 *
 */

const { query } = require('../../util/mysql')

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

module.exports = {
  getVersionHistory,
}
