const express = require('express');
const router = express.Router();
const { createShortUrl, getUrlCode } = require('../controllers/urlController')



//create Url
router.post('/url/shorten', createShortUrl)

// get urlCode
router.get('/:urlCode', getUrlCode)


router.all("/*", (req, res) => { res.status(400).send({ status: false, message: "Endpoint is not correct plese provide a proper end-point" }) })



module.exports = router;