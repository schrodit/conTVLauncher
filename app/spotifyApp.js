const {ipcMain} = require('electron');
const fs = require('fs');
const http = require('http');
const url = require('url');

class spotify {
    constructor(app, win, winston) {
        this.app = app;
        this.logger = winston;
        this.win = win;
    }

    startServer() {
        http.createServer( (req, res) => {
            let json = url.parse(req.url, true).query['t'];
            console.log(json);
            this.track = JSON.parse(json);

            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('success');
        }).listen(33003, '127.0.0.1');
        this.logger.info('Spotify reciever running at http://127.0.0.1:33003/');
    }

    sendTrack() {
        this.win.webContents.send('new-track', this.track);
    }

    testTrack() {
        let test =  '{"album":{"cover":["ebfc209ba574ba05143f16bdd51d2b4988c21d18","d0dff35b4c4908f6429c76bae540aa1f4951e483","ad5f67e81158523b916d1981c9ae99684005d8d7"],"id":"f8533d8a681f4372902982e5774c1d16","name":"Narrenkoenig"},"artists":[{"id":"66e2807455334dfb97b5c7f3f65fe49b","name":"Schandmaul"}],"available":true,"id":"e067822a755e4c1385cde31fe8a35514","name":"Sonnenstrahl"}';
        this.track = JSON.parse(test);
    }

}

module.exports = spotify;