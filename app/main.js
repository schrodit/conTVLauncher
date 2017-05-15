'use strict';

const {app, BrowserWindow, globalShortcut, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
const winston = require('winston');

const cfgMgmt = require('./cfgMgmt.js');
const extAppMgmt = require('./extAppMgmt.js');

let win;
let home;
let logger;
let cfg;
let extApp;

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
        frame: false,
        fullscreen: true,
    });
   
    win.once('ready-to-show', () => {
        win.show();
    });

    // register shortcuts
    globalShortcut.register('Home', () => {
        if(extApp.appWin) extApp.appWin.close();
    });
    globalShortcut.register('F3', () => {
        if(extApp.appWin) extApp.appWin.close();
    });
    globalShortcut.register('F4', () => {
        app.quit();
    });


    //register events
    ipcMain.on('get-cfg', (event) => {
        event.returnValue = cfg.getCfg();
    });
    ipcMain.on('open-App', (event, app) => {
        try {
            extApp.openApp(app);
        } catch (err) {
            throwError(err);
        }
    });
    ipcMain.on('close-launcher', () => {
        app.quit();
    });
    
    win.loadURL(url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(app.getAppPath(), 'frontend/index.html')
    }));
}

app.on('ready', ()=> {
    //get home dir
    home = app.getPath('home');
    //load winston logger
    logger =  new winston.Logger({
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
    cfg = new cfgMgmt(home, logger);

    winston.info('Creating MainWindow ...');
    createWindow();
    //initialize extApp object
    extApp = new extAppMgmt(app, win, cfg, logger);
});

// connection to fontend
function throwError(msg) {
    logger.error(msg);
    win.webContents.send('on-error' ,msg);
}