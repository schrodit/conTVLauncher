import {app, BrowserWindow, ipcMain} from 'electron';
import * as path from 'path';
import * as url from 'url';
const powerOff = require('power-off');
const exec = require('child_process').exec;

import {appMgmt} from './appMgmt';
import {tile, config} from './cfgMgmt';

type app = Electron.App;
type BrowserWindow = Electron.BrowserWindow;

export class extAppMgmt {
    aMgmt: appMgmt;
    appWin: BrowserWindow;
    screensaver: BrowserWindow;
    type: string;
    cmd: string;
    open: boolean;

    constructor(aMgmt: appMgmt) {
        this.aMgmt = aMgmt;
        this.open = false;

        //register global events
        ipcMain.on('open-App', (event: Electron.Event, arg: tile) => {
            try {
                this.openApp(arg);
            } catch (err) {
                this.aMgmt.throwError(err.message);
            }
        });
        ipcMain.on('close-App', (event: Electron.Event) => {
            try {
                this.closeApp();
            } catch (err) {
                this.aMgmt.throwError(err.message);
            }
        });
        ipcMain.on('open-tile-editor', () => {
            if(!this.open) this.openTileEditorWin();
        })
    }

    openApp(app: tile) {
        if (this.open) this.closeApp();
        this.type = app.type;
        switch(this.type) {
            case 'web':
                this.cmd = app.cmd;
                this.newWebApp(this.cmd);
                break;
            case 'shell':
                this.cmd = app.cmd;
                this.openExtApp();
                break;
            case 'intern':
                this.cmd = app.cmd;
                this.newInternApp(this.cmd);
                break;
            case 'sys':
                this.cmd = app.cmd;
                this.execSysApp();
                break;
            default:
                throw new Error('Unknown application type');
        }
        this.aMgmt.stopActive();
        
    }
    closeApp() {
        if(this.appWin && !this.appWin.isDestroyed()) {
            switch(this.type) {
                case 'web': case 'shell': case 'sys': case 'intern':
                    this.appWin.close();
                    break;
                case 'ext':
                    this.closeExtApp();
                    break;
                default:
                    this.aMgmt.logger.error('Unkown application type ' + this.type);
                    this.type = '';
                    this.cmd = '';
                    break;
            }
        }
        this.aMgmt.startActive();
    }
    // new Web Window
    newWebApp(url: string) {
        this.appWin = new BrowserWindow({
            parent: this.aMgmt.win,
            modal: true,
            frame: false,
            show: false,
            fullscreen: true,
            webPreferences: {
                plugins: true,
                nodeIntegration: false
            }
        });   
        this.appWin.loadURL(url);

        // catch errors
        this.appWin.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            if (errorDescription === 'ERR_INTERNET_DISCONNECTED') {
                throw Error('No Internet connection');
            } else {
                throw Error('Failed connecting to ' + url);
            }
        });

        this.appWin.on('app-command', (e, cmd) => {
            if (cmd === 'browser-backward' && this.appWin.webContents.canGoBack()) {
                this.appWin.webContents.goBack();
            }
            if (cmd === 'browser-backward' && !this.appWin.webContents.canGoBack()) {
                this.appWin.close();
            }
        });

        this.appWin.once('ready-to-show', () => {
            this.aMgmt.logger.info('Open new Web Window with url: ' + url);
            this.appWin.show();
            this.open = true;
        });

        this.appWin.on('close', () => {
            this.open = false;
            this.type = '';
            this.aMgmt.logger.info('Close web app ...');
            this.appWin = null;
        });
        this.aMgmt.stopActive();  
    }

     newInternApp(iUrl: string) {
        this.appWin = new BrowserWindow({
            parent: this.aMgmt.win,
            modal: true,
            frame: false,
            fullscreen: true
        });       
        this.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(__dirname, 'frontend', 'wrapper', iUrl)
        }));
        

        this.appWin.once('ready-to-show', () => {
            this.aMgmt.logger.info('Open new Internal App Window');
            this.appWin.show();
            this.open = true;
        });

        this.appWin.on('close', () => {
            this.open = false;
            this.type = '';
            this.aMgmt.logger.info('Close web app ...');
            this.appWin = null;
        });
        this.aMgmt.stopActive();
    }



    // open external programm
    openExtApp() {
        let cmd = __dirname + '/bin/startscript.sh start ' + (this.aMgmt.home + '/.config/conTVLauncher/extApp.pid ') + this.cmd;
        require('child_process').exec(cmd);
        this.open = true;
    }
    closeExtApp() {
        let cmd = __dirname + '/bin/startscript.sh stop ' + (this.aMgmt.home + '/.config/conTVLauncher/extApp.pid ') + this.cmd;
        require('child_process').execSync(cmd);
        this.open = false;
        this.cmd = '';
    }


    // systemControls

    execSysApp() {
        switch(this.cmd) {
            case 'close':
                this.aMgmt.app.quit();
                break;
            case 'shutdown':
                this.openPowerSettingsWin();
                break;
            case 'settings':
                this.openSettingsWin();
                break;
            default:
                throw new Error('Unknown System App');
        }
    }


    openSettingsWin () {
        this.appWin = new BrowserWindow({ 
            parent: this.aMgmt.win, 
            show: false, 
            frame: false, 
            width: 500, 
            useContentSize: true,
            modal: true 
        });
        this.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(__dirname, 'frontend/wrapper/settings.html')
        }));

        this.appWin.on('ready-to-show', () => {
            this.aMgmt.logger.info('Open settings window');
            this.appWin.show();
        });

        //register events
        ipcMain.on('settings-save-cfg', (event: Electron.Event, arg: config) => {
            this.aMgmt.cfg.setCfg(arg);
            // config functions   
            this.aMgmt.cfg.writeCfg();
            this.aMgmt.win.webContents.send('recieve-cfg', this.aMgmt.cfg.getCfg());
            if(this.appWin) this.closeApp();
        });

        this.appWin.on('close', () => {
            ipcMain.removeAllListeners('settings-save-cfg');
            this.open = false;
            this.type = '';
            this.aMgmt.logger.info('Close web app ...');
            this.appWin = null;
        });
    }

    openTileEditorWin () {
        this.type = 'sys';
        this.open = true;

        this.appWin = new BrowserWindow({ 
            parent: this.aMgmt.win, 
            show: false, 
            frame: false,
            fullscreen: true,
            modal: true 
        });
        this.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(__dirname, 'frontend/wrapper/tileEditor.html')
        }));

        this.appWin.on('ready-to-show', () => {
            this.aMgmt.logger.info('Open tile editor window');
            this.appWin.show();
        });

        this.appWin.on('close', () => {
            ipcMain.removeAllListeners('save-tiles');
            this.open = false;
            this.type = '';
            this.aMgmt.logger.info('Close tile editor ...');
            this.appWin = null;
        });

        ipcMain.on('save-tiles', (event: NodeJS.EventEmitter, args: Array<Array<tile>>) => {
            let currentConfig = this.aMgmt.cfg.getCfg();
            currentConfig.tiles = args;
            this.aMgmt.cfg.writeCfg(currentConfig);
            this.aMgmt.win.webContents.send('recieve-cfg', this.aMgmt.cfg.getCfg());
        });
        this.aMgmt.stopActive();
    }

    openPowerSettingsWin () {
        this.appWin = new BrowserWindow({ 
            parent: this.aMgmt.win, 
            show: true, 
            frame: false, 
            width: 300, height: 346, 
            modal: true 
        });
        this.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(__dirname, 'frontend/wrapper/powersettings.html')
        }));

        ipcMain.on('power-shutdown', () => {
            this.type = '';
            this.cmd = '';
            let that = this;
            powerOff( (err: Object, stderr: Object, stdout: Object) => {
                if(!err && !stderr) {
                    that.aMgmt.logger.info(stdout.toString());
                } else {
                    throw new Error(stderr.toString());
                }
            });
        });
        ipcMain.on('power-restart', () => {
            let that = this;
            exec('reboot', (err: Object, stderr: Object, stdout: Object) => {
                if(!err && !stderr) {
                    that.aMgmt.logger.info(stdout.toString());
                } else {
                    throw new Error(stderr.toString());
                }
            });
        });
        ipcMain.on('power-reload', () => {
            this.aMgmt.app.relaunch();
            this.aMgmt.app.exit(0);
        });

        this.appWin.on('ready-to-show', () => {
            this.aMgmt.logger.info('Open power-settings window');
            this.appWin.show();
        });

        this.appWin.on('close', () => {
            this.open = false;
            this.type = '';
            this.aMgmt.logger.info('Close web app ...');
            this.appWin = null;
        });
    }

    openScreensaver () {
        if(this.screensaver !== void 0 && this.screensaver !== null) this.screensaver.close();
        this.screensaver = new BrowserWindow({ 
            parent: this.aMgmt.win, 
            show: true, 
            frame: false, 
            fullscreen: true,
            modal: true 
        });
        this.screensaver.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(__dirname, 'frontend/wrapper/screensaver.html')
        }));

        this.screensaver.on('ready-to-show', () => {
            this.aMgmt.win.hide();
            if(this.open && this.type !== 'ext') this.appWin.hide();
            this.aMgmt.logger.info('Open screensaver');
            this.screensaver.show();
        });

        this.screensaver.on('close', () => {
            this.aMgmt.win.show();
            if(this.open) this.appWin.show();
            this.aMgmt.logger.info('Close screensaver');
            this.screensaver = null;
        });

    }
}