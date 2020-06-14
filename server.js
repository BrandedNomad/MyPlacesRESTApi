const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const mongoose = require('mongoose');
const fs = require('fs');

const placesRoutes = require('./routes/places-routes')
const usersRoutes = require('./routes/user-routes')
const HttpError = require('./models/http-error')


//Create server
const server = express()

//Configure server
const port = process.env.PORT
server.use(bodyParser.json())

//ROUTES

//Static folder to server images from
server.use('/uploads/images',express.static(path.join('uploads','images')))

////CORS Headers
server.use((req,res,next)=>{
    //Which domains should have access
    res.setHeader(
        'Access-Control-Allow-Origin',
        '*'
    );
    //Which Headers requests may have
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    //Which methods requests may include
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE'
    );
    next();
});

////PLACES ROUTES
server.use('/api/places',placesRoutes)

////USER ROUTES
server.use('/api/users',usersRoutes)

//ROUTE NOT FOUND ERROR RESPONSE - returns an error when a route is not found
server.use((req,res,next)=>{
    const error = new HttpError('Could not find this route.',404);
    throw error;
})

////ERROR HANDLING MIDDLEWARE -executes when any middle ware above yields an error
server.use((error,req,res,next)=>{
    if(req.file){
        fs.unlink(req.file.path,(error)=>{
            console.log(error);
        })

    }
    //If response header has already been sent
    if(res.headerSent){
        return next(error);
    }
    res.status(error.code || 500).json({message:error.message || 'An unknown error occured'});
})


// Connect to database and Start server
mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@places1-kq2m0.mongodb.net/${process.env.DB_NAME}`,{useNewUrlParser:true,useUnifiedTopology:true,useFindAndModify:false,useCreateIndex:true})
    .then(()=>{
        server.listen(port,(error,response)=>{
            if(error){
                return console.log(error)
            }
            console.log('Server up and running on port: ' + port)
        })
    })
    .catch((error)=>{
        console.log(error)
    })
