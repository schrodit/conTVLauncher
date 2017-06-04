"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var http = require("http");
var url = require("url");
var path = require("path");
var SpotifyWebApi = require('spotify-web-api-node');
var bigInteger = require('big-integer');
var spotifyApp = (function () {
    function spotifyApp(aMgmt) {
        var _this = this;
        this.aMgmt = aMgmt;
        this.track = null;
        this.status = null;
        this.connectWebAPI();
        electron_1.ipcMain.on('spotify-open-menu', function () {
            _this.openMenu();
        });
        electron_1.ipcMain.on('spotify-get-track', function () {
            _this.sendTrack();
            _this.sendStatus();
        });
    }
    spotifyApp.prototype.startServer = function () {
        var _this = this;
        http.createServer(function (req, res) {
            try {
                var json = url.parse(req.url, true).query['t'];
                var data = JSON.parse(json);
                if (data.status) {
                    if (data.status !== 'seek')
                        _this.status.status = data.status;
                    if (data.position > -1)
                        _this.status.position = data.position;
                    else if (_this.status.position === void 0)
                        _this.status.position = 0;
                    switch (_this.status.status) {
                        case 'play':
                            _this.startProgress();
                            break;
                        case 'pause':
                            clearInterval(_this.progressInterval);
                            break;
                    }
                    _this.sendStatus();
                }
                else {
                    _this.track = data;
                    _this.track.id = _this.convertBase(_this.track.id);
                    _this.status.position = 0;
                    _this.updateTrack();
                }
            }
            catch (err) {
                _this.aMgmt.logger.error(err.message);
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('success');
        }).listen(33003, '127.0.0.1').on('error', function (err) {
            _this.aMgmt.logger.error(err.message);
        });
        this.aMgmt.logger.info('Spotify reciever running at http://127.0.0.1:33003/');
    };
    spotifyApp.prototype.sendTrack = function () {
        if (this.aMgmt.extApp.appWin)
            this.aMgmt.extApp.appWin.webContents.send('spotify-new-track', this.track);
        this.aMgmt.win.webContents.send('spotify-new-track', this.track);
    };
    spotifyApp.prototype.sendStatus = function () {
        if (this.aMgmt.extApp.appWin)
            this.aMgmt.extApp.appWin.webContents.send('spotify-new-status', this.status);
        this.aMgmt.win.webContents.send('spotify-new-status', this.status);
    };
    spotifyApp.prototype.connectWebAPI = function () {
        // Create the api object with the credentials
        this.spotifyApi = new SpotifyWebApi({
            clientId: '7d36823acef04cfc845c46d55cda553f',
            clientSecret: '03df9850d7a948f291e8a1a75d83c34a'
        });
    };
    spotifyApp.prototype.updateTrack = function () {
        var that = this;
        this.spotifyApi.clientCredentialsGrant()
            .then(function (data) {
            that.aMgmt.logger.info('The access token expires in ' + data.body['expires_in']);
            // Save the access token so that it's used in future calls
            that.spotifyApi.setAccessToken(data.body['access_token']);
        }).then(function () {
            that.spotifyApi.getTrack(that.track.id)
                .then(function (data) {
                that.track = data.body;
                that.sendTrack();
            }).catch(function (error) {
                that.aMgmt.logger.error(error);
            });
        }).catch(function (error) {
            that.aMgmt.logger.error(error);
        });
    };
    spotifyApp.prototype.testTrack = function () {
        var test = '{"album":{"cover":["ebfc209ba574ba05143f16bdd51d2b4988c21d18","d0dff35b4c4908f6429c76bae540aa1f4951e483","ad5f67e81158523b916d1981c9ae99684005d8d7"],"id":"f8533d8a681f4372902982e5774c1d16","name":"Narrenkoenig"},"artists":[{"id":"66e2807455334dfb97b5c7f3f65fe49b","name":"Schandmaul"}],"available":true,"id":"e067822a755e4c1385cde31fe8a35514","name":"Sonnenstrahl"}';
        this.track = JSON.parse(test);
    };
    spotifyApp.prototype.convertBase = function (base2) {
        var rng = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        var a = bigInteger(base2, 16).toString(62);
        a = a.replace(/<[0-9][0-9]>/g, function (x) {
            return rng[Number(x.replace(/<|>/g, ''))];
        });
        return a;
    };
    spotifyApp.prototype.startProgress = function () {
        var _this = this;
        this.progressInterval = global.setInterval(function () {
            _this.status.position = _this.status.position + 1000;
        }, 1000);
    };
    spotifyApp.prototype.openMenu = function () {
        var _this = this;
        this.aMgmt.extApp.appWin = new electron_1.BrowserWindow({
            parent: this.aMgmt.win,
            show: true,
            frame: false,
            width: 300, height: 346,
            modal: true
        });
        this.aMgmt.extApp.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(this.aMgmt.app.getAppPath(), 'frontend/spotify-settings.html')
        }));
        electron_1.ipcMain.on('spotify-action-close', function () {
            _this.aMgmt.win.webContents.send('spotify-close');
            _this.aMgmt.extApp.appWin.close();
        });
        electron_1.ipcMain.on('spotify-action-disable', function () {
            _this.aMgmt.win.webContents.send('spotify-toggle-disabled');
            _this.aMgmt.extApp.appWin.close();
        });
        this.aMgmt.extApp.appWin.on('ready-to-show', function () {
            _this.aMgmt.logger.info('Open spotify menu');
            _this.aMgmt.extApp.appWin.show();
        });
        this.aMgmt.extApp.appWin.on('close', function () {
            _this.aMgmt.extApp.open = false;
            _this.aMgmt.extApp.type = '';
            _this.aMgmt.logger.info('Close web app ...');
            _this.aMgmt.extApp.appWin = null;
        });
    };
    return spotifyApp;
}());
exports.spotifyApp = spotifyApp;
