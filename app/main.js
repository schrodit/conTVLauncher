"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var url = require("url");
var path = require("path");
var appMgmt_1 = require("./appMgmt");
var aMgmt;
function createWindow() {
    // Create the browser window.
    aMgmt.win = new electron_1.BrowserWindow({
        frame: false,
        fullscreen: true,
        show: false
    });
    aMgmt.win.once('ready-to-show', function () {
        aMgmt.win.show();
    });
    // register shortcuts
    electron_1.globalShortcut.register('CommandOrControl+Backspace', function () {
        if (aMgmt.extApp.appWin)
            aMgmt.extApp.closeApp();
    });
    electron_1.globalShortcut.register('F3', function () {
        if (aMgmt.extApp.appWin)
            aMgmt.extApp.closeApp();
    });
    electron_1.globalShortcut.register('F4', function () {
        electron_1.app.quit();
    });
    //register events
    electron_1.ipcMain.on('get-cfg', function (event) {
        event.returnValue = aMgmt.cfg.getCfg();
    });
    electron_1.ipcMain.on('open-App', function (event, arg) {
        try {
            aMgmt.extApp.openApp(arg);
        }
        catch (err) {
            throwError(err.message);
        }
    });
    electron_1.ipcMain.on('close-launcher', function () {
        electron_1.app.quit();
    });
    aMgmt.win.loadURL(url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(electron_1.app.getAppPath(), 'frontend/index.html')
    }));
}
electron_1.app.commandLine.appendSwitch('widevine-cdm-path', electron_1.app.getAppPath() + '/bin/plugins/libwidevinecdmadapter.so'); //need to be changed
// The version of plugin can be got from `chrome://plugins` page in Chrome.
electron_1.app.commandLine.appendSwitch('widevine-cdm-version', '1.4.8.962'); // need to be changed
electron_1.app.on('ready', function () {
    //init app aMgmt
    aMgmt = new appMgmt_1.appMgmt(electron_1.app, electron_1.app.getPath('home'));
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
// connection to fontend
function throwError(msg) {
    aMgmt.logger.error(msg);
    aMgmt.win.webContents.send('on-error', msg);
}
