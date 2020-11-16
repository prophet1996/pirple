/**
 *
 * Primary file for the api
 *
 */

// dependencies
import http, { IncomingMessage, ServerResponse } from 'http';
// import https from 'https';
import url from 'url';
import path from 'path';
import { StringDecoder } from 'string_decoder';
import { readFileSync } from 'fs';

import config from './config';
import handlers from '../lib/handlers';
import { parseJsonToObject } from '../lib/helpers';

const { httpPort, envName } = config;

const router:any = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
};

const mainServer = (req:IncomingMessage, res:ServerResponse) => {
  const { headers, url: reqUrl } = req;
  const parsedUrl = url.parse(reqUrl || '', true);
  const { pathname: reqPath, query } = parsedUrl;
  const trimmedPath = reqPath?.replace(/^\/+|\/+$/g, '') || '';

  const method = req.method?.toLowerCase();

  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += data;
  });

  req.on('end', () => {
    buffer += decoder.end();
    const chosenHandler = (typeof router[trimmedPath] !== 'undefined')
      ? router[trimmedPath] : handlers.notFound;

    const data = {
      trimmedPath,
      query,
      method,
      headers,
      payload: parseJsonToObject(buffer),
    };
    chosenHandler(data, (statusCode = 200, _data = {}) => {
      const status = typeof (statusCode) === 'number' ? statusCode : 200;
      const payload = typeof (_data) === 'object' ? _data : {};

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(status);
      if (statusCode !== 204) {
        const payloadString = JSON.stringify(payload);
        res.end(payloadString);
      }
      res.end();
    });
  });
};

const httpServer = http.createServer((req:IncomingMessage, res:ServerResponse) => {
  mainServer(req, res);
});

httpServer.listen(httpPort, () => {
  // eslint-disable-next-line no-console
  console.log(`The server is listening on port ${httpPort} on ${envName}`);
});

const httpsServerOptions = {
  key: readFileSync(path.resolve(__dirname, '../https/key.pem')),
  cert: readFileSync(path.resolve(__dirname, '../https/cert.pem')),
};

// const httpsServer = https.createServer(httpsServerOptions,
//   (req:IncomingMessage, res:ServerResponse) => {
//     mainServer(req, res);
//   });

// httpsServer.listen(httpsPort, () => {
//   // eslint-disable-next-line no-console
//   console.log(`The server is listening on port ${httpsPort} on ${envName}`);
// });
