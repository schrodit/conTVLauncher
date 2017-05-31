'use strict';

const {app, BrowserWindow, globalShortcut, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
const winston = require('winston');

const cfgMgmt = require('./cfgMgmt.js');
const extAppMgmt = require('./extAppMgmt.js');
const spotifyApp = require('./spotifyApp.js');

let home;

function createWindow () {
    // Create the browser window.
    app.win = new BrowserWindow({
        frame: false,
        fullscreen: true,
        show:false
    });
   
    app.win.once('ready-to-show', () => {
        app.win.show();
    });

    // register shortcuts
    globalShortcut.register('Super+c', () => {
        if(app.extApp.appWin) app.extApp.appWin.close();
    });
    globalShortcut.register('F3', () => {
        if(app.extApp.appWin) app.extApp.appWin.close();
    });
    globalShortcut.register('F4', () => {
        app.quit();
    });


    //register events
    ipcMain.on('get-cfg', (event) => {
        event.returnValue = app.cfg.getCfg();
    });
    ipcMain.on('open-App', (event, arg) => {
        try {
            app.extApp.openApp(arg);
        } catch (err) {
            throwError(err.message);
        }
    });
    ipcMain.on('close-launcher', () => {
        app.quit();
    });
    
    app.win.loadURL(url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(app.getAppPath(), 'frontend/index.html')
    }));
}


app.commandLine.appendSwitch('widevine-cdm-path', app.getAppPath() + '/bin/plugins/libwidevinecdmadapter.so'); //need to be changed
// The version of plugin can be got from `chrome://plugins` page in Chrome.
app.commandLine.appendSwitch('widevine-cdm-version', '1.4.8.962'); // need to be changed

app.on('ready', ()=> {
    app.extApp;
    app.cfg;
    app.logger;
    app.win;
    //get home dir
    home = app.getPath('home');
    //load winston logger
    app.logger =  new winston.Logger({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({
                filename: home + '/.config/conTVLauncher/conTVLauncher.log',
                formatter: (options) => {
                    // Return string will be passed to logger. 
                    return options.timestamp() +' '+ options.level.toUpperCase() +' '+ (options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
                } 
            })
        ]
    });
    //load cfg
    app.cfg = new cfgMgmt(home, app.logger);

    app.logger.info('Creating MainWindow ...');
    createWindow();
    //initialize extApp object
    app.logger.info('Starting ExtApp service ...');
    app.extApp = new extAppMgmt(app, app.win, app.cfg, app.logger);
    if (app.cfg.getCfg().enableSpotify) { 
        app.logger.info('Starting Spotify service ...');
        app.spotify = new spotifyApp(app, app.win, app.extApp, app.logger);
        app.spotify.startServer();
    }
});

// connection to fontend
function throwError(msg) {
    app.logger.error(msg);
    app.win.webContents.send('on-error' ,msg);
}