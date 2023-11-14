import { getPositionOfLineAndCharacter } from 'typescript';
import { fetchProducerParams, getProducerType } from '../types';
import { connectToDB } from './db';
import GetProducer from './producerModel';
import IsoCountryCode from './isoCodeModel';
//import { FilterQuery } from 'mongoose';

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

        const result = await GetProducer.aggregate([
            {
                $match: { chainId: chainId },
            },
            {
                $project: {
                    _id: 0,
                    chainId: 1,
                    totalCount: {
                        $size: '$info',
                    },
                    info: 1,
                },
            },
            {
                $project: {
                    _id: 0,
                    chainId: 1,
                    totalCount: 1,
                    info: {
                        $slice: ['$info', skipAmount, pageSize],
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    chainId: 1,
                    totalCount: 1,
                    info: {
                        $sortArray: {
                            input: '$info',
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
        const producers = result[0].info;
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

        await GetProducer.deleteMany({});
        await GetProducer.insertMany(prods);

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
