'use strict';

const {app, BrowserWindow, globalShortcut, ipcMain} = require('electron');
const fs = require('fs');
const url = require('url');
const path = require('path');

const cfgMgmt = require('./cfgMgmt.js');

const defaultCfg = require('./default.json');

let win;
let home;
let cfg;
let extApp;
let settingsWin;

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
        switch(app.type) {
            case 'web':
                newApp(app.url);
                break;
            // case 'shell':
            //     if(app.title === 'Spotify') startSpotifyService();
            //     break;
            case 'sys':
                execSysApp(app);
                break;
            default:
                throwError('Unknown protocol');
                break;
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
    win.on('close', () => {
    });
}

app.on('ready', ()=> {
    //get home dir
    home = app.getPath('home');
    //load cfg
    cfg = new cfgMgmt(home);
    //initialize extApp object
    extApp = {
        'type': String,
        'cmd': String,
        'open': false
    }

    createWindow();
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});


// new Window
function newApp(url) {
    extApp.type = 'web';
    extApp.appWin = new BrowserWindow({
        parent: win,
        modal: true,
        frame: false,
        fullscreen: true,
        webPreferences: {
            nodeIntegration: false
        }
    });
    extApp.appWin.maximize();
    extApp.appWin.loadURL(url);

    // catch errors
    extApp.appWin.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        if (errorDescription === 'ERR_INTERNET_DISCONNECTED') {
            throwError('No Internet connection');
        } else {
            throwError('Failed connecting to ' + url);
        }
    });

    extApp.appWin.on('app-command', (e, cmd) => {
        if (cmd === 'browser-backward' && extApp.appWin.webContents.canGoBack()) {
            extApp.appWin.webContents.goBack();
        }
        if (cmd === 'browser-backward' && !extApp.appWin.webContents.canGoBack()) {
            extApp.appWin.close();
        }
    });

    extApp.appWin.once('ready-to-show', () => {
        extApp.appWin.show();
        extApp.open = true;
    });

    extApp.appWin.on('close', () => {
        extApp.open = false;
        extApp.type = '';
    });
    
}

// open external programm
function openExtApp(cmd) {
    extApp = cmd;
    cmd = 'bin/startscript.sh start ' + (home + '/.config/conTVLauncher/extApp.pid') + cmd;
    require('child_process').exec(cmd);
}
function closeExtApp(cmd) {
    cmd = 'bin/startscript.sh stop ' + (home + '/.config/conTVLauncher/extApp.pid') + cmd;
    require('child_process').exec(cmd);
}

// spotify
function startSpotifyService() {
    let cmd = app.getAppPath() + '/bin/spotify/librespot --name RaspTV --cache ' + app.getAppPath() +'/bin/spotify/cache';
    require('child_process').spawn(cmd, {
        detached: true
    });
}

// systemControls

function execSysApp(tile) {
    switch(tile.cmd) {
        case 'close':
            app.quit();
            break;
        case 'shutdown':
            app.quit();
            break;
        case 'settings':
            openSettingsWin();
            break;
        default:
            throwError('Unknown System App');
            break;
    }
}

function openSettingsWin () {
    settingsWin = new BrowserWindow({ parent: win, frame: false, width: 500, height: 300, modal: true });
    settingsWin.loadURL(url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(app.getAppPath(), 'frontend/settings.html')
    }));

    //register events
    ipcMain.on('settings-get-cfg', (event) => {
        event.returnValue = cfg.getCfg();
    });
    ipcMain.on('settings-close', () => {
        settingsWin.close();
    });
    ipcMain.on('settings-save-cfg', (event, arg) => {
        cfg.setCfg(arg);
        updateSettings();
        settingsWin.close();
    });
    ipcMain.on('settings-restore-cfg', (event) => {
        event.returnValue = cfg.restoreDefaultCfg();
    });
}

// connection to fontend
function throwError(msg) {
    win.webContents.send('on-error' ,msg);
}


// config functions
// config functions

function updateSettings() {    
    cfg.writeCfg(cfg);
    console.log(JSON.stringify(cfg.getCfg(), null, 1));
    win.webContents.send('recieve-cfg', cfg.getCfg());
};