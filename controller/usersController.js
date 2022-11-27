/*
 * @Author: Rantele
 * @Date: 2022-10-06 19:22:00
 * @LastEditors: Rantele
 * @LastEditTime: 2022-11-27 20:24:17
 * @Description:用户接口模块
 *
 */

//引入相关模块
const { query, insert, trans } = require('../util/mysql')
const { setToken } = require('../util/token')
const nodemailer = require('../util/nodemailer') //STMP服务
const moment = require('moment')
const { getItem, delItem } = require('../util/redis')
crypto = require('node:crypto') //uuid
var path = require('path')
const formidable = require('formidable')
const { getImage, setImage, delImage, hasImage } = require('../util/image')

//发送邮箱验证码
sendMail = (req, res) => {
  const email = req.query.email
  if (!email) {
    return res.status(400).send({
      code: -1,
      message: '邮箱不能为空',
    })
  }
  // 判断Redis是否中存在该email
  getItem(email)
    .then((code) => {
      if (code !== null) {
        res.status(403).send({
          code: -1,
          message: '不能重复发送邮箱验证码',
        })
      } else {
        //查看该邮箱是否注册
        let sql = 'select id from user where email=?'
        let sqlArr = [email]
        return query(sql, sqlArr)
      }
    })
    .then((result) => {
      console.log(result)
      if (result.length !== 0) {
        //用户存在
        res.status(403).send({
          code: -1,
          message: '邮箱已经被注册，请使用其他邮箱',
        })
        return new Promise((resolve, reject) => {})
      } else {
        return true
      }
    })
    .then((result) => {
      //允许发送邮件
      if (result) {
        const code = nodemailer.setEmailCode(email)
        const emaiOp = nodemailer.EmailContent(email, code)
        nodemailer.sendMail(emaiOp)
        res.send({
          code: 200,
          message: 'send email success',
        })
      }
    })
    .catch((err) => {
      console.log('[catch]:', err)
      res.status(500).send({
        code: -1,
        message: '服务器错误',
      })
    })
}

//用户注册
register = (req, res) => {
  //使用邮箱验证注册方式
  const { nickname, email, email_code, phone, password, re_password } = req.body
  //验证email_code有效性
  if (!nickname || !email || !email_code || !password || !password || password !== re_password) {
    return res.status(400).send({
      code: -1,
      message: '字段不合法',
    })
  }
  //sendmail
  nodemailer
    .verEmailCode(email, email_code)
    .then((status) => {
      if (!status) {
        res.status(400).send({
          code: -1,
          message: '验证码错误',
        })
        return new Promise((resolve, reject) => {})
      } else {
        //查看该邮箱是否注册
        let sql = 'select id from user where email=?'
        let sqlArr = [email]
        return query(sql, sqlArr)
      }
    })
    .then((result) => {
      if (result.length !== 0) {
        //用户存在
        res.status(403).send({
          code: -1,
          message: '邮箱已经被注册，请使用其他邮箱',
        })
        return new Promise((resolve, reject) => {})
      } else {
        //允许注册
        const uid = crypto.randomUUID()
        const create_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        let insertSql = 'insert into user (uid,nickname,password,phone,email,create_time,roles) values (?,?,?,?,?,?,?)'
        let insertSqlArr = [uid, nickname, password, phone ? phone : '', email, create_time, '-1']
        return query(insertSql, insertSqlArr)
      }
    })
    .then((insertResult) => {
      console.log('insert Result:', insertResult)
      res.send({
        code: 200,
        message: '注册成功',
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

//用户登录-返回token
login = (req, res) => {
  const { username, password } = req.body
  //用户名和密码不能为空
  if (!username || !password) {
    return res.status(403).send({
      code: -1,
      message: '用户名和密码不能为空',
    })
  }
  //判断用户是否存在
  let sql = 'select uid,roles from user where email=? and password=?'
  let sqlArr = [username, password]
  query(sql, sqlArr)
    .then((result) => {
      if (result.length === 0) {
        //用户不存在
        res.status(403).send({
          code: -1,
          message: '用户不存在',
        })
        return new Promise((resolve, reject) => {})
      } else {
        return setToken(result[0].uid, result[0].roles)
      }
    })
    .then((token) => {
      console.log(token)
      //指定身份验证框架：Bearer
      const tokenHead = 'Bearer '
      res.send({
        code: 200,
        message: '操作成功',
        data: {
          token,
          tokenHead,
        },
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

//获取路由
router = (req, res) => {
  const user = req.user
  console.log(user)
  let roles = user.roles
  let router = []
  //如果缓存记录了该用户，那么该用户的权限被修改了
  //返回新的token
  getItem(user.uid)
    .then((value) => {
      console.log('getUserUpdate:', value)
      if (value) {
        query('select roles from user where uid=?', [user.uid])
          .then((result) => {
            return setToken(user.uid, result[0].roles)
          })
          .then((token) => {
            const tokenHead = 'Bearer '
            delItem(user.uid)
            res.status(201).send({
              code: 201,
              message: '权限已更新',
              data: {
                token,
                tokenHead,
              },
            })
          })
          .catch((err) => {
            console.log('[catch]:', err)
            res.status(500).send({
              code: -1,
              message: '服务器错误',
            })
          })
      } else {
        query(`select * from router where role_id in(${roles})`)
          .then((result) => {
            router = result
            return query('select nickname,img from user where uid=?', [user.uid])
          })
          .then((result) => {
            res.send({
              code: 200,
              message: '操作成功',
              data: {
                router,
                img: result[0].img,
                nickname: result[0].nickname,
              },
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
    })
    .catch((err) => {
      console.log(err)
    })
}

getAvatar = (req, res) => {
  let name = req.params['name']
  console.log(req.params)
  getImage(name, '_', 'avatar')
    .then((filepath) => {
      res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'max-age=604800',
      })
      res.sendFile(filepath, (err) => {
        if (err) {
          return new Promise((resolve, reject) => {
            reject()
          })
        }
      })
    })
    .catch((err) => {
      console.log('[catch]:', err)
      res.status(404).send({
        code: -1,
        message: '资源不存在',
      })
    })
}

//获取用户信息
getUserInfo = (req, res) => {
  const user = req.user
  console.log(user)
  if (!user || !user.uid) {
    return res.status(403).send({
      code: -1,
      message: '无效用户',
    })
  } else {
    query('select email,phone,realname,gender,brithday,create_time from user where uid=?', [user.uid])
      .then((result) => {
        if (result.length === 0) {
          return new Promise((resolve, reject) => {
            reject('没有该用户')
          })
        } else {
          res.send({
            code: 200,
            message: '操作成功',
            data: result,
          })
        }
      })
      .catch((err) => {
        console.log('[catch]:', err)
        res.status(500).send({
          code: -1,
          msg: '数据库查询异常',
        })
      })
  }
}

/**
 * 用户博客接口
 */

//获取文章数、点赞数、收藏数
getUserMdStatistics = (req, res) => {
  const user = req.user
  query(
    'select v.vote_count,b.blog_count,s.star_count from((select count(*) as vote_count from vote where uid=?) v,(select count(*) as blog_count from post where uid=?) b,(select count(*) as star_count from stars where uid=?) s)',
    [user.uid, user.uid, user.uid]
  )
    .then((result) => {
      res.send({
        code: 200,
        message: '操作成功',
        data: result[0],
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

//获取md中的图片
getMdImg = (req, res) => {
  let name = req.params['name']
  console.log(req.params)
  getImage(name, '_', 'blog')
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

//上传md中的图片
uploadMdImg = (req, res) => {
  const form = new formidable.IncomingForm()
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(500).send({
        code: -1,
        message: '服务器错误',
      })
    } else {
      const nowDate = Date.now()
      const imgType = files.imgfile.originalFilename.split('.').at(-1)
      const imgName = nowDate + '_' + imgType
      if (files === {}) {
        return res.status(403).send({
          code: -1,
          message: '参数不正确',
        })
      }
      setImage(nowDate, imgType, 'blog', files.imgfile.filepath)
        .then(() => {
          res.send({
            code: 200,
            message: '创建成功',
            data: imgName,
          })
        })
        .catch((err) => {
          console.log(err)
          hasImage(nowDate + '.' + imgType, 'blog')
            .then((status) => {
              if (status) {
                delImage(nowDate + '.' + imgType, 'blog')
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

//删除md中的图片
deleteMdImg = (req, res) => {
  const { img } = req.body
  if (!img) {
    return res.status(403)
  } else {
    delImage(img.split('_')[0] + '.' + img.split('_').at(-1), 'blog')
      .then(() => {
        res.send({
          code: 200,
          message: '删除成功',
        })
      })
      .catch((err) => {
        console.log('[catch]:', err)
        res.status(404)
      })
  }
}

//获取用户全部md
getUserMdList = (req, res) => {
  const user = req.user
  const { search } = req.query
  query(
    'select id,title,cover,label,blogid,vote_count,comment_count,create_time from post where uid=? and status!=0 and title REGEXP ? order by create_time',
    [user.uid, search || '.*?']
  )
    .then((result) => {
      res.send({ code: 200, message: '操作成功', data: result })
    })
    .catch((err) => {
      console.log('[catch]:', err)
      res.status(500).send({
        code: -1,
        message: '服务器错误',
      })
    })
}

//获取用户未审核文章
getUserMdNoAuditList = (req, res) => {
  const user = req.user
  query(
    'select id,title,cover,label,blogid,vote_count,comment_count,create_time from post where uid=? and status=-1 order by create_time',
    [user.uid]
  )
    .then((result) => {
      res.send({ code: 200, message: '操作成功', data: result })
    })
    .catch((err) => {
      console.log('[catch]:', err)
      res.status(500).send({
        code: -1,
        message: '服务器错误',
      })
    })
}

//获取用户审核未通过的文章
getUserMdNoPassList = (req, res) => {
  const user = req.user
  query(
    'select id,title,cover,label,blogid,vote_count,comment_count,create_time from post where uid=? and status=0 order by create_time',
    [user.uid]
  )
    .then((result) => {
      res.send({ code: 200, message: '操作成功', data: result })
    })
    .catch((err) => {
      console.log('[catch]:', err)
      res.status(500).send({
        code: -1,
        message: '服务器错误',
      })
    })
}

//获取用户md内容
getUserMdBody = (req, res) => {
  const user = req.user
  let id = parseInt(req.params['id']) //post_id
  if (!id) {
    return res.status(403).send({
      code: -1,
      message: '无效参数',
    })
  }
  let data = {}
  query('select id,title,abstract,cover,label,blogid from post where uid=? and id=?', [user.uid, id])
    .then((result) => {
      console.log(result)
      if (result.length === 0) {
        return new Promise((resolve, reject) => {
          reject()
        })
      } else {
        data = result[0]
        return query('select body from blog where id=?', [result[0].blogid])
      }
    })
    .then((result) => {
      if (result.length === 0) {
        return new Promise((resolve, reject) => {
          reject()
        })
      } else {
        data['content'] = result[0].body
        res.send({
          code: 200,
          message: '操作成功',
          data: data,
        })
      }
    })
    .catch((err) => {
      console.log('[catch]:', err)
      res.status(500).send({
        code: -1,
        message: '服务器错误',
      })
    })
}

//创建md
createMd = (req, res) => {
  const user = req.user
  const { title, abstract, cover, content, label } = req.body
  if (!title || !content) {
    return res.status(403).send({
      code: -1,
      message: '无效参数',
    })
  } else {
    //文章主体
    console.log(title, abstract, cover, content, label)
    insert('insert into blog SET ?', { body: content })
      .then((blogid) => {
        console.log('body this')
        const create_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        //文章简介
        return insert('insert into post SET ?', {
          title,
          abstract,
          cover,
          vote_count: 0,
          comment_count: 0,
          blogid,
          uid: user.uid,
          create_time,
          label,
          status: -1,
        })
      })
      .then(() => {
        console.log('post this')
        res.send({
          code: 200,
          message: '创建成功',
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
}

//修改md
updateMd = (req, res) => {
  const user = req.user
  const { id, title, abstract, cover, content, label, blogid } = req.body
  if (!id || !title || !content || !blogid) {
    return res.status(403).send({
      code: -1,
      message: '无效参数',
    })
  } else {
    //确认该文章id和对应的blogid记录存在
    query('select * from post where id=? and blogid=? and uid=?', [id, blogid, user.uid])
      .then((result) => {
        if (result.length === 0) {
          res.status(403).send({
            code: -1,
            message: '修改错误',
          })
        } else {
          trans([
            {
              sql: 'update post set title=?,abstract=?,cover=?,label=?,status=? where id=?',
              values: [title, abstract, cover, label, -1, id],
            },
            {
              sql: 'update blog set body=? where id=?',
              values: [content, blogid],
            },
          ]).then(() => {
            res.send({ code: 200, message: '修改成功' })
          })
        }
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

//删除md
deleteMd = (req, res) => {
  const user = req.user
  const { id, blogid } = req.body
  trans([
    {
      sql: 'DELETE FROM post WHERE id=? and uid=? and blogid=?',
      values: [id, user.uid, blogid],
    },
    {
      sql: 'DELETE FROM blog WHERE id=?',
      values: [blogid],
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

//过滤文章标签
tagListFilter = (req, res) => {
  query('select * from blog_labels')
    .then((result) => {
      res.send({
        code: 200,
        message: '查询成功',
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

/**
 * 收藏模块
 */
//获取用户收藏md
getUserMdStarPost = (req, res) => {
  const user = req.user
  const { search } = req.query
  query(
    'select post.id,post.title,post.abstract,post.cover,post.vote_count,post.comment_count,post.label,user.nickname,user.img,post.blogid,post.create_time from post,user where post.uid=user.uid and post.id In (select postid as id from stars where uid=?) and post.title REGEXP ?',
    [user.uid, search || '.*?']
  )
    .then((result) => {
      res.send({
        code: 200,
        message: '查询成功',
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
//获取用户收藏的id列表
getUserMdStarList = (req, res) => {
  const user = req.user
  query('select id,postid,create_time from stars where uid=?', [user.uid])
    .then((result) => {
      res.send({
        code: 200,
        message: '操作成功',
        data: result,
      })
    })
    .catch((err) => {
      console.log('[catch]:', err)
      res.send({
        code: -1,
        message: '服务器错误',
      })
    })
}

//添加收藏
createMdStar = (req, res) => {
  const user = req.user
  const { postid } = req.body
  console.log(postid)
  const create_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  query('select * from stars where uid=? and postid=?', [user.uid, postid])
    .then((result) => {
      console.log(result)
      if (result.length === 0) {
        return insert('insert into stars SET ?', {
          postid,
          uid: user.uid,
          create_time,
        })
      } else {
        return new Promise((resolve, reject) => {
          reject()
        })
      }
    })
    .then(() => {
      res.send({
        code: 200,
        message: '创建成功',
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

//删除收藏
deleteMdStar = (req, res) => {
  const user = req.user
  const { postid } = req.body
  console.log(postid)
  trans([
    {
      sql: 'DELETE FROM stars WHERE postid=? and uid=?',
      values: [postid, user.uid],
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

/**
 * 点赞模块
 * 性能不好，频繁操作数据库（TODO）
 */
//获取用户点赞列表
getUserVoteList = (req, res) => {
  const user = req.user
  query('select * from vote where uid=?', [user.uid])
    .then((result) => {
      res.send({
        code: 200,
        message: '查询成功',
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

// 添加点赞
createVote = (req, res) => {
  const user = req.user
  const { postid } = req.body
  //执行事件 添加点赞记录、点赞数+1
  const create_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  trans([
    {
      sql: 'insert into vote (postid,uid,create_time) values(?,?,?)',
      values: [postid, user.uid, create_time],
    },
    {
      sql: 'update post set vote_count=vote_count+1 where id=?',
      values: [postid],
    },
  ])
    .then(() => {
      res.send({
        code: 200,
        message: '点赞成功',
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

// 取消点赞
deleteVote = (req, res) => {
  const user = req.user
  const { postid } = req.body
  trans([
    {
      sql: 'DELETE FROM vote WHERE postid=? and uid=?',
      values: [postid, user.uid],
    },
    {
      sql: 'update post set vote_count=vote_count-1 where id=?',
      values: [postid],
    },
  ])
    .then(() => {
      res.send({
        code: 200,
        message: '取消点赞成功',
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

//添加一个评论
createComment = (req, res) => {
  const user = req.user
  const { comment, postid, parentId } = req.body
  console.log(comment, postid, parentId)
  const create_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  insert('insert into comments set ?', {
    comment,
    post_id: postid,
    parentId,
    uid: user.uid,
    create_time,
  })
    .then(() => {
      return trans([
        {
          sql: 'update post set comment_count=comment_count+1 where id=?',
          values: [postid],
        },
      ])
    })
    .then(() => {
      return query(
        'select comments.id,comments.comment,comments.parentId,comments.create_time,user.id as user_id,user.nickname,user.img from comments,user where comments.uid=user.uid and comments.post_id=?',
        [postid]
      )
    })
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

//moudle export
module.exports = {
  login,
  router,
  sendMail,
  register,
  getAvatar,
  getUserInfo,

  getUserMdStatistics,
  getMdImg,
  uploadMdImg,
  deleteMdImg,
  getUserMdList,
  getUserMdNoAuditList,
  getUserMdNoPassList,
  getUserMdBody,
  createMd,
  updateMd,
  deleteMd,
  tagListFilter,

  getUserMdStarPost,
  getUserMdStarList,
  createMdStar,
  deleteMdStar,

  getUserVoteList,
  createVote,
  deleteVote,

  createComment,
}
