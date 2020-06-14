//Importing third-party modules
const express = require('express');
const {check} = require('express-validator');

//Importing user defined modules
const usersControllers = require('../controllers/users-controller');
const fileUpload = require('../middleware/file-upload');

//Create the Router
const router = express.Router();


//ROUTES

////GET ROUTE - Finds and Returns a Place by it's ID
router.get('/',usersControllers.getUsers)

////POST ROUTE
router.post('/signup',
    fileUpload.single('image'),
    [
        check('name').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({min:6})
    ],
    usersControllers.signup)

////POST ROUTE
router.post('/login',
    [
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({min:6})
    ],
    usersControllers.login)

module.exports = router;