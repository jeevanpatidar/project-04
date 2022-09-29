const urlModel = require("../models/urlModel")
const shortid = require('shortid');
const validUrl = require('valid-url')
const redis = require('redis')

//-----Validation----//
const isValid = (value) => {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}
const isValidRequestBody = (value) => {
    return Object.keys(value).length > 0
}
// url validation regex
let urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.#?&//=]*)/;

const createShortUrl = async function (req, res) {
    try {
        let longUrl = req.body.longUrl;
        
        const baseurl = "http://localhost:3000"

        if (!isValidRequestBody(longUrl))  return res.status(400).send({ status: false, message: " body cant't be empty Please enter some data." });

        if (longUrl) {
            if (!isValid(longUrl)) { return res.status(400).send({ status: false, message: " Url is required " }); }
            if (!urlRegex.test(longUrl)) { return res.status(400).send({ status: false, message: `${longUrl} is not a Valid long Url` }); }
        }

        if(!validUrl.isUri(longUrl)){
            return res.status(400).send({status: false, message: "url invalid"})
        }

        const shortUrlParesent = await urlModel.findOne({longUrl: longUrl}).select({_id: 0, createdAt: 0, updatedAt: 0, __v: 0})
        if(shortUrlParesent) return res.status(400).send({status: false, message: "isalready exist", data: shortUrlParesent})

        const urlCode = shortid.generate().toLocaleLowerCase()

        const alreadyExist = await urlModel.findOne({urlCode: urlCode}) 
        if(alreadyExist){
            return res.status(400).send({status: false, message: `${urlCode} is already exist `})
        }

        const shortUrl = baseurl + "/" + urlCode

        const present = await urlModel.findOne({shortUrl: shortUrl})
        if(present) return res.status(400).send({status: false, message: `${shortUrl} is already exist`})

        let newData = {longUrl:longUrl, shortUrl: shortUrl, urlCode: urlCode}

        let newData1 = await urlModel.create(newData)
        const data = await urlModel.findOne({longUrl}).select({_id: 0, createdAt: 0, updatedAt: 0, __v: 0})
        return res.status(201).send({status: true, message: "url sucessfully created", data: data})


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




const getUrlCode = async function (req, res){
    try {
        
        
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message }) 
    }
}


module.exports = { createShortUrl }

