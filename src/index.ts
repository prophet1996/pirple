/**
 *
 * Primary file for the api
 *
 */

// dependencies
import http, { IncomingMessage, ServerResponse } from 'http';
import url from 'url';
import { StringDecoder } from 'string_decoder';

import config from './config';

const { port, envName } = config;

const handler:any = {};
handler.sample = (data:any, callback:any) => {
  callback(200, JSON.parse(data.payload));
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
handler.notFound = (_:any, callback:any) => {
  callback();
};

const router:any = {
  sample: handler.sample,
};

const server = http.createServer((req:IncomingMessage, res:ServerResponse) => {
  const { headers, url: reqUrl } = req;
  const parsedUrl = url.parse(reqUrl || '', true);
  const { pathname: path, query } = parsedUrl;
  const trimmedPath = path?.replace(/^\/+|\/+$/g, '') || '';

  const method = req.method?.toLowerCase();

  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += data;
  });

  req.on('end', () => {
    buffer += decoder.end();
    const chosenHandler = (typeof router[trimmedPath] !== 'undefined')
      ? router[trimmedPath] : handler.notFound;

    const data = {
      trimmedPath,
      query,
      method,
      headers,
      payload: buffer,
    };
    chosenHandler(data, (statusCode = 200, _data = {}) => {
      const status = typeof (statusCode) === 'number' ? statusCode : 200;
      const payload = typeof (_data) === 'object' ? _data : {};

      const payloadString = JSON.stringify(payload);

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(status);
      res.end(payloadString);
    });
  });
});

server.listen(port, () => {
  console.log(`The server is listening on port ${port} on ${envName}`);
});
