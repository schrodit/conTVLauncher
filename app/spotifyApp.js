const {ipcMain, BrowserWindow} = require('electron');
const fs = require('fs');
const http = require('http');
const url = require('url');
const path = require('path');

class spotify {
    constructor(app, win, extApp, winston) {
        this.app = app;
        this.logger = winston;
        this.win = win;
        this.extApp = extApp;

        ipcMain.on('spotify-open-menu', () => {
            this.openMenu();
        })
    }

    startServer() {
        http.createServer( (req, res) => {
            try {
                let json = url.parse(req.url, true).query['t'];
                this.track = JSON.parse(json);
                this.sendTrack();
            } catch(err) {
                this.logger.error(err.msg);
            }
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('success');
        }).listen(33003, '127.0.0.1');
        this.logger.info('Spotify reciever running at http://127.0.0.1:33003/');
    }

    sendTrack() {
        this.win.webContents.send('spotify-new-track', this.track);
    }

    openMenu () {
        this.extApp.appWin = new BrowserWindow({ 
            parent: this.win, 
            show: true, 
            frame: false, 
            width: 300, height: 346, 
            'use-content-size': true,
            modal: true 
        });
        this.extApp.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(this.app.getAppPath(), 'frontend/spotify-settings.html')
        }));

        ipcMain.on('spotify-action-close', () => {
            this.win.webContents.send('spotify-close');
            this.extApp.appWin.close();
        });

        this.extApp.appWin.on('ready-to-show', () => {
            this.logger.info('Open spotify menu');
            this.extApp.appWin.show();
        });

        this.extApp.appWin.on('close', () => {
            this.extApp.open = false;
            this.extApp.type = '';
            this.logger.info('Close web app ...');
            this.extApp.appWin = null;
        });
    }

    testTrack() {
        let test =  '{"album":{"cover":["ebfc209ba574ba05143f16bdd51d2b4988c21d18","d0dff35b4c4908f6429c76bae540aa1f4951e483","ad5f67e81158523b916d1981c9ae99684005d8d7"],"id":"f8533d8a681f4372902982e5774c1d16","name":"Narrenkoenig"},"artists":[{"id":"66e2807455334dfb97b5c7f3f65fe49b","name":"Schandmaul"}],"available":true,"id":"e067822a755e4c1385cde31fe8a35514","name":"Sonnenstrahl"}';
        this.track = JSON.parse(test);
    }

}

module.exports = spotify;