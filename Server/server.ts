import { IncomingMessage, ServerResponse, request, RequestOptions, Server } from 'http';
import { TcpSocketConnectOpts, Socket, Server as NetServer, LookupFunction } from 'node:net';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import {Express, parseUrl2RegexGroup} from './http-server'

const PORT: any = process.env['PORT'] || 4202;
const {server, get, post} = new Express().createServer();
get('/', (req: IncomingMessage, res: ServerResponse) => {
    const filePath = join(process.cwd(), 'client/index.html');
    const html =  readFileSync(filePath);
    res.setHeader('Content-Type', 'html');
    res.end(html);
})

server.listen(PORT);
console.log(`Server running at http://127.0.0.1:${PORT}`);




