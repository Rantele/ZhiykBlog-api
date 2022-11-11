var express = require('express')
var router = express.Router()
var blogs = require('../controller/blog/blogController')
//Router
router.get('/content/:id', blogs.getMdContent)
router.get('/recommend', blogs.getRecommendMdList)
router.get('/latest', blogs.getLatestMdList)
router.get('/hot', blogs.getHotMdList)
router.get('/search', blogs.searchMd)
//comments
router.get('/detail', blogs.getMdDetail)
router.get('/comment', blogs.getMdCommentList)
module.exports = router
