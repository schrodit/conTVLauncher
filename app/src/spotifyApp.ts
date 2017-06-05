import {ipcMain, BrowserWindow} from 'electron';
import * as http from 'http';
import * as url from 'url';
import * as path from 'path';
const SpotifyWebApi = require('spotify-web-api-node');
const bigInteger = require('big-integer');

import {appMgmt} from './appMgmt';

interface tStatus {
    status: string;
    position: number;
}

export class spotifyApp {
    aMgmt: appMgmt;
    track: tTrack;
    status: tStatus;
    progressInterval: NodeJS.Timer;
    spotifyApi: any;

    constructor(aMgmt: appMgmt) {
        this.aMgmt = aMgmt;
        this.track = null;
        this.status = {
            status: '',
            position: 0
        };

        this.connectWebAPI();

        ipcMain.on('spotify-open-menu', () => {
            this.openMenu();
        });
        ipcMain.on('spotify-get-track', () => {
            if(this.track !== null) {
                this.sendTrack();
                this.sendStatus();
            }
        });
    }

    startServer() {
        http.createServer( (req, res) => {
            try {
                let json = url.parse(req.url, true).query['t'];
                let data = JSON.parse(json);
                if (data.status) {
                    if(data.status !== 'seek') this.status.status = data.status;
                    if (data.position > -1) this.status.position = data.position;
                    else if(this.status.position === void 0) this.status.position = 0;
                    switch (this.status.status) {
                        case 'play':
                            this.startProgress();
                            break;
                        case 'pause':
                            clearInterval(this.progressInterval);
                            break;
                    }
                    this.sendStatus();
                } else {
                    this.track = data;
                    this.track.id = this.convertBase(this.track.id);
                    this.status.position = 0;
                    this.updateTrack();
                }
            } catch(err) {
                this.aMgmt.logger.error(err.message);
            }
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('success');
        }).listen(33003, '127.0.0.1').on('error', (err) => {
            this.aMgmt.logger.error(err.message);
        });
        this.aMgmt.logger.info('Spotify reciever running at http://127.0.0.1:33003/');
    }

    sendTrack() {
        if(this.aMgmt.extApp.appWin) this.aMgmt.extApp.appWin.webContents.send('spotify-new-track', this.track);
        this.aMgmt.win.webContents.send('spotify-new-track', this.track);
    }
    sendStatus() {
        if(this.aMgmt.extApp.appWin) this.aMgmt.extApp.appWin.webContents.send('spotify-new-status', this.status);
        this.aMgmt.win.webContents.send('spotify-new-status', this.status);
    }

    connectWebAPI() {
        // Create the api object with the credentials
        this.spotifyApi = new SpotifyWebApi({
            clientId : '7d36823acef04cfc845c46d55cda553f',
            clientSecret : '03df9850d7a948f291e8a1a75d83c34a'
        });
    }

    updateTrack() {
        let that = this;
        this.spotifyApi.clientCredentialsGrant()
        .then(function(data: any) {
            that.aMgmt.logger.info('The access token expires in ' + data.body['expires_in']);

            // Save the access token so that it's used in future calls
            that.spotifyApi.setAccessToken(data.body['access_token']);
        }).then(() => {
            that.spotifyApi.getTrack(that.track.id)
            .then(function(data: any) {
                that.track = data.body;
                that.sendTrack();
            }).catch(function(error: any) {
                that.aMgmt.logger.error(error);
            });
        }).catch(function(error: any) {
            that.aMgmt.logger.error(error);
        });
        
    }

    testTrack() {
        let test =  '{"album":{"cover":["ebfc209ba574ba05143f16bdd51d2b4988c21d18","d0dff35b4c4908f6429c76bae540aa1f4951e483","ad5f67e81158523b916d1981c9ae99684005d8d7"],"id":"f8533d8a681f4372902982e5774c1d16","name":"Narrenkoenig"},"artists":[{"id":"66e2807455334dfb97b5c7f3f65fe49b","name":"Schandmaul"}],"available":true,"id":"e067822a755e4c1385cde31fe8a35514","name":"Sonnenstrahl"}';
        this.track = JSON.parse(test);
    }

    convertBase(base2: string) {
        const rng: Array<string> = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        let a = bigInteger(base2, 16).toString(62);
        a = a.replace(/<[0-9][0-9]>/g, (x: string) => {
            return rng[Number(x.replace(/<|>/g, ''))];
        });
        return a;
    }

    startProgress() {
        this.progressInterval = global.setInterval(() => {
            this.status.position= this.status.position + 1000;
        }, 1000);
    }


    openMenu () {
        this.aMgmt.extApp.appWin = new BrowserWindow({ 
            parent: this.aMgmt.win, 
            show: true, 
            frame: false, 
            width: 300, height: 346,
            modal: true 
        });
        this.aMgmt.extApp.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(this.aMgmt.app.getAppPath(), 'frontend/wrapper/spotify-settings.html')
        }));

        ipcMain.on('spotify-action-close', () => {
            this.aMgmt.win.webContents.send('spotify-close');
            this.aMgmt.extApp.appWin.close();
        });
        ipcMain.on('spotify-action-disable', () => {
            this.aMgmt.win.webContents.send('spotify-toggle-disabled');
            this.aMgmt.extApp.appWin.close();
        });

        this.aMgmt.extApp.appWin.on('ready-to-show', () => {
            this.aMgmt.logger.info('Open spotify menu');
            this.aMgmt.extApp.appWin.show();
        });

        this.aMgmt.extApp.appWin.on('close', () => {
            this.aMgmt.extApp.open = false;
            this.aMgmt.extApp.type = '';
            this.aMgmt.logger.info('Close web app ...');
            this.aMgmt.extApp.appWin = null;
        });
    }
}

interface tAlbum {
    album_type : string,
    artists : Array<tArtist>;
    external_urls : {
      spotify : string;
    };
    href : string
    id : string;
    images : Array<{
      height : number;
      url : string;
      width : number;
    }>;
    name : string;
    type : string;
    uri : string;
}

interface tArtist {
    external_urls : {
      spotify : string;
    },
    href : string;
    id : string;
    name : string;
    type : string;
    uri : string;
}

interface tTrack {
  album : tAlbum;
  artists: Array<tArtist>;
  disc_number : number;
  duration_ms : number;
  explicit : boolean;
  external_ids : {
    isrc : string;
  };
  external_urls : {
    spotify : string;
  };
  href : string;
  id : string;
  is_playable : boolean;
  name : string;
  popularity : number;
  preview_url : string;
  track_number : number;
  type : string;
  uri : string;
}