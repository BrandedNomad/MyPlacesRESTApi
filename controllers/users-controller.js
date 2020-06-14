const {v4:uuidv4} = require('uuid')
const {validationResult} = require('express-validator')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error')
const User = require('../models/user')


const getUsers = async (req,res,next)=>{
    try{
        const users = await User.find({},'-password')
        res.status(200).json({users:users.map((user)=>{
            return user.toObject({getters:true})
            })})
    }catch(error){
        const findUsersError = new HttpError("Something went wrong",500)
        return next(findUsersError)
    }
}

const signup = async (req,res,next)=>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        throw new HttpError('Invalid input, please check your data.',422)
    }

    try{
        const {name, email, password} = req.body

        let hashedPassword;
        hashedPassword = await bcrypt.hash(password,12)

        const createdUser = new User({
            name,
            email,
            password:hashedPassword,
            image:req.file.path,
            places:[]
        })

        try{
            const newUser = await createdUser.save();

            let token = jwt.sign(
                {userId:newUser.id,email:createdUser.email},
                process.env.JWT_SECRET_KEY,
                {
                    expiresIn:'1h'
                })
            res.status(201).json({userId:newUser.id,email:createdUser.email,token:token})
        }catch(error){
            const existingUserError = new HttpError('Could not create user, email already exists',422)
            return next(existingUserError)
        }


    }catch(error){
        const userCreationError = new HttpError('Something went wrong',500)
        return next(userCreationError)
    }

}

const login = async (req,res,next)=>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        throw new HttpError('Invalid input, please check your data.',422)
    }

    try{
        const {email,password} = req.body;
        const identifiedUser = await User.findOne({email:email});
        if(!identifiedUser){
            const invalidUserError = new HttpError('User does not exist',401);
            return next(invalidUserError)
        }else{
            let isValidPassword = false;
            isValidPassword = await bcrypt.compare(password,identifiedUser.password);
            if(isValidPassword){
                let token = jwt.sign(
                    {userId:identifiedUser.id,email:email},
                    process.env.JWT_SECRET_KEY,
                    {
                        expiresIn:'1h'
                    });
                res.status(200).json({userId:identifiedUser.id,email:email,token:token});
            }else{
                const invalidCredentialsError = new HttpError('User does not exist',401);
                return next(invalidCredentialsError)
            }

        }
    }catch(error){
        const userLoginError = new HttpError("Something went wrong",500);
        return next(userLoginError);

    }

}

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;

