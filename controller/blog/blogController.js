/*
 * @Author: Rantele
 * @Date: 2022-10-28 17:54:49
 * @LastEditors: Rantele
 * @LastEditTime: 2022-11-16 19:31:06
 * @Description:文章模块
 *
 */

const { query } = require('../../util/mysql')

//mysql

//获取文章内容
getMdContent = (req, res) => {
  let blogid = req.params['id']
  query('select * from blog where id=?', [parseInt(blogid)])
    .then((result) => {
      if (result.length === 0) {
        res.status(403).send({
          code: -1,
          message: '文章不存在',
        })
      } else {
        res.send({
          code: 200,
          message: '获取成功',
          data: result[0],
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

//获取最新文章列表
getLatestMdList = (req, res) => {
  query(
    'select post.id,post.title,post.abstract,post.cover,post.vote_count,post.comment_count,post.label,user.nickname,user.img,post.blogid,post.create_time from post,user where post.uid=user.uid order by create_time desc'
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

//获取推荐文章列表
getRecommendMdList = (req, res) => {
  const user = req.user
  let label = []
  if (user) {
    query('select * from user where uid=?', [user.uid])
      .then((result) => {
        label = result[0].label
      })
      .catch((err) => {
        console.log('[catch]:', err)
      })
  }
  query(
    'select post.id,post.title,post.abstract,post.cover,post.vote_count,post.comment_count,post.label,user.nickname,user.img,post.blogid,post.create_time from post,user where post.uid=user.uid and post.label REGEXP ? order by create_time desc',
    ['.*?(' + label.join('|') + ')(,|])' || '^(\\[).*?(\\])$']
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

//获取热门文章列表
getHotMdList = (req, res) => {
  query(
    'select post.id,post.title,post.abstract,post.cover,post.vote_count,post.comment_count,post.label,user.nickname,user.img,post.blogid,post.create_time from post,user where post.uid=user.uid and DATE_SUB(CURDATE(),INTERVAL 7 DAY)<=DATE(post.create_time) order by post.vote_count,post.comment_count desc'
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

//搜索文章
searchMd = (req, res) => {
  const { label, search } = req.query
  console.log(label, search)
  if (!label && !search) {
    return res.status(403).send({
      code: -1,
      message: '无效请求',
    })
  }
  if (search) {
    query(
      'select post.id,post.title,post.abstract,post.cover,post.vote_count,post.comment_count,post.label,user.nickname,user.img,post.blogid,post.create_time from post,user,blog where post.uid=user.uid and blog.id=post.blogid and (post.title REGEXP ? or post.abstract REGEXP ? or blog.body REGEXP ? or user.nickname REGEXP ?) order by create_time desc',
      [search, search, search, search]
    )
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
  } else if (label) {
    query(
      'select post.id,post.title,post.abstract,post.cover,post.vote_count,post.comment_count,post.label,user.nickname,user.img,post.blogid,post.create_time from post,user where post.uid=user.uid and post.label REGEXP ? order by create_time desc',
      ['.*?(' + label + ')(,|])']
    )
      .then((result) => {
        console.log(result)
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
  } else {
    res.status(403).send({
      code: -1,
      message: '无效请求',
    })
  }
}

/**
 * 评论模块
 *
 */
//获取文章评论
getMdCommentList = (req, res) => {
  const { id } = req.query
  query(
    'select comments.id,comments.comment,comments.parentId,user.nickname,user.img,comments.create_time from comments,user where comments.uid=user.uid and post_id=?',
    [id]
  )
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

getMdDetail = (req, res) => {
  //点赞数，评论数，
  const user = req.user
  const { postid, blogid } = req.query
  console.log(postid, blogid, user.uid)
  const postDataPms = query(
    'select post.id,post.title,post.cover,post.vote_count,post.comment_count,post.create_time,user.nickname,user.img,user.id as user_id from post,user where post.uid=user.uid and post.id=?',
    [postid]
  )
  const bodyPms = query('select body from blog where id=?', [blogid])
  const starPms = query(
    'select count(*) as star_count,(SELECT IF(count(*)>0,true,false) FROM stars WHERE uid=? and postid=?) as isStar from stars where postid=?',
    [user.uid, postid, postid]
  )
  const isVotePms = query('select IF(count(*)>0,true,false) as isVote from vote where uid=? and postid=?', [
    user.uid,
    postid,
  ])
  Promise.all([postDataPms, bodyPms, starPms, isVotePms])
    .then((values) => {
      res.send({
        code: 200,
        message: '操作成功',
        data: {
          blogData: values[0][0],
          body: values[1][0].body,
          star: values[2][0],
          isVote: values[3][0].isVote,
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

getMdCommentList = (req, res) => {
  const { postid } = req.query
  query(
    'select comments.id,comments.comment,comments.parentId,comments.create_time,user.id as user_id,user.nickname,user.img from comments,user where comments.uid=user.uid and comments.post_id=?',
    [postid]
  )
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

/**
 * blog管理模块
 */

//获取文章统计信息
getBlogStatistics = (req, res) => {
  //today、7day、30day
  const { startDate, endDate } = req.query
  const resData = {}
  query('SELECT label FROM post WHERE create_time  between ? and ?', [startDate, endDate])
    .then((result) => {
      if (result.length === 0) {
        res.send({
          code: 200,
          message: 'success',
          data: [],
        })
      } else {
        result.forEach((element) => {
          const labels = JSON.parse(element['label'])
          if (labels) {
            labels.forEach((label) => {
              resData[label] ? (resData[label] += 1) : (resData[label] = 1)
            })
          }
        })
        query(`select label as name,id from blog_labels where id in(${Object.keys(resData)})`).then((result) => {
          if (result) {
            result.forEach((e) => {
              e['value'] = resData[e.id]
            })
          }
          res.send({
            code: 200,
            message: 'success',
            data: result,
          })
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

//根据标签获取文章列表统计信息
getMdListStatisticsByLabel = (req, res) => {
  const { label } = req.query
  console.log(label)
  query(
    'select post.id,post.title,post.blogid,user.nickname,post.create_time,DATE_FORMAT(post.create_time,"%Y-%m") as date from post,user where post.uid=user.uid and label REGEXP ?',
    ['.*?(' + label + ')(,|])']
  ).then((result) => {
    console.log()
    res.send({
      code: 200,
      message: 'success',
      data: result,
    })
  })
}

module.exports = {
  getMdContent,
  getLatestMdList,
  getRecommendMdList,
  getHotMdList,
  searchMd,

  getMdDetail,
  getMdCommentList,

  getBlogStatistics,
  getMdListStatisticsByLabel,
}
