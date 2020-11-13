"use strict";
/**
 *
 * Primary file for the api
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// dependencies
var http_1 = __importDefault(require("http"));
var url_1 = __importDefault(require("url"));
var server = http_1.default.createServer(function (req, res) {
    var parsedUrl = url_1.default.parse(req.url, true);
    var path = parsedUrl.pathname;
    var trimmedPath = path === null || path === void 0 ? void 0 : path.replace(/^\/+|\/+$/g, '');
    res.end('hello world\n');
});
server.listen(3000, function () {
    console.log('The server is listening on port 3000');
});
