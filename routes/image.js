var express = require("express");
var router = express.Router();
var image = require("../controller/imageController");

router.get("/avatar/:id", image.getAvatar);
module.exports = router;
