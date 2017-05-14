'use strict';

const {app, BrowserWindow, globalShortcut, ipcMain} = require('electron');
const fs = require('fs');
const url = require('url');
const path = require('path');

const defaultCfg = require('./default.json');

let win;
let home;
let cfg;
let appWin;
let extApp;

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
        frame: false,
        fullscreen: true
    });
    win.maximize();
    win.once('ready-to-show', () => {
        win.show();
    });

    // register shortcuts
    globalShortcut.register('Home', () => {
        if(appWin) appWin.close();
    });
    globalShortcut.register('CommandOrControl+Z', () => {
        if(appWin) appWin.close();
    });
    globalShortcut.register('CommandOrControl+F4', () => {
        win.close();
    });


    //register events
    ipcMain.on('get-cfg', (event) => {
        event.returnValue = cfg;
    });
    ipcMain.on('open-App', (event, app) => {
        switch(app.type) {
            case 'web':
                newApp(app.url);
                break;
            // case 'shell':
            //     if(app.title === 'Spotify') startSpotifyService();
            //     break;
            default:
                throwError('Unknown protocol');
                break;
        }
    });
    ipcMain.on('close-launcher', () => {
        win.close();
    });
    
    win.loadURL(url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(app.getAppPath(), 'frontend/index.html')
    }));

    // register events
    win.on('close', () => {
        app.quit();
    });

}

app.on('ready', ()=> {
    //get home dir
    home = app.getPath('home');
    //load cfg
    cfg = readCfg();
    createWindow();
});


app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
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

    appWin = new BrowserWindow({
        frame: false,
        fullscreen: true
    });
    appWin.maximize();
    appWin.loadURL(url);

    // catch errors
    appWin.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        if (errorDescription === 'ERR_INTERNET_DISCONNECTED') {
            throwError('No Internet connection');
        } else {
            throwError('Failed connecting to ' + url);
        }
    });

    appWin.once('ready-to-show', () => {
        appWin.show();
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

// connection to fontend
function throwError(msg) {
    win.webContents.send('on-error' ,msg);
    console.log(msg);
}


// config functions

function updateSettings() {    
    writeCfg(cfg);
};

function readCfg() {
    if (!fs.existsSync(home + '/.config')) fs.mkdirSync(home + '/.config');
    if (!fs.existsSync(home + '/.config/conTVLauncher')) fs.mkdirSync(home + '/.config/conTVLauncher');
    if (!fs.existsSync(home + '/.config/conTVLauncher/config.json')) {
        writeCfg(defaultCfg);
        return defaultCfg;
    } else {
        return JSON.parse(fs.readFileSync(home + '/.config/conTVLauncher/config.json'));
    }
};


function writeCfg(oCfg) {
    fs.writeFileSync(home + '/.config/conTVLauncher/config.json', JSON.stringify(oCfg));
};

function restoreDefaultCfg() {
    return defaultCfg;
};