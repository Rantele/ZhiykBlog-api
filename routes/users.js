let express = require('express')
let router = express.Router()
const users = require('../controller/usersController')

// Router
router.post('/login', users.login) //登录获取token
router.post('/register', users.register) //
router.get('/router', users.router) //获取登录用户相关信息
router.get('/sendmail', users.sendMail)
router.get('/avatar/:name', users.getAvatar)
router.get('/info', users.getUserInfo)

//blog
router.get('/md/statistics', users.getUserMdStatistics)
router.get('/md/img/:name', users.getMdImg)
router.post('/md/createImg', users.uploadMdImg)
router.post('/md/deleteImg', users.deleteMdImg)
router.get('/md/list', users.getUserMdList)
router.get('/md/auditList', users.getUserMdNoAuditList)
router.get('/md/noPassList', users.getUserMdNoPassList)
router.get('/md/:id', users.getUserMdBody)
router.post('/md/create', users.createMd)
router.post('/md/update', users.updateMd)
router.post('/md/delete', users.deleteMd)
router.get('/taglist', users.tagListFilter)

//stars
router.get('/star/postlist', users.getUserMdStarPost)
router.get('/star/list', users.getUserMdStarList)
router.post('/star/create', users.createMdStar)
router.post('/star/delete', users.deleteMdStar)

//vote
router.get('/vote/list', users.getUserVoteList)
router.post('/vote/create', users.createVote)
router.post('/vote/delete', users.deleteVote)

//comment
router.post('/comment/create', users.createComment)
// router.post('/comment/delete',users.deleteComment);

//user manage
router.get('/adminlist', users.getSearchAdminList)
router.get('/list', users.getSearchUserList)
router.get('/rolelist', users.getAdminRoleList)

module.exports = router
