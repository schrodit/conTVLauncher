import {app, BrowserWindow, globalShortcut, ipcMain} from 'electron';
import * as winston from 'winston';

type app = Electron.App;
type BrowserWindow = Electron.BrowserWindow;

import {cfgMgmt} from './cfgMgmt';
import {extAppMgmt} from './extAppMgmt';
import {spotifyApp} from './spotifyApp';

export class appMgmt {
    home: string;
    app: app;
    win: BrowserWindow;
    appWin: BrowserWindow;
    menu: Electron.Menu;

    extApp: extAppMgmt;
    cfg: cfgMgmt;
    logger: winston.LoggerInstance;
    spotify: spotifyApp;

    activeTime: number;
    activeTimer: boolean;

    constructor(app:app, home:string) {
        this.app = app;
        this.home = home;
        this.activeTime = 0;

        //register global shortcuts
        globalShortcut.register('CommandOrControl+Backspace', () => {
            if(this.extApp.appWin) this.extApp.closeApp();
        });
        globalShortcut.register('F3', () => {
            if(this.extApp.appWin) this.extApp.closeApp();
        });
        globalShortcut.register('F4', () => {
            this.app.quit();
        });
        globalShortcut.register('CommandOrControl+L', () => {
            this.extApp.openScreensaver();
        });

        //register global events
        ipcMain.on('close-launcher', () => {
            this.app.quit();
        });
        ipcMain.on('close-screensaver', () => {
            this.extApp.screensaver.close();
            this.startActive();
        });
        ipcMain.on('stop-active-time', () => {
            this.startActive();
        });
        ipcMain.on('start-active-time', () => {
            this.stopActive();
        });
        ipcMain.on('reset-active-time', () => {
            this.activeTime = 0;
        });
    }

    public initCfg() {

        this.cfg = new cfgMgmt(this);
        this.startActiveInterval();
    }

    public initExtApp() {
        this.extApp = new extAppMgmt(this);
    }

    public initLogger() {
        this.logger =  new winston.Logger({
            transports: [
                new (winston.transports.Console)(),
                new (winston.transports.File)({
                    filename: this.home + '/.config/conTVLauncher/conTVLauncher.log',
                    formatter: (options: any) => {
                        // Return string will be passed to logger. 
                        return options.timestamp() +' '+ options.level.toUpperCase() +' '+ (options.message ? options.message : '') +
                        (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
                    } 
                })
            ]
        });
    }

    public initSpotify() {
        this.spotify = new spotifyApp(this);
    }

    public throwError(msg:string) {
        this.logger.error(msg);
        this.win.webContents.send('on-error' ,msg);
    }

    public startActive() {
        this.logger.info('Start active time..');
        this.activeTimer = true;
        this.activeTime = 0;
    }
    public stopActive() {
        this.activeTime = 0;
        if(this.activeTimer) {
            this.activeTimer = false;
            this.logger.info('Active timer stopped  ..');
        }
    }

    private startActiveInterval() {
        this.startActive();
        setInterval(() => {
            if(this.activeTime >= (this.cfg.getCfg().screensaver * 60) && this.activeTimer) {
                this.extApp.openScreensaver();
                this.activeTimer = false;
            } else this.activeTime = this.activeTime + 30;
        }, 30000);
    }
}