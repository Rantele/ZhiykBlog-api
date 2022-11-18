var express = require('express')
var router = express.Router()

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

//websites
var website = require('../controller/website/websiteController')
router.get('/websites/img/:name', website.getWSImg)
router.get('/websites/list', website.list)
router.post('/websites/create', website.createWS)
router.post('/websites/delete', website.deleteWS)
router.post('/websites/update', website.updateWS)

//banners
var banners = require('../controller/banner/bannerController')
router.get('/banners/img/:name', banners.getBannerImg)
router.get('/banners/list', banners.list)
router.post('/banners/create', banners.createBanner)
router.post('/banners/delete', banners.deleteBanner)

module.exports = router
