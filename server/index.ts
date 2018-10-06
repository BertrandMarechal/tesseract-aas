import fs from 'fs';
import express from 'express';
import http from 'http';
import * as bodyParser from 'body-parser';
import { Image } from './classes/image';

const app = express();
const server = http.createServer(app);

app.use((req: any, res: any, next: any) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    // res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, 0, undefined, Cache-Control, 1');
    next()
});

app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));       // to support JSON-encoded bodies


app.post('/upload', (req: any, res: any) => {
    let body = req.body;
    fs.writeFile('data/image.png', body.Body.replace(/^data:image\/png;base64,/, ""), 'base64', () => {
        const image = new Image();
        image.process().then((data) => {
            res.send(data);
        });
    });
});
app.get('/image', (req: any, res: any) => {
    res.send({ Payload: 'ok' });
});


server.listen(65065, (error: any) => {
    if (error) {
        console.log(error);
    } else {
        console.log('listening on 65065');
    }
});