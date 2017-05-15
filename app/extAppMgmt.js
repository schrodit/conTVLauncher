const {BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');

class extApp {
    constructor(app, win, cfg, logger) {
        this.app = app;
        this.win = win;
        this.cfg = cfg;
        this.logger = logger;
        this.type = String;
        this.cmd = String;
        this.open = Boolean;
    }

    openApp(app) {
        this.type = app.type;
        switch(this.type) {
            case 'web':
                this.cmd = app.url;
                this.newWebApp(this.cmd);
                break;
            // case 'shell':
            //     if(app.title === 'Spotify') startSpotifyService();
            //     break;
            case 'sys':
                this.cmd = app.cmd;
                this.execSysApp();
                break;
            default:
                throw new Error('Unknown application type');
        }
        
    }
    closeApp() {
        switch(this.type) {
            case 'web':
                this.appWin.close();
                break;
            case 'sys':
                this.appWin.close();
                break;
        }
    }
    // new Web Window
    newWebApp(url) {
        this.type = 'web';
        this.appWin = new BrowserWindow({
            parent: this.win,
            modal: true,
            frame: false,
            fullscreen: true,
            webPreferences: {
                nodeIntegration: false
            }
        });
        this.appWin.loadURL(url);

        // catch errors
        this.appWin.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            if (errorDescription === 'ERR_INTERNET_DISCONNECTED') {
                throwError('No Internet connection');
            } else {
                throwError('Failed connecting to ' + url);
            }
        });

        this.appWin.on('app-command', (e, cmd) => {
            if (cmd === 'browser-backward' && extApp.appWin.webContents.canGoBack()) {
                this.appWin.webContents.goBack();
            }
            if (cmd === 'browser-backward' && !extApp.appWin.webContents.canGoBack()) {
                this.appWin.close();
            }
        });

        this.appWin.once('ready-to-show', () => {
            this.logger.info('Open new Web Window with url: ' + url);
            this.appWin.show();
            this.open = true;
        });

        this.appWin.on('close', () => {
            this.open = false;
            this.type = '';
            this.logger.info('Close web app ...');
            this.appWin = null;
        });
        
    }



    // open external programm
    openExtApp(cmd) {
        extApp = cmd;
        cmd = 'bin/startscript.sh start ' + (home + '/.config/conTVLauncher/extApp.pid') + cmd;
        require('child_process').exec(cmd);
    }
    closeExtApp(cmd) {
        cmd = 'bin/startscript.sh stop ' + (home + '/.config/conTVLauncher/extApp.pid') + cmd;
        require('child_process').exec(cmd);
    }

    // spotify
    startSpotifyService() {
        let cmd = app.getAppPath() + '/bin/spotify/librespot --name RaspTV --cache ' + app.getAppPath() +'/bin/spotify/cache';
        require('child_process').spawn(cmd, {
            detached: true
        });
    }


    // systemControls

    execSysApp() {
        this.type = 'sys';
        switch(this.cmd) {
            case 'close':
                this.app.quit();
                break;
            case 'shutdown':
                this.app.quit();
                break;
            case 'settings':
                this.openSettingsWin();
                break;
            default:
                throw new Error('Unknown System App');
        }
    }


    openSettingsWin () {
        this.appWin = new BrowserWindow({ parent: this.win, show: false, frame: false, width: 500, height: 300, modal: true });
        this.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(this.app.getAppPath(), 'frontend/settings.html')
        }));

        this.appWin.on('ready-to-show', () => {
            this.logger.info('Open settings window');
            this.appWin.show();
        });

        //register events
        ipcMain.on('settings-get-cfg', (event) => {
            event.returnValue = this.cfg.getCfg();
        });
        ipcMain.on('settings-close', () => {
            this.appWin.close();
        });
        ipcMain.on('settings-save-cfg', (event, arg) => {
            this.cfg.setCfg(arg);
            // config functions   
            this.cfg.writeCfg();
            this.win.webContents.send('recieve-cfg', this.cfg.getCfg());
            if(this.appWin) this.appWin.close();
        });
        ipcMain.on('settings-restore-cfg', (event) => {
            event.returnValue = this.cfg.restoreDefaultCfg();
        });

        this.appWin.on('close', () => {
            this.open = false;
            this.type = '';
            this.logger.info('Close web app ...');
            this.appWin = null;
        });
    }
}

module.exports = extApp;