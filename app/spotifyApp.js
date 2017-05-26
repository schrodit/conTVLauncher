const fs = require('fs');
const http = require('http');
const defaultCfg = require('./default.json');
const url = require('url');

class spotify {
    constructor(app, win, winston) {
        this.app = app;
        this.logger = winston;
        this.win = win;
    }

    startServer() {
    http.createServer(function (req, res) {
        let json = url.parse(req.url, true).query['t'];
        console.log(json);
        this.track = JSON.parse(json);

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('success');
    }).listen(33003, '127.0.0.1');
    //this.logger.info('Spotify reciever running at http://127.0.0.1:33003/');
    console.log("startet");
    }

}

new spotify(null, null, null).startServer();

module.exports = spotify;