"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var winston = require("winston");
var cfgMgmt_1 = require("./cfgMgmt");
var extAppMgmt_1 = require("./extAppMgmt");
var spotifyApp_1 = require("./spotifyApp");
var appMgmt = (function () {
    function appMgmt(app, home) {
        this.app = app;
        this.home = home;
    }
    appMgmt.prototype.initCfg = function () {
        this.cfg = new cfgMgmt_1.cfgMgmt(this.home, this.logger);
    };
    appMgmt.prototype.initExtApp = function () {
        this.extApp = new extAppMgmt_1.extAppMgmt(this);
    };
    appMgmt.prototype.initLogger = function () {
        this.logger = new winston.Logger({
            transports: [
                new (winston.transports.Console)(),
                new (winston.transports.File)({
                    filename: this.home + '/.config/conTVLauncher/conTVLauncher.log',
                    formatter: function (options) {
                        // Return string will be passed to logger. 
                        return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (options.message ? options.message : '') +
                            (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
                    }
                })
            ]
        });
    };
    appMgmt.prototype.initSpotify = function () {
        this.spotify = new spotifyApp_1.spotifyApp(this);
    };
    return appMgmt;
}());
exports.appMgmt = appMgmt;
