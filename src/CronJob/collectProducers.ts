import * as cron from 'node-cron';
import { upsertProducer } from '../Database/producerActions';
import { bpInfoType, getProducerType } from '../types';
import path from 'node:path';

const cronStr = '0 */6 * * *';
//const cronStr = '*/55 * * * * *';

const apiEndpoints = [
    {
        name: 'EOS',
        url: 'https://eos.eosusa.io',
        chainId:
            'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    },
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
];

const getProducers = async (endpoint: string) => {
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
    return await response.json();
};

const fetchTimeout = (url: string, timeoutMs: number) => {
    const controller = new AbortController();
    const promise = fetch(url, {
        signal: controller.signal,
    });
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return promise.finally(() => clearTimeout(timeoutId));
};

const checkChainsJson = async (url: string, chainId: string) => {
    // Chains.json 에서 체인에 맞는 BP.json 으로 확인, 없으면 BP.json 으로
    try {
        if (!url.startsWith('http')) return;

        const res = await fetchTimeout(path.join(url, 'chains.json'), 5000);
        const chainsjson = await res.json();

        return chainsjson.chains[chainId];
    } catch (error) {
        return;
    }
};

const getBPInfo = async (data: any, chainId: string) => {
    const getBPResponse = data
        .filter((prod: bpInfoType) => {
            if (
                prod.producer_key ===
                'EOS1111111111111111111111111111111114T1Anm'
            )
                return false;

            return true;
        })
        .map(async (prod: bpInfoType, index: number) => {
            try {
                let bpjson = await checkChainsJson(prod.url, chainId);

                // TODO: Chains.json 으로 다른 체인의 BP 정보 긁어오기
                // Chains.json 에서 체인에 맞는 BP.json 으로 확인, 없으면 BP.json 으로
                if (!bpjson) bpjson = 'bp.json';
                const res = await fetchTimeout(
                    path.join(prod.url, bpjson),
                    5000
                );

                const bpData = await res.json();
                prod.rank = index + 1;
                prod.candidate_name = bpData.org.candidate_name;
                prod.location = bpData.org.location.name;
                prod.country = bpData.org.location.country;
                prod.logo_svg = bpData.org.branding.logo_svg;
                prod.logo_png = bpData.org.branding.logo_256;

                return prod;
            } catch (error: any) {
                // console.log(
                //     prod.owner + ' => bp.json Error: '.concat(error.message)
                // );
                prod.rank = index + 1;
                prod.candidate_name = prod.owner;
                return prod;
            }
        });

    return (await Promise.all(getBPResponse)) as bpInfoType[];
};

export const collect_producers = async () => {
    cron.schedule(cronStr, async () => {
        console.log('Collecting BP Data...');

        const data = apiEndpoints.map(async (endpoint) => {
            try {
                // Collect Producer Info
                const data = await getProducers(endpoint.url);

                // Fio 는 Producers 배열 키 값이 다름
                if (endpoint.name === 'FIO') {
                    data['rows'] = data['producers'];
                    delete data['producers'];
                }

                //  Collect Producer's BP.json
                const finalData = await getBPInfo(data.rows, endpoint.chainId);
                const result = { chainId: endpoint.chainId, info: finalData };
                //console.log('Test: \n' + JSON.stringify(result));
                return result;
            } catch (error: any) {
                console.error(error.message);
            }
        });
        const returndata = (await Promise.all(data)) as getProducerType[];

        upsertProducer(returndata);
    });
};
