import { fetchProducerParams, getProducerType } from '../types';
import { connectToDB } from './db';
import Producer from './producerModel';
import IsoCountryCode from './isoCodeModel';

export async function fetchProducers({
    chainId,
    owner: owner,
    searchString = '',
    pageNumber = 1,
    pageSize = 30,
    sortBy = 'asc',
}: fetchProducerParams) {
    try {
        await connectToDB();

        const skipAmount = (pageNumber - 1) * pageSize;

        const result = await Producer.aggregate([
            {
                $match: { chainId: chainId },
            },
            {
                $project: {
                    _id: 0,
                    chainId: 1,
                    totalCount: {
                        $size: '$rows',
                    },
                    rows: 1,
                },
            },
            {
                $project: {
                    _id: 0,
                    chainId: 1,
                    totalCount: 1,
                    rows: {
                        $slice: ['$rows', skipAmount, pageSize],
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    chainId: 1,
                    totalCount: 1,
                    rows: {
                        $sortArray: {
                            input: '$rows',
                            sortBy: { rank: sortBy === 'asc' ? 1 : -1 },
                        },
                    },
                },
            },
        ]);

        if (result.length === 0) {
            return {
                chainid: chainId,
                producers: [],
                isNext: false,
                totalCount: 0,
            };
        }
        const totalCount = result[0].totalCount;
        const producers = result[0].rows;
        const isNext = totalCount > skipAmount + producers.length;

        return {
            chainid: result[0].chainId,
            producers: producers,
            isNext,
            totalCount: totalCount,
        };
    } catch (error: any) {
        throw new Error(`${error.message}`);
    }
}

export async function upsertProducer(prods: getProducerType[]) {
    try {
        await connectToDB();

        await Producer.deleteMany({});
        await Producer.insertMany(prods);

        console.log('BP Database Update Completed!');
    } catch (error: any) {
        throw new Error(`Error on Create Producers: ${error.message}`);
    }
}

export async function fetchLocation() {
    try {
        await connectToDB();

        return await IsoCountryCode.find({});
    } catch (error: any) {
        throw new Error(`Error on fetch location: ${error.message}`);
    }
}
