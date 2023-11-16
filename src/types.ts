import { SortOrder } from 'mongoose';

export type fetchProducerParams = {
    chainId: string;
    owner: string;
    searchString?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: SortOrder;
};
export type getProducerType = {
    chainId: string;
    total_producer_vote_weight: string;
    rows: bpInfoType[];
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
    location: string;
    bp_json: bpJsonType;
};

export type bpJsonType = {
    producer_account_name: string;
    org: {
        candidate_name: string;
        website: string;
        code_of_conduct: string;
        ownership_disclosure: string;
        email: string;
        github_user: string | string[];
        branding: {
            logo_256: string;
            logo_1024: string;
            logo_svg: string;
        };
        location: {
            name: string;
            country: string;
            latitude: number;
            longitude: number;
        };
        social: {
            steemit: string;
            twitter: string;
            github: string;
            keybase: string;
            telegram: string;
        };
    };
    nodes: [
        {
            location: {
                name: string;
                country: string;
                latitude: number;
                longitude: number;
            };
            node_type: string[];
            p2p_endpoint: string;
            api_endpoint: string;
            ssl_endpoint: string;
        }
    ];
};

export type IsoCountryCodeType = {
    'country-code': string;
    name: string;
    'alpha-2': string;
};
