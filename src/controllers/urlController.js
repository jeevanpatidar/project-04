const urlModel=require("../models/urlModel")
const shortid=require('shortid');
const validUrl=require('valid-url')
const redis=require('redis')

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

const createShortUrl=async function(req,res){
    try {
        let longUrl=req.body.longUrl;

        if(! isValidRequestBody(longUrl))
        {return res.status(400).send({ status: false, message: "plz Enter Input in request body" });}

    if(longUrl){
        if (! isValid(longUrl))
         {return res.status(400).send({ status: false, message: "plz Enter long Url" });}
        if(!urlRegex.test(longUrl))
        {return res.status(400).send({ status: false, message: `${longUrl} is not a Valid long Url` });}
        }

        
    } catch (error) {
        return res.status(500).send({status:false, message:error.message})
    }
}

