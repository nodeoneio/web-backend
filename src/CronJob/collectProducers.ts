import * as cron from 'node-cron';
import { fetchLocation, upsertProducer } from '../Database/producerActions';
import {
    IsoCountryCodeType,
    bpInfoType,
    bpJsonType,
    getProducerType,
} from '../types';
import path from 'node:path';

const cronStr = '0 0 * * *';
//const cronStr = '*/55 * * * * *';

const apiEndpoints = [
    {
        name: 'Jungle4',
        url: 'https://api-jungle4.nodeone.network:8344',
        chainId:
            '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
    },
    {
        name: 'FIO',
        url: 'https://api-fio.nodeone.network:8344',
        chainId:
            '21dcae42c0182200e93f954a074011f9048a7624c6fe81d3c9541a614a88bd1c',
    },
    {
        name: 'Proton',
        url: 'https://api-proton.nodeone.network:8344',
        chainId:
            '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',
    },
    {
        name: 'Libre',
        url: 'https://api-libre.nodeone.network:8344',
        chainId:
            '38b1d7815474d0c60683ecbea321d723e83f5da6ae5f1c1f9fecc69d9ba96465',
    },
    {
        name: 'EOS',
        url: 'https://eos.eosusa.io',
        chainId:
            'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    },
];

const getProducers = async (name: string, endpoint: string) => {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            limit: '1000',
            json: true,
        }),
    };
    const response = await fetch(
        path.join(endpoint, 'v1', 'chain', 'get_producers'),
        requestOptions
    );
    const result = await response.json();

    // Fio 는 Producers 배열의 키 값이 다름
    if (name.toUpperCase() === 'FIO') {
        result['rows'] = result['producers'];
        delete result['producers'];
    }
    return result as getProducerType;
};

const fetchTimeout = (url: string, timeoutMs: number) => {
    const controller = new AbortController();
    const promise = fetch(url, {
        signal: controller.signal,
    });
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return promise.finally(() => clearTimeout(timeoutId));
};

const getBPjsonPathFromChainsJson = async (url: string, chainId: string) => {
    // Chains.json 에서 체인에 맞는 BP.json 으로 확인, 없으면 BP.json 으로
    try {
        const res = await fetchTimeout(path.join(url, 'chains.json'), 5000);
        const chainsjson = await res.json();

        return chainsjson.chains[chainId];
    } catch (error) {
        return 'bp.json';
    }
};

const sleep = (sec: number) => {
    let start = Date.now(),
        now = start;
    while (now - start < sec * 1000) {
        now = Date.now();
    }
};

const getBPInfo = async (
    data: bpInfoType[],
    chainId: string,
    isoLocationInfo: IsoCountryCodeType[]
) => {
    const getBPResponse = data
        .filter((bpInfo: bpInfoType) => {
            if (
                bpInfo.producer_key ===
                'EOS1111111111111111111111111111111114T1Anm'
            )
                return false;

            return true;
        })
        .map(async (bpInfo: bpInfoType, index: number) => {
            bpInfo.rank = index + 1;
            const locName = isoLocationInfo.find(
                (item) => item['country-code'] == bpInfo.location
            );
            bpInfo.location = locName
                ? locName.name
                : `Unknown(${bpInfo.location})`;
            try {
                if (
                    !bpInfo.url ||
                    bpInfo.url === '' ||
                    !bpInfo.url.startsWith('http') ||
                    bpInfo.owner === 'dposclubprod' // invalid BP.json(https://about.dpos.club/bp.json)
                )
                    throw new Error('No BP info or invalid webpage');

                let bpJsonPath = await getBPjsonPathFromChainsJson(
                    bpInfo.url,
                    chainId
                );
                const res = await fetchTimeout(
                    path.join(bpInfo.url, bpJsonPath),
                    5000
                );
                const bpData = (await res.json()) as bpJsonType;
                // console.log(bpData);

                bpInfo.bp_json = bpData;
                // prod.candidate_name = bpData.org.candidate_name
                //     ? bpData.org.candidate_name
                //     : prod.owner;
                // prod.location = [
                //     bpData.org.location.name,
                //     bpData.org.location.country,
                // ].join(', ');

                return bpInfo;
            } catch (error: any) {
                // console.log(
                //     prod.owner + ' => bp.json Error: '.concat(error.message)
                // );

                // if (prod.location === '0') {
                //     prod.location = 'Unknown';
                // } else {
                //     locations.forEach((loc) => {
                //         prod.location =
                //             loc['country-code'] === prod.location
                //                 ? loc['name']
                //                 : 'Unknown';
                //     });
                // }

                bpInfo.url = bpInfo.url.startsWith('http') ? bpInfo.url : '';
                // prod.candidate_name = prod.owner;
                return bpInfo;
            }
        });

    return (await Promise.all(getBPResponse)) as bpInfoType[];
};

export const collect_producers = async () => {
    const isoLocationInfo: IsoCountryCodeType[] = await fetchLocation();

    cron.schedule(cronStr, async () => {
        console.log('Collecting BP Data...');

        const data = apiEndpoints.map(async (endpoint) => {
            try {
                console.log('Collecting ' + endpoint.name);
                sleep(5);
                // Collect a chain's Producer array
                const getProducerResult = await getProducers(
                    endpoint.name,
                    endpoint.url
                );
                //  Collect Producer's BP.json
                const bpInfo = await getBPInfo(
                    getProducerResult.rows,
                    endpoint.chainId,
                    isoLocationInfo
                );
                getProducerResult['rows'] = bpInfo;
                getProducerResult.chainId = endpoint.chainId;

                return getProducerResult as getProducerType;
            } catch (error: any) {
                console.error(error.message);
            }
        });
        const res = (await Promise.all(data)) as getProducerType[];
        upsertProducer(res);
    });
};
