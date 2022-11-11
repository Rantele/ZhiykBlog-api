var express = require("express");
var router = express.Router();
var website = require("../controller/website/websiteController");

//websites
router.get("/ws/:name", website.getWS);
router.get("/list", website.list);
router.post("/create", website.createWS);
router.post("/delete", website.deleteWS);
router.post("/update/:id", website.updateWS);

module.exports = router;
