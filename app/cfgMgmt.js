"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require('fs');
var defaultCfg = require('./default.json');
var cfgMgmt = (function () {
    function cfgMgmt(home, winston) {
        this.home = home;
        this.logger = winston;
        this.hiddenTiles = [];
        this.config = this.readCfg();
    }
    cfgMgmt.prototype.getCfg = function () { return this.config; };
    cfgMgmt.prototype.setCfg = function (cfg) {
        this.config = cfg;
    };
    cfgMgmt.prototype.readCfg = function () {
        this.logger.info('Loading config ...');
        if (!fs.existsSync(this.home + '/.config'))
            fs.mkdirSync(this.home + '/.config');
        if (!fs.existsSync(this.home + '/.config/conTVLauncher'))
            fs.mkdirSync(this.home + '/.config/conTVLauncher');
        if (!fs.existsSync(this.home + '/.config/conTVLauncher/config.json')) {
            var config = defaultCfg;
            config.tiles = this.setupTiles(config);
            this.writeCfg(deepCp(config));
            return config;
        }
        else {
            var config = JSON.parse(fs.readFileSync(this.home + '/.config/conTVLauncher/config.json'));
            config.tiles = this.setupTiles(config);
            return config;
        }
    };
    cfgMgmt.prototype.writeCfg = function (cfg) {
        this.logger.info('Writing config to ' + this.home + '/.config/conTVLauncher/config.json' + ' ...');
        var config = (cfg === undefined) ? JSON.parse(JSON.stringify(this.config)) : cfg;
        config.tiles = this.restoreHiddenTiles(config.tiles);
        config.tiles = this.removeSystemTiles(config.tiles);
        fs.writeFileSync(this.home + '/.config/conTVLauncher/config.json', config.prettyprint ? JSON.stringify(config, null, 1) : JSON.stringify(config));
    };
    ;
    cfgMgmt.prototype.setupTiles = function (cfg) {
        var _this = this;
        var tiles = cfg.tiles;
        var hide = [];
        tiles = this.addSystemTiles(cfg);
        tiles.forEach(function (con, i1) {
            con.forEach(function (tile, i2) {
                if (!tile.show) {
                    _this.hiddenTiles.push({ 'container': i1, 'tile': i2, 'data': tiles[i1][i2] });
                    hide.push(i2);
                }
                else {
                    tile.container = i1;
                    tile.selected = false;
                }
            });
            hide.forEach(function (elem, i) {
                tiles[i1].splice(elem - i, 1);
            });
            hide = [];
        });
        return tiles;
    };
    cfgMgmt.prototype.addSystemTiles = function (cfg) {
        var tiles = cfg.tiles;
        var sysTiles = [
            {
                'title': 'Settings',
                'img': 'icons:settings',
                'type': 'sys',
                'cmd': 'settings',
                'show': true
            },
            {
                'title': 'Close',
                'img': 'icons:close',
                'type': 'sys',
                'cmd': 'close',
                'show': true
            },
            {
                'title': 'Poweroff',
                'img': 'icons:settings-power',
                'type': 'sys',
                'cmd': 'shutdown',
                'show': cfg.enableShutdown
            }
        ];
        tiles.push(sysTiles);
        return tiles;
    };
    cfgMgmt.prototype.removeSystemTiles = function (tiles) {
        var conCount = 0;
        var conLength = tiles.length;
        for (var i = 0; i < conLength; i++) {
            var i1 = i - conCount;
            var tileCount = 0;
            var tilesLength = tiles[i1].length;
            for (var ii = 0; ii < tilesLength; ii++) {
                var i2 = ii - tileCount;
                var tile = tiles[i1][i2];
                if (tile.type === 'sys' && this.isSystemTile(tile.cmd)) {
                    tiles[i1].splice(i2, 1);
                    tileCount++;
                    if (tiles[i1].length === 0) {
                        tiles.splice(i1, 1);
                        conCount++;
                    }
                }
                else {
                    if (tiles[i1][i2].container !== undefined)
                        delete tiles[i1][i2].container;
                    if (tiles[i1][i2].selected !== undefined)
                        delete tiles[i1][i2].selected;
                }
            }
        }
        return tiles;
    };
    cfgMgmt.prototype.isSystemTile = function (cmd) {
        switch (cmd) {
            case 'shutdown':
            case 'settings':
            case 'close':
                return true;
            default:
                return false;
        }
    };
    cfgMgmt.prototype.restoreHiddenTiles = function (tiles) {
        this.hiddenTiles.forEach(function (tile) {
            if (tiles[tile.container] !== undefined &&
                tiles[tile.container].length > 0 &&
                tiles[tile.container][0].container === tile.container)
                tiles[tile.container].splice(tile.tile, 0, tile.data);
            else {
                tiles.splice(tile.container, 0, [null]);
                tiles[tile.container].splice(tile.tile, 0, tile.data);
            }
        });
        return tiles;
    };
    cfgMgmt.prototype.restoreDefaultCfg = function () {
        var config = defaultCfg;
        config.tiles = this.setupTiles(defaultCfg);
        return config;
    };
    ;
    return cfgMgmt;
}());
exports.cfgMgmt = cfgMgmt;
function deepCp(obj) { return JSON.parse(JSON.stringify(obj)); }
