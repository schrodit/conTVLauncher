"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const winston = require("winston");
const cfgMgmt_1 = require("./cfgMgmt");
const extAppMgmt_1 = require("./extAppMgmt");
const spotifyApp_1 = require("./spotifyApp");
class appMgmt {
    constructor(app, home) {
        this.app = app;
        this.home = home;
        this.activeTime = 0;
        //register global shortcuts
        electron_1.globalShortcut.register('CommandOrControl+Backspace', () => {
            if (this.extApp.appWin)
                this.extApp.closeApp();
        });
        electron_1.globalShortcut.register('F3', () => {
            if (this.extApp.appWin)
                this.extApp.closeApp();
        });
        electron_1.globalShortcut.register('F4', () => {
            this.app.quit();
        });
        electron_1.globalShortcut.register('CommandOrControl+L', () => {
            this.extApp.openScreensaver();
            this.stopActive();
        });
        //register global events
        electron_1.ipcMain.on('close-launcher', () => {
            this.app.quit();
        });
        electron_1.ipcMain.on('close-screensaver', () => {
            this.extApp.screensaver.close();
            this.startActive();
        });
        electron_1.ipcMain.on('stop-active-time', () => {
            this.startActive();
        });
        electron_1.ipcMain.on('start-active-time', () => {
            this.stopActive();
        });
        electron_1.ipcMain.on('reset-active-time', () => {
            this.activeTime = 0;
        });
    }
    initCfg() {
        this.cfg = new cfgMgmt_1.cfgMgmt(this);
        this.startActiveInterval();
    }
    initExtApp() {
        this.extApp = new extAppMgmt_1.extAppMgmt(this);
    }
    initLogger() {
        this.logger = new winston.Logger({
            transports: [
                new (winston.transports.Console)(),
                new (winston.transports.File)({
                    filename: this.home + '/.config/conTVLauncher/conTVLauncher.log',
                    formatter: (options) => {
                        // Return string will be passed to logger. 
                        return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (options.message ? options.message : '') +
                            (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
                    }
                })
            ]
        });
    }
    initSpotify() {
        this.spotify = new spotifyApp_1.spotifyApp(this);
    }
    throwError(msg) {
        this.logger.error(msg);
        this.win.webContents.send('on-error', msg);
    }
    startActive() {
        this.logger.info('Start active time..');
        this.activeTimer = true;
        this.activeTime = 0;
    }
    stopActive() {
        this.activeTime = 0;
        this.activeTimer = false;
        this.logger.info('Active timer stopped  ..');
    }
    startActiveInterval() {
        this.startActive();
        setInterval(() => {
            if (this.activeTime >= (this.cfg.getCfg().screensaver * 60) && this.activeTimer) {
                this.extApp.openScreensaver();
                this.activeTimer = false;
            }
            else
                this.activeTime = this.activeTime + 30;
        }, 30000);
    }
}
exports.appMgmt = appMgmt;
