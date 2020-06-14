//importing third party modules
const {validationResult} = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');

//importing user defined module
const HttpError = require('../models/http-error');
const geocodeAddress = require('../utils/geocode');
const Place = require('../models/Place')
const User = require('../models/user')


//CONTROLLERS

////CONTROLLER - Searches for and returns place by it's id.
const getPlaceById = async (req,res,next)=>{
    const placeId = req.params.pid
    try{
        const place = await Place.findById(placeId)
        if(!place){
            const error = new HttpError('Could not find a place for the provided id.',404);
            return next(error);
        }else{
            res.status(200).json({place:place.toObject({getters:true})})
        }
    }catch(error){
        const findPlaceError = new HttpError('Something went wrong',500)
        return next(findPlaceError);

    }


}


//CONTROLLER -searches for and returns all the places created by a particular user.
const getPlacesByUserId = async (req,res,next)=>{
    const userId = req.params.uid;
    try{
        const userPlaces = await User.findById(userId).populate('places')
        if(userPlaces.places.length === 0){
            const error = new HttpError('Could not find a place for the provided user id.',404);
            return next(error);
        }else{
            res.status(200).json({places:userPlaces.places.map((place)=>{
                return place.toObject({getters:true})
                })})
        }
    }catch(error){
        const findPlacesError = new HttpError('Something went wrong',500)
        return next(findPlacesError);
    }

}

const createPlace = async (req,res,next)=>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        next(new HttpError('Invalid input, please check your data.',422))
    }

    const {title,description,address,creator,image} = req.body;

    let coordinates;

    try{
        coordinates = await geocodeAddress(address);
    }catch(error){
        return next(error)
    }

    const createdPlace = new Place({
        title,
        description,
        location: coordinates,
        address,
        creator,
        image:req.file.path
    });


    let user;
    try{
        user = await User.findById(creator);
        if(!user){
            const noUserError = new HttpError('Could not find user for provided id',422)
            return next(noUserError)
        }else{
            try{
                const sess = await mongoose.startSession();
                sess.startTransaction();
                await createdPlace.save({session:sess});
                user.places.push(createdPlace)
                await user.save({session:sess})
                sess.commitTransaction();
                res.status(201).json({place:createdPlace})

            }catch(error){
                const saveToDatabaseError = new HttpError('Creating place failed, please try again',500);
                return next(saveToDatabaseError);
            }
        }
    }catch(error){
        const userIdError = new HttpError('Creating place failed, please try again',500);
        return next(userIdError)
    }

}

const updatePlaceById = async (req,res,next)=>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        throw new HttpError('Invalid input, please check your data.',422)
    }

    let place;

    try{
        const placeId = req.params.pid
        const {title,description} = req.body;

        try{
            place = await Place.findById(placeId)

        }catch(error){
            const findError = new HttpError("Could not find place",500);
            return next(findError)
        }

        if(place.creator.toString() !== req.userData.decodedToken){
            const credentialError =  new HttpError('You are not allowed to edit this place.',404)
            return next(credentialError);
        }

        place.title = title;
        place.description = description;

        const updatedPlace = await place.save()
        if(!updatedPlace){
            const error = new HttpError("'updating place failed, please try again",403)
            return next(error)
        }else{
            res.status(200).json({place:updatedPlace.toObject({getters:true})});
        }

    }catch(error){
        const updateError = new HttpError('Something went wrong',500);
        return next(updateError);
    }

}

const deletePlace = async (req,res,next)=>{
    try{
        const placeId = req.params.pid
        const place = await Place.findById(placeId).populate('creator')
        if(!place){
            const error = new HttpError('Could not find place',500);
            return next(error);
        }

        const imagePath = place.image;

        if(place.creator.id.toString() !== req.userData.decodedToken){
            const credentialError = new HttpError("You are not authorized to delete this place",403)
            return next(credentialError);
        }

        try{
            const session = await mongoose.startSession();
            session.startTransaction()
            await place.remove({session:session})
            place.creator.places.pull(place);
            await place.creator.save({session: session})
            session.commitTransaction();
        }catch(error){
            const deleteError = new HttpError("Something went wrong in session",500)
            return next(deleteError)
        }

        fs.unlink(imagePath,(error)=>{
            console.log(error);
        });

        res.status(200).json(place.toObject({getters:true}))

    }catch(error){
        const deleteError = new HttpError('Something went wrong',500);
        return next(deleteError);
    }
}

//EXPORTS
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.udpatePlaceById= updatePlaceById;
exports.deletePlace = deletePlace;

