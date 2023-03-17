import express, { Express, Request, Response } from 'express';
import { v4 } from 'uuid';
import { Logger } from 'winston';
import conf from '../../conf';
import { User } from '../../model/user';
import { Util } from '../../util';
import { AppTurnServer } from '../turn/server';
import { AddUserApi } from './AddUser';
import { LoginAPI } from './Login';
import { Token } from './token.';
import cors from 'cors';
export class AppApiServer {

    private turnServer: AppTurnServer;

    private id: string = v4();

    private util: Util = new Util();

    private logger: Logger = this.util.log({ application: conf['api-app-name'] }, { uid: this.id })

    constructor(turnServer: AppTurnServer) {
        this.turnServer = turnServer;
    }

    private endpoints = (app: Express): void => {
        app.post('/addUser', async (request: Request, response: Response) => {
            new AddUserApi(this.turnServer, this.logger).processRequest(request, response);
        });

        app.post('/login', async (request: Request, response: Response) => {
            new LoginAPI(this.logger).processRequest(request, response);
        });

        app.get('/verifyToken', (request: Request, response: Response) => {
            if(request.query['token']){
                new Token(this.logger).verifyToken(`${request.query['token']}`)
                .then((user: User) => {
                    response.statusCode = 200;
                    response.send(user);
                }).catch((err) => {
                    response.statusCode = 500;
                    response.send(err);
                })

            }
        })
    }

    public createServer = (): void => {
        var app: Express = express();
        app.use(express.json());
        app.use(cors({
            origin: ['http://localhost:8000']
        }))
        this.endpoints(app);
        app.listen(conf['api-port'], () => {
            this.logger.info(`API Server is started !!!`)
        })
    }
}