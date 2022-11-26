/*
 * @Author: Rantele
 * @Date: 2022-10-16 12:56:26
 * @LastEditors: Rantele
 * @LastEditTime: 2022-11-18 12:23:26
 * @Description:
 *
 */

crypto = require('node:crypto') //uuid
const moment = require('moment')
const { query } = require('../../util/mysql')
const { getImage, setImage, delImage, hasImage } = require('../../util/image')
const formidable = require('formidable')
//验证用户权限
const roleVerify = require('../../util/roleVerify')

//获取banner图片
getBannerImg = (req, res) => {
  let name = req.params['name']
  console.log(req.params)
  getImage(name, '_', 'banner')
    .then((filepath) => {
      res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'max-age=604800',
      })
      res.sendFile(filepath, (err) => {
        if (err) {
          res.status(404).send({
            code: -1,
            message: '资源不存在',
          })
        }
      })
    })
    .catch((err) => {
      console.log('[catch]:', err)
      res.status(404)
    })
}

//获取全部banners信息
list = (req, res) => {
  query("select * from banners where location='home_banner'")
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
//新增banner
createBanner = (req, res) => {
  //vertify role
  if (!roleVerify.roleValid(req.user.roles, [1, 2])) {
    return res.status(403).send({
      code: -1,
      message: 'No Permission',
    })
  }
  const form = new formidable.IncomingForm()
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(500).send({
        code: -1,
        message: '服务器错误',
      })
    } else {
      const create_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      const nowDate = Date.now()
      const bannerType = files.bannerfile.originalFilename.split('.').at(-1)
      const bannerName = nowDate + '_' + bannerType
      if (files === {}) {
        return res.status(403).send({
          code: -1,
          message: '参数不正确',
        })
      }
      setImage(nowDate, bannerType, 'banner', files.bannerfile.filepath)
        .then(() => {
          //上传成功
          return query('INSERT INTO banners (location,img,description,createTime) VALUES (?,?,?,?)', [
            'home_banner',
            bannerName,
            '首页轮播图',
            create_time,
          ])
        })
        .then(() => {
          res.send({
            code: 200,
            message: '创建成功',
          })
        })
        .catch((err) => {
          console.log(err)
          hasImage(nowDate + '.' + bannerType, 'banner')
            .then((status) => {
              if (status) {
                delImage(nowDate + '.' + bannerType, 'banner')
              }
              res.status(404).send({
                code: -1,
                message: '上传失败',
              })
            })
            .catch((error) => {
              console.log('[catch]:', error)
              res.status(500).send({
                code: -1,
                message: '服务器错误',
              })
            })
        })
    }
  })
}

//删除banner
deleteBanner = (req, res) => {
  //vertify role
  if (!roleVerify.roleValid(req.user.roles, [1, 2])) {
    return res.status(403).send({
      code: -1,
      message: 'No Permission',
    })
  }
  const { id, img } = req.body
  console.log(id, img)
  if (!id || !img) {
    return res.status(403).send({
      code: -1,
      message: '无效参数',
    })
  } else {
    query("select id from banners where id=? and location='home_banner' and img=?", [id, img])
      .then((result) => {
        if (result.length === 0) {
          return new Promise((resolve, reject) => {
            reject(403)
          })
        }
        return query("delete from banners where id=? and location='home_banner' and img=?", [id, img])
      })
      .then(() => {
        res.send({
          code: 200,
          message: '删除成功',
        })
        delImage(img.split('_')[0] + '.' + img.split('_')[-1], 'banner')
      })
      .catch((err) => {
        console.log('[catch]:', err)
        if (err === 403) {
          res.status(403).send({
            code: -1,
            message: '图片不存在',
          })
        } else {
          res.status(500).send({
            code: -1,
            message: '服务器错误',
          })
        }
      })
  }
}

module.exports = {
  getBannerImg,
  list,
  createBanner,
  deleteBanner,
}
