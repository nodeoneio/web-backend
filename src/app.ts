import express from 'express';
import { collect_producers } from './CronJob/collectProducers';
import { fetchProducers } from './Database/producerActions';

const app = express();
const port = 8888;

global.process.setMaxListeners(200);

collect_producers();

app.get('/', (req, res) => {
    console.log(process.cwd());
    res.send('Hello This is NodeONE!');
});

app.get('/getproducers/:chainid/:pagenum/:pagesize/:searchstring?', async (req, res) => {
    const producers = await fetchProducers({
        chainId: String(req.params.chainid),
        owner: '',
        searchString: String(req.params.searchstring),
        pageNumber: Number(req.params.pagenum),
        pageSize: Number(req.params.pagesize),
        sortBy: 'asc',
    });
    res.type('json');
    res.send(JSON.stringify(producers));
});

app.listen(port, () => {
    console.log(`Server app listening on port ${port}`);
});
