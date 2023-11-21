import { fetchProducerParams } from '../types';
import { connectToDB } from './db';
import Producer from './producerModel';

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
                    total_producer_vote_weight: 1,
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
                    total_producer_vote_weight: 1,
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
                    total_producer_vote_weight: 1,
                },
            },
        ]);

        if (result.length === 0) {
            return {
                chainid: chainId,
                producers: [],
                isNext: false,
                totalCount: 0,
                total_producer_vote_weight: 0,
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
            total_producer_vote_weight: result[0].total_producer_vote_weight,
        };
    } catch (error: any) {
        throw new Error(`${error.message}`);
    }
}