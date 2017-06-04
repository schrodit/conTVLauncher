"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var powerOff = require('power-off');
var exec = require('child_process').exec;
var extAppMgmt = (function () {
    function extAppMgmt(aMgmt) {
        this.aMgmt = aMgmt;
        this.open = false;
    }
    extAppMgmt.prototype.openApp = function (app) {
        if (this.open)
            this.closeApp();
        this.type = app.type;
        switch (this.type) {
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
    };
    extAppMgmt.prototype.closeApp = function () {
        if (!this.appWin.isDestroyed()) {
            switch (this.type) {
                case 'web':
                case 'shell':
                case 'sys':
                case 'intern':
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
    };
    // new Web Window
    extAppMgmt.prototype.newWebApp = function (url) {
        var _this = this;
        this.appWin = new electron_1.BrowserWindow({
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
        this.appWin.webContents.on('did-fail-load', function (event, errorCode, errorDescription) {
            if (errorDescription === 'ERR_INTERNET_DISCONNECTED') {
                throw Error('No Internet connection');
            }
            else {
                throw Error('Failed connecting to ' + url);
            }
        });
        this.appWin.on('app-command', function (e, cmd) {
            if (cmd === 'browser-backward' && _this.appWin.webContents.canGoBack()) {
                _this.appWin.webContents.goBack();
            }
            if (cmd === 'browser-backward' && !_this.appWin.webContents.canGoBack()) {
                _this.appWin.close();
            }
        });
        this.appWin.once('ready-to-show', function () {
            _this.aMgmt.logger.info('Open new Web Window with url: ' + url);
            _this.appWin.show();
            _this.open = true;
        });
        this.appWin.on('close', function () {
            _this.open = false;
            _this.type = '';
            _this.aMgmt.logger.info('Close web app ...');
            _this.appWin = null;
        });
    };
    extAppMgmt.prototype.newInternApp = function (iUrl) {
        var _this = this;
        this.appWin = new electron_1.BrowserWindow({
            modal: true,
            frame: false,
            fullscreen: true
        });
        this.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(this.aMgmt.app.getAppPath(), 'frontend', iUrl)
        }));
        this.appWin.once('ready-to-show', function () {
            _this.aMgmt.logger.info('Open new Internal App Window');
            _this.appWin.show();
            _this.open = true;
        });
        this.appWin.on('close', function () {
            _this.open = false;
            _this.type = '';
            _this.aMgmt.logger.info('Close web app ...');
            _this.appWin = null;
        });
    };
    // open external programm
    extAppMgmt.prototype.openExtApp = function () {
        var cmd = this.aMgmt.app.getAppPath() + '/bin/startscript.sh start ' + (this.aMgmt.home + '/.config/conTVLauncher/extApp.pid ') + this.cmd;
        require('child_process').exec(cmd);
        this.open = true;
    };
    extAppMgmt.prototype.closeExtApp = function () {
        var cmd = this.aMgmt.app.getAppPath() + '/bin/startscript.sh stop ' + (this.aMgmt.home + '/.config/conTVLauncher/extApp.pid ') + this.cmd;
        require('child_process').execSync(cmd);
        this.open = false;
        this.cmd = '';
    };
    // systemControls
    extAppMgmt.prototype.execSysApp = function () {
        switch (this.cmd) {
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
    };
    extAppMgmt.prototype.openSettingsWin = function () {
        var _this = this;
        this.appWin = new electron_1.BrowserWindow({ parent: this.aMgmt.win, show: false, frame: false, width: 500, height: 300, modal: true });
        this.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(this.aMgmt.app.getAppPath(), 'frontend/settings.html')
        }));
        this.appWin.on('ready-to-show', function () {
            _this.aMgmt.logger.info('Open settings window');
            _this.appWin.show();
        });
        //register events
        electron_1.ipcMain.on('settings-get-cfg', function (event) {
            event.returnValue = _this.aMgmt.cfg.getCfg();
        });
        electron_1.ipcMain.on('settings-close', function () {
            if (_this.appWin)
                _this.appWin.close();
        });
        electron_1.ipcMain.on('settings-save-cfg', function (event, arg) {
            _this.aMgmt.cfg.setCfg(arg);
            // config functions   
            _this.aMgmt.cfg.writeCfg();
            _this.aMgmt.win.webContents.send('recieve-cfg', _this.aMgmt.cfg.getCfg());
            if (_this.appWin)
                _this.appWin.close();
        });
        electron_1.ipcMain.on('settings-restore-cfg', function (event) {
            event.returnValue = _this.aMgmt.cfg.restoreDefaultCfg();
        });
        this.appWin.on('close', function () {
            _this.open = false;
            _this.type = '';
            _this.aMgmt.logger.info('Close web app ...');
            _this.appWin = null;
        });
    };
    extAppMgmt.prototype.openPowerSettingsWin = function () {
        var _this = this;
        this.appWin = new electron_1.BrowserWindow({
            parent: this.aMgmt.win,
            show: true,
            frame: false,
            width: 300, height: 346,
            modal: true
        });
        this.appWin.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(this.aMgmt.app.getAppPath(), 'frontend/powersettings.html')
        }));
        electron_1.ipcMain.on('power-shutdown', function () {
            _this.type = '';
            _this.cmd = '';
            var that = _this;
            powerOff(function (err, stderr, stdout) {
                if (!err && !stderr) {
                    that.aMgmt.logger.info(stdout.toString());
                }
                else {
                    throw new Error(stderr.toString());
                }
            });
        });
        electron_1.ipcMain.on('power-restart', function () {
            var that = _this;
            exec('reboot', function (err, stderr, stdout) {
                if (!err && !stderr) {
                    that.aMgmt.logger.info(stdout.toString());
                }
                else {
                    throw new Error(stderr.toString());
                }
            });
        });
        electron_1.ipcMain.on('power-reload', function () {
            _this.aMgmt.app.relaunch();
            _this.aMgmt.app.exit(0);
        });
        this.appWin.on('ready-to-show', function () {
            _this.aMgmt.logger.info('Open power-settings window');
            _this.appWin.show();
        });
        this.appWin.on('close', function () {
            _this.open = false;
            _this.type = '';
            _this.aMgmt.logger.info('Close web app ...');
            _this.appWin = null;
        });
    };
    return extAppMgmt;
}());
exports.extAppMgmt = extAppMgmt;
