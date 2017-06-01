const {BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const powerOff = require('power-off');
const exec = require('child_process').exec;

class extApp {
    constructor(app) {
        this.app = app;
        this.win = app.win;
        this.cfg = app.cfg;
        this.logger = app.logger;
        this.home = this.app.getPath('home');
        this.type = String;
        this.cmd = String;
        this.open = false;
    }

    openApp(app) {
        if (this.open) this.closeApp();
        this.type = app.type;
        switch(this.type) {
            case 'web':
                this.cmd = app.url;
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
        
    }
    closeApp() {
        switch(this.type) {
            case 'web': case 'shell': case 'sys': case 'intern':
                this.appWin.close();
                break;
            default:
                this.logger.error('Unkown application type ' + this.type);
                this.type = '';
                this.cmd = '';
                break;
        }
    }
    // new Web Window
    newWebApp(url) {
        if (this.type === 'intern') {
            this.appWin = new BrowserWindow({
                modal: true,
                frame: false,
                fullscreen: true
            });
        } else { 
            this.appWin = new BrowserWindow({
                modal: true,
                frame: false,
                fullscreen: true,
                webPreferences: {
                    plugins: true,
                    nodeIntegration: false
                }
            });
        }        
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

     newInternApp(iUrl) {
        this.appWin = new BrowserWindow({
            modal: true,
            frame: false,
            fullscreen: true
        });       
        this.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(this.app.getAppPath(), 'frontend', iUrl)
        }));
        

        this.appWin.once('ready-to-show', () => {
            this.logger.info('Open new Internal App Window');
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
    openExtApp() {
        let cmd = this.app.getAppPath() + '/bin/startscript.sh start ' + (this.home + '/.config/conTVLauncher/extApp.pid ') + this.cmd;
        require('child_process').exec(cmd);
        this.open = true;
    }
    closeExtApp() {
        let cmd = this.app.getAppPath() + '/bin/startscript.sh stop ' + (this.home + '/.config/conTVLauncher/extApp.pid ') + this.cmd;
        require('child_process').execSync(cmd);
        this.open = false;
        this.cmd = '';
    }


    // systemControls

    execSysApp() {
        switch(this.cmd) {
            case 'close':
                this.app.quit();
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
            if(this.appWin) this.appWin.close();
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

    openPowerSettingsWin () {
        this.appWin = new BrowserWindow({ 
            parent: this.win, 
            show: true, 
            frame: false, 
            width: 300, height: 346, 
            'use-content-size': true,
            modal: true 
        });
        this.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(this.app.getAppPath(), 'frontend/powersettings.html')
        }));

        ipcMain.on('power-shutdown', () => {
            this.type = '';
            this.cmd = '';
            let that = this;
            powerOff( (err, stderr, stdout) => {
                if(!err && !stderr) {
                    that.logger.info(stdout);
                } else {
                    throw new Error(stderr);
                }
            });
        });
        ipcMain.on('power-restart', () => {
            exec('reboot', (err, stderr, stdout) => {
                if(!err && !stderr) {
                    that.logger.info(stdout);
                } else {
                    throw new Error(stderr);
                }
            });
        });
        ipcMain.on('power-reload', () => {
            this.app.relaunch();
            this.app.exit(0);
        });

        this.appWin.on('ready-to-show', () => {
            this.logger.info('Open power-settings window');
            this.appWin.show();
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