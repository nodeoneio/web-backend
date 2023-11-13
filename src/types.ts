import { SortOrder } from 'mongoose';

export type UpdateProducerParams = {
    account: string;
    name: string;
    rank: number;
    imageURL: string;
    location: string;
    website: string;
    totalVotes: number;
};

export type fetchProducerParams = {
    chainId:string;
    owner: string;
    searchString?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: SortOrder;
};

export type bpInfoType = {
    owner: string;
    rank: number;
    total_votes: string;
    producer_key: string;
    is_active: number;
    url: string;
    unpaid_blocks: number;
    last_claim_time: string;
    location_code: number;
    candidate_name?: string;
    logo_svg?: string;
    location?: string;
    country?: string;
};

export type getProducerType = {
    chainId: string;
    info: bpInfoType[];
};
