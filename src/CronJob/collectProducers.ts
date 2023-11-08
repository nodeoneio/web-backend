import * as cron from 'node-cron';
import { upsertProducer } from '../Database/producerActions';
import { getProducerType } from '../types';

const fetchTimeout = (url: string, timeoutMs: number) => {
    const controller = new AbortController();
    const promise = fetch(url, {
        signal: controller.signal,
    });
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return promise.finally(() => clearTimeout(timeoutId));
};

export const collect_producers = () => {
    cron.schedule('* */2 * * *', async () => {
        try {
            //Collect from getProducer API
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    limit: '7',
                    json: true,
                    //lower_bound: 'aus1genereos',
                }),
            };
            const response = await fetch(
                // 'https://api-jungle4.nodeone.network:8344/v1/chain/get_producers',
                'https://eos.eosusa.io/v1/chain/get_producers',
                requestOptions
            );
            const data = await response.json();

            //  Get BP.json
            const getBPResponse = data.rows.map(
                async (prod: getProducerType) => {
                    try {
                        const res = await fetchTimeout(
                            prod.url.concat('/bp.json'),
                            2000
                        );

                        const d = await res.json();

                        prod.candidate_name = d.org.candidate_name;
                        prod.location = d.org.location.name;
                        prod.country = d.org.location.country;
                        prod.logo_svg = d.org.branding.logo_svg;
                        //console.log(prod);
                        return prod;
                    } catch (error: any) {
                        console.log(
                            prod.owner +
                                ' => bp.json Error: '.concat(error.message)
                        );
                        prod.candidate_name = prod.owner;
                        console.log(prod);

                        return prod;
                    }
                }
            );

            const bpData = await Promise.all(getBPResponse);

            upsertProducer(bpData);
        } catch (error: any) {
            console.error(error.message);
        }
    });
};
