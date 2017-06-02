const {ipcMain, BrowserWindow} = require('electron');
const http = require('http');
const url = require('url');
const path = require('path');
const SpotifyWebApi = require('spotify-web-api-node');
const bigInteger = require("big-integer");

class spotify {
    constructor(app, win, extApp, winston) {
        this.app = app;
        this.logger = winston;
        this.win = win;
        this.extApp = extApp;
        this.track = {};
        this.status = '';

        this.connectWebAPI();
        this.getNewAccessToken();
        this.testTrack();
        this.track.id = this.convertBase(this.track.id);
        this.updateTrack();

        ipcMain.on('spotify-open-menu', () => {
            this.openMenu();
        });
        ipcMain.on('spotify-get-track', () => {
            this.sendTrack();
        });
    }

    startServer() {
        http.createServer( (req, res) => {
            try {
                let json = url.parse(req.url, true).query['t'];
                let data = JSON.parse(json);
                if (data.status) {
                    this.status = data;
                    this.sendStatus();
                } else {
                    this.track = data;
                    this.track.id = this.convertBase(this.track.id);
                    this.sendTrack();
                }
            } catch(err) {
                this.logger.error(err.msg);
            }
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('success');
        }).listen(33003, '127.0.0.1').on('error', (err) => {
            this.logger.error(err.msg);
        });
        this.logger.info('Spotify reciever running at http://127.0.0.1:33003/');
    }

    sendTrack() {
        if(this.extApp.appWin) this.extApp.appWin.webContents.send('spotify-new-track', this.track);
        this.win.webContents.send('spotify-new-track', this.track);
    }
    sendStatus() {
        if(this.extApp.appWin) this.extApp.appWin.webContents.send('spotify-new-status', this.status);
        this.win.webContents.send('spotify-new-status', this.track);
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
        ipcMain.on('spotify-action-disable', () => {
            this.win.webContents.send('spotify-toggle-disabled');
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

    connectWebAPI() {
        // Create the api object with the credentials
        this.spotifyApi = new SpotifyWebApi({
            clientId : '7d36823acef04cfc845c46d55cda553f',
            clientSecret : '03df9850d7a948f291e8a1a75d83c34a'
        });
    }

    getNewAccessToken(){
        // Retrieve an access token.
        let that = this;
        this.spotifyApi.clientCredentialsGrant()
        .then(function(data) {
            this.logger.info('The access token expires in ' + data.body['expires_in']);

            // Save the access token so that it's used in future calls
            that.spotifyApi.setAccessToken(data.body['access_token']);
        }, function(err) {
                this.logger.error('Something went wrong when retrieving an access token', err);
        });
    }

    updateTrack() {
        let that = this;
        this.spotifyApi.clientCredentialsGrant()
        .then(function(data) {
            this.logger.info('The access token expires in ' + data.body['expires_in']);

            // Save the access token so that it's used in future calls
            that.spotifyApi.setAccessToken(data.body['access_token']);
        }).then(() => {
            that.spotifyApi.getTrack(that.track.id)
            .then(function(data) {
                that.track.duration_ms = data.body.duration_ms;
                that.sendTrack();
            }).catch(function(error) {
                this.logger.error(error);
            });
        }).catch(function(error) {
            this.logger.error(error);
        });
        
    }

    testTrack() {
        let test =  '{"album":{"cover":["ebfc209ba574ba05143f16bdd51d2b4988c21d18","d0dff35b4c4908f6429c76bae540aa1f4951e483","ad5f67e81158523b916d1981c9ae99684005d8d7"],"id":"f8533d8a681f4372902982e5774c1d16","name":"Narrenkoenig"},"artists":[{"id":"66e2807455334dfb97b5c7f3f65fe49b","name":"Schandmaul"}],"available":true,"id":"e067822a755e4c1385cde31fe8a35514","name":"Sonnenstrahl"}';
        this.track = JSON.parse(test);
    }

    convertBase(base2) {
        const rng = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        let a = bigInteger(base2, 16).toString(62);
        a = a.replace(/<[1-9][1-9]>/g, (x) => {
            return rng[x.replace(/<|>/g, '')];
        });

        return a;
    }

    

}

module.exports = spotify;