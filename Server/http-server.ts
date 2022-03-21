import { createServer, IncomingMessage, ServerResponse, Server } from 'http';

interface Route extends Object {
    path: string,
    ['get-middleware']?: (req: IncomingMessage, res: ServerResponse, callback: any) => void | null;
    ['post-middleware']?: (req: IncomingMessage, res: ServerResponse, callback: any) => void | null;
    ['delete-middleware']?: (req: IncomingMessage, res: ServerResponse, callback: any) => void | null;
    ['put-middleware']?: (req: IncomingMessage, res: ServerResponse, callback: any) => void | null;
    get?: (req: IncomingMessage, res: ServerResponse) => void;
    post?: (req: IncomingMessage, res: ServerResponse) => void;
    delete?: (req: IncomingMessage, res: ServerResponse) => void;
    put?: (req: IncomingMessage, res: ServerResponse) => void;
    [propName: string]: any
}

interface returnServer {
    server: Server,
    get: (path: string, middleware?: Function, callback?: Function) => void,
    post: (path: string, middleware?: Function, callback?: Function) => void,
    delete: (path: string, middleware?: Function, callback?: Function) => void,
    put: (path: string, middleware?: Function, callback?: Function) => void,
    [propName: string]: any
}
class Express {
    constructor() {

    }

    createServer(): returnServer {
        let routeTable: Route[] = [];
        let registerPath = this.registerPath;
        let that = this;
        const server: Server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
            let { url = '/', method = 'get' } = request;
            method = method.toLowerCase();
            let match = false;
            for (let i = 0; i < routeTable.length; i++) {
                let route: Route = routeTable[i];
                const path = parseUrl2RegexGroup(route.path);
                if (new RegExp(path).test(url) && route[method]) {
                    let callback = route[method];
                    let middeware = route[`${method}-middeware`];
                    const regMatch = url.match(new RegExp(path));
                    let params = regMatch?.groups;
                    let query = parseUrlQueryParams(url);
                    let body = await this.readBody(request);
                    let mergeResponse = Object.assign(response, { params, query, body });;
                    let result = await this.processMiddleware(middeware, request, this.createResponse(mergeResponse));
                    if (result) {
                        callback(request, mergeResponse);
                    }
                    match = true;
                    break;
                }
            }

            if (!match) {
                response.statusCode = 404;
                response.end('Not Found 404', 'utf-8');
            }
        });


        return {
            server,
            get: (path: string, ...rest: any): void => {
                let [middleware, callback] = rest;
                if (callback) {
                    registerPath(routeTable, path, 'get', callback, middleware);
                } else {
                    registerPath(routeTable, path, 'get', middleware);
                }
            },
            post: (path: string, ...rest: any): void => {
                let [middleware, callback] = rest;
                if (callback) {
                    registerPath(routeTable, path, 'post', callback, middleware);
                } else {
                    registerPath(routeTable, path, 'post', middleware);
                }
            },
            put: (path: string, ...rest: any): void => {
                let [middleware, callback] = rest;
                if (callback) {
                    registerPath(routeTable, path, 'post', callback, middleware);
                } else {
                    registerPath(routeTable, path, 'post', middleware);
                }
            },
            delete: (path: string, ...rest: any): void => {
                let [middleware, callback] = rest;
                if (callback) {
                    this.registerPath(routeTable, path, 'post', callback, middleware);
                } else {
                    this.registerPath(routeTable, path, 'post', middleware);
                }
            }
        };
    }

    createResponse(res: { [propName: string]: any } & ServerResponse): { [propName: string]: any } & ServerResponse {
        res['send'] = (message: string) => res.end(message);
        res.json = (data: JSON) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
        }
        return res;
    }

    registerPath(routeTable: Route[], path: string, method: string, cb: Function, middleware?: Function) {
        let len: number = routeTable.length;
        while (len > 0) {
            if (routeTable[len].path === path) {
                routeTable[len] = { ...routeTable[len], [method]: cb, [`${method}-middleware`]: middleware }
            }
            len--;
        }
        if (len === 0) {
            routeTable.push({
                path,
                [method]: cb,
                [`${method}-middleware`]: middleware
            })
        }
    }

    async readBody(req: IncomingMessage): Promise<any> {
        let body = '';
        return new Promise((resolve, reject) => {
            req.on('data', (chunk: any) => {
                body += chunk;
            });

            req.on('end', () => {
                if (req.headers.accept === 'application/json') {
                    resolve(JSON.parse(body));
                } else {
                    resolve(body);
                }

            })
            req.on('error', (err: any) => {
                reject(err);
            })
        });
    }


    async processMiddleware(middleware: Function, req: IncomingMessage, res: { [propName: string]: any } & ServerResponse) {
        if (!middleware) {
            return true;
        }

        return new Promise((resolve) => {
            middleware(req, res, function () {
                resolve(true);
            });
        });
    }
}

/**
 * @description set url regex group alias
 * @example /:id/ => /($<id>\\w+)/.match(url) => {groups: {id: 'xxx'}}
 * @param url 
 * @returns 
 */
function parseUrl2RegexGroup(url: string) {
    let str = '';
    let len = url.length;
    for (let i = 0; i < len; i++) {
        let char = url.charAt(i);
        if (char === ':') {
            let j = i + 1;
            while (j < len) {
                if (!/\w/.test(url.charAt(j))) {
                    break;
                }
                j++;
            }
            let name = url.substring(i + 1, j);
            str += `(?<${name}>\\w+)`;
            i = j;
        } else {
            str += char;
        }
    }

    return str;
}

function parseUrlQueryParams(url: string): Object {
    let result: any = url.match(/\?(?<query>.*)/);
    if (!result) {
        return {}
    }

    const { groups: { query } } = result;
    const pairs: Array<string> = query.match(/(?<param>\w+)=(?<value>\w+)/g);
    const params = pairs.reduce
    return {};
}

let createServerFunc = new Express().createServer;
export {
    createServerFunc,
    Express,
    parseUrl2RegexGroup
}