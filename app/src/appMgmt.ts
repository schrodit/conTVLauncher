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

    extApp: extAppMgmt;
    cfg: cfgMgmt;
    logger: winston.LoggerInstance;
    spotify: spotifyApp;

    constructor(app:app, home:string) {
        this.app = app;
        this.home = home;

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

        //register global events
        ipcMain.on('close-launcher', () => {
            this.app.quit();
        });
    }

    public initCfg() {
        this.cfg = new cfgMgmt(this.home, this.logger);
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
                    formatter: (options) => {
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
}