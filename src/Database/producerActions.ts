import { fetchProducerParams, getProducerType } from '../types';
import { connectToDB } from './db';
import GetProducer from './producerModel';
import { FilterQuery } from 'mongoose';

export async function fetchProducers({
    owner: owner,
    searchString = '',
    pageNumber = 1,
    pageSize = 30,
    sortBy = 'asc',
}: fetchProducerParams) {
    try {
        connectToDB();

        const skipAmount = (pageNumber - 1) * pageSize;
        const regex = new RegExp(searchString, 'i');

        const query: FilterQuery<typeof GetProducer> = {
            id: { $ne: owner },
        };

        if (searchString.trim() !== '') {
            query.$or = [{ owner: { $regex: regex } }];
        }

        const sortOptions = { rank: sortBy };

        const producerQuery = GetProducer.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize);

        const totalCount = await GetProducer.countDocuments(query);
        const producers = await producerQuery.exec();

        const isNext = totalCount > skipAmount + producers.length;

        return { producers, isNext, totalCount };
    } catch (error: any) {
        throw new Error(`${error.message}`);
    }
}

export async function upsertProducer(prods: getProducerType[]) {
    try {
        connectToDB();
        for (const [index, prod] of prods.entries()) {
            await GetProducer.findOneAndUpdate(
                { owner: prod.owner },
                {
                    rank: index + 1,
                    total_votes: prod.total_votes,
                    producer_key: prod.producer_key,
                    is_active: prod.is_active,
                    url: prod.url,
                    unpaid_blocks: prod.unpaid_blocks,
                    last_claim_time: prod.last_claim_time,
                    location_code: prod.location_code,
                    candidate_name: prod.candidate_name,
                    logo_svg: prod.logo_svg,
                    location: prod.location,
                    country: prod.country,
                },
                { upsert: true }
            );
            // await GetProducer.findByIdAndUpdate(prod.owner, {
            //     $push: { blockexplorer: createdGetProducer._id },
            // });
        }
    } catch (error: any) {
        throw new Error(`Error on Create Producers: ${error.message}`);
    }
}
