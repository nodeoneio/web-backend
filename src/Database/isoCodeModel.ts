import mongoose from 'mongoose';

const IsoCountryCodeSchema = new mongoose.Schema({
    'country-code': { type: String, required: true, index: true },
    'name': { type: String, required: true },
    'alpha-2': { type: String, required: true },
});

const IsoCountryCode =
    mongoose.models.IsoCountryCode ||
    mongoose.model('IsoCountryCode', IsoCountryCodeSchema);

export default IsoCountryCode;
