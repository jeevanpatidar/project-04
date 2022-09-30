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

        const shortUrlParesent = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        if (shortUrlParesent) return res.status(200).send({ status: true, data: shortUrlParesent })

        const urlCode = shortid.generate().toLocaleLowerCase()

        const alreadyExist = await urlModel.findOne({ urlCode: urlCode })
        if (alreadyExist) {
            return res.status(400).send({ status: false, message: `${urlCode} is already exist ` })
        }

        const shortUrl = baseurl + "/" + urlCode

        const present = await urlModel.findOne({ shortUrl: shortUrl })
        if (present) return res.status(400).send({ status: false, message: `${shortUrl} is already exist` })

        let newData = { longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode }

        await urlModel.create(newData)

        return res.status(201).send({ status: true, message: "url sucessfully created", data: newData })


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

        const data = await urlModel.findOne({ urlCode: urlCode });

        if (!data) { return res.status(400).send({ status: false, message: `${urlCode} urlCode not found!!` }) }

        if (data) {
            res.status(302).redirect(data.longUrl)
        };


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




module.exports = { createShortUrl, getUrlCode }

