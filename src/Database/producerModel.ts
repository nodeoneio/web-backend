import mongoose from 'mongoose';

const getProducerSchema = new mongoose.Schema({
    chainId: { type: String, required: true, unique: true },
    info: [
        {
            owner: { type: String, required: true, index:true },
            rank: { type: Number, required: true },
            total_votes: String,
            producer_key: String,
            is_active: Number,
            url: String,
            unpaid_blocks: Number,
            last_claim_time: String,
            location_code: Number,
            candidate_name: String,
            logo_svg: String,
            location: String,
            country: String,
        },
    ],
});

const GetProducer =
    mongoose.models.GetProducer ||
    mongoose.model('GetProducer', getProducerSchema);

export default GetProducer;
