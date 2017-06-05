import {app, BrowserWindow, globalShortcut, ipcMain} from 'electron';
import * as url from 'url';
import *as path from 'path';

import {appMgmt} from './appMgmt';
import {tile} from './cfgMgmt';

let aMgmt: appMgmt;

function createWindow () {
    // Create the browser window.
    aMgmt.win = new BrowserWindow({
        frame: false,
        fullscreen: true,
        show:false
    });
   
    aMgmt.win.once('ready-to-show', () => {
        aMgmt.win.show();
    });
    
    aMgmt.win.loadURL(url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(app.getAppPath(), 'frontend/index.html')
    }));
}


app.commandLine.appendSwitch('widevine-cdm-path', app.getAppPath() + '/bin/plugins/libwidevinecdmadapter.so'); //need to be changed
// The version of plugin can be got from `chrome://plugins` page in Chrome.
app.commandLine.appendSwitch('widevine-cdm-version', '1.4.8.962'); // need to be changed

app.on('ready', ()=> {
    //init app aMgmt
    aMgmt = new appMgmt(app, app.getPath('home'));
    //load winston logger
    aMgmt.initLogger();
    //load cfg
    aMgmt.initCfg();

    aMgmt.logger.info('Creating MainWindow ...');
    createWindow();
    //initialize extApp object
    aMgmt.logger.info('Starting ExtApp service ...');
    aMgmt.initExtApp();
    if (aMgmt.cfg.getCfg().enableSpotify) { 
        aMgmt.logger.info('Starting Spotify service ...');
        aMgmt.initSpotify();
        aMgmt.spotify.startServer();
    }
});