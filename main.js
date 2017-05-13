'use strict';

const {app, BrowserWindow, globalShortcut, ipcMain} = require('electron');
const fs = require('fs');
const url = require('url');
const path = require('path');

const defaultCfg = require('./default.json');

let win;
let home;
let cfg;

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
        //frame: false,
        //fullscreen: true
    });
    //win.maximize();
    win.once('ready-to-show', () => {
        win.show();
    });

    // register shortcuts
    globalShortcut.register('CommandOrControl+F4', () => {
        win.close();
    });


    //register events
    ipcMain.on('get-cfg', (event) => {
        event.returnValue = cfg;
    });

    
    win.loadURL(url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(app.getAppPath(), 'frontend/index.html')
    }));

    // register events
    win.on('close', () => {
        app.quit();
        return false;
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