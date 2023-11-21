import mongoose from 'mongoose';

const BPJsonSchema = new mongoose.Schema({
    producer_account_name: String,
    org: {
        candidate_name: String,
        website: String,
        code_of_conduct: String,
        ownership_disclosure: String,
        email: String,
        github_user: [String],
        branding: {
            logo_256: String,
            logo_1024: String,
            logo_svg: String,
        },
        location: {
            name: String,
            country: String,
            latitude: Number,
            longitude: Number,
        },
        social: {
            steemit: String,
            twitter: String,
            github: String,
            keybase: String,
            telegram: String,
        },
    },
    nodes: [
        {
            location: {
                name: String,
                country: String,
                latitude: Number,
                longitude: Number,
            },
            node_type: [String],
            p2p_endpoint: String,
            api_endpoint: String,
            ssl_endpoint: String,
        },
    ],
});

const ProducerSchema = new mongoose.Schema({
    chainId: { type: String, required: true, unique: true },
    rows: [
        {
            owner: { type: String, required: true, index: true },
            rank: { type: Number, required: true },
            total_votes: String,
            producer_key: String,
            is_active: Number,
            url: String,
            unpaid_blocks: Number,
            last_claim_time: String,
            location: String,
            location_info: String,
            bp_json: [BPJsonSchema],
        },
    ],
    total_producer_vote_weight: Number,
});

const Producer =
    mongoose.models.Producer || mongoose.model('Producer', ProducerSchema);

export default Producer;
