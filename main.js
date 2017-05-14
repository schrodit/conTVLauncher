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
let settingsWin;

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
        frame: false,
        fullscreen: true,
        webPreferences: {
            zoomFactor: cfg.zoomFactor
        }
    });
    win.maximize();
    win.once('ready-to-show', () => {
        win.show();
    });

    // register shortcuts
    globalShortcut.register('Home', () => {
        if(appWin) appWin.close();
    });
    globalShortcut.register('F3', () => {
        if(appWin) appWin.close();
    });
    globalShortcut.register('F4', () => {
        app.quit();
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
        win.webContents.session.clearCache();
        win.webContents.session.clearStorageData();
    });
}

app.on('ready', ()=> {
    //get home dir
    home = app.getPath('home');
    //load cfg
    cfg = readCfg();
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

    appWin = new BrowserWindow({
        parent: win,
        modal: true,
        frame: false,
        fullscreen: true,
        webPreferences: {
            nodeIntegration: false
        }
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

    appWin.on('app-command', (e, cmd) => {
        if (cmd === 'browser-backward' && appWin.webContents.canGoBack()) {
            appWin.webContents.goBack();
        }
        if (cmd === 'browser-backward' && !appWin.webContents.canGoBack()) {
            appWin.close();
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
        event.returnValue = cfg;
    });
    ipcMain.on('settings-close', () => {
        settingsWin.close();
    });
    ipcMain.on('settings-save-cfg', (event, arg) => {
        cfg = arg;
        updateSettings();
        settingsWin.close();
    });
    ipcMain.on('settings-restore-cfg', (event) => {
        event.returnValue = restoreDefaultCfg();
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
        let config = defaultCfg;
        config.tiles = setupTiles(config.tiles);
        return config;
    } else {
        let config = JSON.parse(fs.readFileSync(home + '/.config/conTVLauncher/config.json'));
        config.tiles = setupTiles(config.tiles);
        return config;
    }
};


function writeCfg(oCfg) {
    oCfg.tiles = removeSystemTiles(oCfg.tiles);
    fs.writeFileSync(home + '/.config/conTVLauncher/config.json', JSON.stringify(oCfg));
};

function restoreDefaultCfg() {
    return defaultCfg;
};

function setupTiles(tiles) {
    tiles = addSystemTiles(tiles);
    tiles.forEach((con, i1) => {
        con.forEach((tile, i2) => {
            if(!tile.show) tiles[i1].splice(i2, 1);
            else tile.selected = false;
        });
    });

    return tiles;
}
function addSystemTiles(tiles) {
    let sysTiles = [
        {
                'title': 'Settings',
                'icon': 'icons:settings',
                'type': 'sys',
                'cmd': 'settings',
                'selected': false,
                'show': true
        },
        {
                'title': 'Close',
                'icon': 'icons:close',
                'type': 'sys',
                'cmd': 'close',
                'selected': false,
                'show': true
        },
        {
                'title': 'Poweroff',
                'icon': 'icons:power-settings-new',
                'type': 'sys',
                'cmd': 'shutdown',
                'selected': false,
                'show': false
        },
    ];
    tiles.push(sysTiles);

    return tiles;
}

function removeSystemTiles(tiles) {
    tiles.forEach((con, i1) => {
        con.forEach((tile, i2) => {
            if(tile.type === 'sys') {
                tiles.splice(i1, 1);
            }
        });
    });

    return tiles;
}