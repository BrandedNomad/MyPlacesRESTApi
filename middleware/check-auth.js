const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');

module.exports = (req,res,next)=>{
    if(req.method === 'OPTIONS'){
        console.log(process.env.JWT_SECRET_KEY)
        return next();
    }
    try{
        const token= req.headers.authorization.split(' ')[1];
        if(!token){
            throw new Error('Authentication failed!');
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.userData = {decodedToken:decodedToken.userId}
        next()
    }catch(error){
        const Autherror = new HttpError('Authentication failed!', 401);
        return next(Autherror)
    }

}