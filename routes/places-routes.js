//Importing third-party modules
const express = require('express');
const {check} = require('express-validator')

//Importing user defined modules
const placesControllers = require('../controllers/places-controller')
const fileUpload = require('../middleware/file-upload')
const checkAuth = require('../middleware/check-auth')


//Create the Router
const router = express.Router();

//ROUTES

////GET ROUTE - Finds and Returns a Place by it's ID
router.get('/:pid',placesControllers.getPlaceById)

////GET ROUTE -Finds and Returns a all the Places associated with a specific userID.
router.get('/user/:uid',placesControllers.getPlacesByUserId)


////Auth Middleware
router.use(checkAuth);

////POST ROUTE
router.post('/',
    fileUpload.single('image'),
    [
        check('title').not().isEmpty(),
        check('description').isLength({min:5}),
        check('address').not().isEmpty()
    ],
    placesControllers.createPlace)

////PATCH ROUTE
router.patch('/:pid',
    [
        check('title').not().isEmpty(),
        check('description').isLength({min:5}),
    ],
    placesControllers.udpatePlaceById)

router.delete('/:pid',placesControllers.deletePlace)

module.exports = router;