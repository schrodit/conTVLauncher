"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const url = require("url");
const path = require("path");
const appMgmt_1 = require("./appMgmt");
let aMgmt;
function createWindow() {
    // Create the browser window.
    aMgmt.win = new electron_1.BrowserWindow({
        frame: true,
        fullscreen: false,
        show: false
    });
    aMgmt.win.once('ready-to-show', () => {
        aMgmt.win.show();
    });
    aMgmt.win.loadURL(url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, 'frontend/wrapper/index.html')
    }));
}
electron_1.app.commandLine.appendSwitch('widevine-cdm-path', __dirname + '/bin/plugins/libwidevinecdmadapter.so'); //need to be changed
// The version of plugin can be got from `chrome://plugins` page in Chrome.
electron_1.app.commandLine.appendSwitch('widevine-cdm-version', '1.4.8.962'); // need to be changed
electron_1.app.on('ready', () => {
    //init app aMgmt
    aMgmt = new appMgmt_1.appMgmt(electron_1.app, electron_1.app.getPath('home'));
    //load winston logger
    aMgmt.initLogger();
    //catch all uncaught exceptions
    process.on('uncaughtException', (err) => {
        aMgmt.logger.error('Caught exception: ' + err);
    });
    //load cfg
    aMgmt.initCfg();
    aMgmt.logger.info('Creating MainWindow ...');
    createWindow();
    //initialize extApp object
    aMgmt.initExtApp();
    if (aMgmt.cfg.getCfg().enableSpotify) {
        aMgmt.logger.info('Starting Spotify service ...');
        aMgmt.initSpotify();
        aMgmt.spotify.startServer();
    }
});
