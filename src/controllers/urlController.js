const urlModel = require("../models/urlModel")
const shortid = require('shortid');
const validUrl = require('valid-url')
const redis = require('redis')
const { promisify } = require("util");


//create connection to redis
const redisClient = redis.createClient(
    17920, //redis port
    "redis-17920.c301.ap-south-1-1.ec2.cloud.redislabs.com", //redis db url
    { no_ready_check: true }
);
redisClient.auth("mTbvsPH8cxzG6r116Sb8wpT6JX4yfJN2", function (err) {  //redis db password
    if (err) throw err;
});
redisClient.on("connect", async function () { //build connection with redis db
    console.log("connected to redis");
});

//set Get and Set for cache
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


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


//--------------------------------------------Create Short Url------------------------------------------------------------

const createShortUrl = async function (req, res) {
    try {
        let bodyData = req.body

        const baseurl = "http://localhost:3000"

        if (!isValidRequestBody(bodyData)) return res.status(400).send({ status: false, message: " body cant't be empty Please enter some data." });

        longUrl = bodyData.longUrl

        if (!isValid(longUrl)) { return res.status(400).send({ status: false, message: " longUrl is required " }); }

        if (longUrl) {
            if (!urlRegex.test(longUrl)) { return res.status(400).send({ status: false, message: `${longUrl} is not a Valid longUrl` }); }
        }

        if (!validUrl.isUri(longUrl)) {
            return res.status(400).send({ status: false, message: "longUrl invalid" })
        }
        //check long url present in redis or not
        const cacheUrl = await GET_ASYNC(`${longUrl}`);
        const shortUrlParesent = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })

        if (cacheUrl) {
            return res.status(200).send({ status: true, data: shortUrlParesent })
        }

        const urlCode = shortid.generate().toLowerCase()

        const alreadyExist = await urlModel.findOne({ urlCode: urlCode })
        if (alreadyExist) {
            return res.status(400).send({ status: false, message: `${urlCode} is already exist ` })
        }

        const shortUrl = baseurl + "/" + urlCode

        const present = await urlModel.findOne({ shortUrl: shortUrl })
        if (present) return res.status(400).send({ status: false, message: `${shortUrl} is already exist` })

        let newData = { longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode }

        await urlModel.create(newData)
        const data = await urlModel.findOne({ longUrl }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })

        await SET_ASYNC(`${longUrl}`, JSON.stringify(data));
        return res.status(201).send({ status: true, message: "url sucessfully created", data: data })


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




//-------------------------------------------------Get url Code-----------------------------------------------------------

const getUrlCode = async function (req, res) {
    try {
        const urlCode = req.params.urlCode

        if (!shortid.isValid(urlCode)) {
            return res.status(400).send({ status: false, message: `${urlCode} is invalid` })
        }


        // url code present in cache/redis or not
        const getShortUrl = await GET_ASYNC(`${urlCode}`);
        //if present redirect to long url
        if (getShortUrl) {
            //JSON.parse- parses a string and returns a object
            return res.status(302).redirect(JSON.parse(getShortUrl).longUrl);
        }
        const data = await urlModel.findOne({ urlCode: urlCode });

        if (!data) { return res.status(404).send({ status: false, message: `${urlCode} urlCode not found!!` }) }

        if (data) {
            //set url code in redis
            await SET_ASYNC(`${urlCode}`, JSON.stringify(data));
            res.status(302).redirect(data.longUrl)
        };


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




module.exports = { createShortUrl, getUrlCode }

