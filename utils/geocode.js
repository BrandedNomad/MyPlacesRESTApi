
const axios = require('axios')

const HttpError = require('../models/http-error')


const apiKey = process.env.GEO_API_KEY;

const geocodeAddress = async (address)=>{

    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`);
    const data = response.data;
    if(!data || data.status === 'ZERO_RESULTS'){
        const error = new HttpError('Could not find location for the specified address',422);
        throw error;
    }

    const coordinates = data.results[0].geometry.location;

    return coordinates;
}

module.exports = geocodeAddress;