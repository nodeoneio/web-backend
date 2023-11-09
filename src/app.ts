import express from 'express';
import { collect_producers } from './CronJob/collectProducers';
import { fetchProducers } from './Database/producerActions';

const app = express();
const port = 8888;

collect_producers();

app.get('/', (req, res) => {
    console.log(process.cwd());
    res.send('Hello World!');
});

app.get('/getproducers/:pagenum/:pagesize', async (req, res) => {

    const producers = await fetchProducers({
        owner: '',
        searchString: '',
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
