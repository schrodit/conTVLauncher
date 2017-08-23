"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs = require('fs');
const crypto = require('crypto');
const defaultCfg = require('./default.json');
class cfgMgmt {
    constructor(aMgmt) {
        this.aMgmt = aMgmt;
        this.home = this.aMgmt.home;
        this.cfgPath = this.home + '/.config/conTVLauncher';
        this.logger = this.aMgmt.logger;
        this.hiddenTiles = [];
        this.config = this.readCfg();
        //register events
        electron_1.ipcMain.on('get-cfg', (event) => {
            event.returnValue = this.getCfg();
        });
        electron_1.ipcMain.on('save-cfg', (event, arg) => {
            this.setCfg(arg);
            // config functions   
            this.writeCfg();
            this.aMgmt.win.webContents.send('recieve-cfg', this.config);
        });
        electron_1.ipcMain.on('settings-restore-cfg', (event) => {
            event.returnValue = this.restoreDefaultCfg();
        });
        electron_1.ipcMain.on('set-tiles', (event, args) => {
            this.config.tiles = args;
        });
        electron_1.ipcMain.on('save-new-tile', (event, arg) => {
            this.addNewTile(arg);
        });
    }
    getCfg() { return this.config; }
    setCfg(cfg) {
        if (this.checkConfig(cfg))
            this.config = deepCp(cfg);
    }
    readCfg() {
        this.logger.info('Loading config ...');
        if (!fs.existsSync(this.home + '/.config'))
            fs.mkdirSync(this.home + '/.config');
        if (!fs.existsSync(this.home + '/.config/conTVLauncher'))
            fs.mkdirSync(this.home + '/.config/conTVLauncher');
        if (!fs.existsSync(this.home + '/.config/conTVLauncher/config.json')) {
            let config = defaultCfg;
            config.tiles = this.setupTiles(config);
            this.writeCfg(deepCp(config));
            return config;
        }
        else {
            let config = JSON.parse(fs.readFileSync(this.home + '/.config/conTVLauncher/config.json'));
            config.tiles = this.setupTiles(config);
            return config;
        }
    }
    writeCfg(cfg) {
        try {
            this.logger.info('Writing config to ' + this.home + '/.config/conTVLauncher/config.json' + ' ...');
            let config;
            if (cfg === undefined) {
                config = deepCp(this.config);
            }
            else {
                config = cfg;
                this.setCfg(cfg);
            }
            if (this.checkConfig(config)) {
                config.tiles = this.restoreHiddenTiles(config.tiles);
                console.log(JSON.stringify(config.tiles, null, 1));
                config.tiles = this.removeSystemTiles(config.tiles);
                fs.writeFileSync(this.home + '/.config/conTVLauncher/config.json', config.prettyprint ? JSON.stringify(config, null, 1) : JSON.stringify(config));
            }
            else
                this.aMgmt.logger.error('Cannot write config, check config: \n' + JSON.stringify(config, null, 1));
        }
        catch (err) {
            this.aMgmt.logger.error(err);
            this.aMgmt.app.exit();
        }
    }
    ;
    addNewTile(tile) {
        // create hash over title for image name
        try {
            let hash = crypto.createHash('md5');
            let imgName = hash.update(tile.title).digest('hex') + '.' + tile.img.name.split('.').pop();
            let imgPath = tile.img !== null ? this.saveImg(imgName, tile.img.path) : '';
            let nTile = {
                title: tile.title,
                cmd: tile.cmd,
                type: tile.type,
                img: imgPath,
                container: 0,
                show: true,
                selected: true
            };
            this.config.tiles[0].splice(0, 0, nTile);
            //remove selected tile
            for (let i = 0; i < this.config.tiles.length; i++) {
                for (let y = 0; y < this.config.tiles[i].length; y++) {
                    if (this.config.tiles[i][y].selected)
                        this.config.tiles[i][y].selected = false;
                }
            }
            this.writeCfg();
            this.aMgmt.win.webContents.send('recieve-cfg', this.config);
            this.aMgmt.extApp.appWin.webContents.send('recieve-cfg', this.config);
        }
        catch (err) {
            this.logger.error(err);
        }
        ;
    }
    saveImg(name, url) {
        //check img path
        try {
            let path = this.cfgPath + '/img';
            if (!fs.existsSync(path))
                fs.mkdirSync(path);
            let imageFile = fs.readFileSync(url);
            path = path + '/' + name;
            fs.writeFileSync(path, imageFile);
            return path;
        }
        catch (err) {
            this.aMgmt.throwError(err);
        }
        throw new Error('Cannot write file');
    }
    setupTiles(cfg) {
        let tiles = cfg.tiles;
        let hide = [];
        let numEmptyContainers = 0;
        tiles = this.addSystemTiles(cfg);
        tiles.forEach((con, i1) => {
            con.forEach((tile, i2) => {
                if (!tile.show) {
                    this.hiddenTiles.push({ 'container': i1, 'tile': i2, 'data': tiles[i1][i2] });
                    hide.push(i2);
                }
                else {
                    tile.container = i1;
                    tile.selected = false;
                }
            });
            hide.forEach((elem, i) => {
                tiles[i1].splice(elem - i, 1);
            });
            hide = [];
        });
        tiles.forEach((con, i) => {
            if (con.length === 0) {
                tiles.splice(i - numEmptyContainers, 1);
                numEmptyContainers++;
            }
        });
        return tiles;
    }
    addSystemTiles(cfg) {
        let tiles = cfg.tiles;
        let sysTiles = [
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
    }
    removeSystemTiles(tiles) {
        let conCount = 0;
        let conLength = tiles.length;
        for (let i = 0; i < conLength; i++) {
            let i1 = i - conCount;
            let tileCount = 0;
            let tilesLength = tiles[i1].length;
            for (let ii = 0; ii < tilesLength; ii++) {
                let i2 = ii - tileCount;
                let tile = tiles[i1][i2];
                if (tile === null)
                    throw new Error('Tile in ' + i1 + '. Container, ' + i1 + '. Tile is null\n' + JSON.stringify(tiles[i1], null, 1));
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
    }
    isSystemTile(cmd) {
        switch (cmd) {
            case 'shutdown':
            case 'settings':
            case 'close':
                return true;
            default:
                return false;
        }
    }
    restoreHiddenTiles(tiles) {
        this.hiddenTiles.forEach((tile) => {
            if (tiles[tile.container] !== undefined &&
                tiles[tile.container].length > 0 &&
                tiles[tile.container][0].container === tile.container) {
                if (tile.data.type === 'sys')
                    tiles[tiles.length - 1].splice(tile.tile, 0, tile.data);
                else
                    tiles[tile.container].splice(tile.tile, 0, tile.data);
            }
            else {
                tiles.splice(tile.container, 0, []);
                tiles[tile.container].splice(tile.tile, 0, tile.data);
            }
        });
        return tiles;
    }
    restoreDefaultCfg() {
        let config = defaultCfg;
        config.tiles = this.setupTiles(defaultCfg);
        return config;
    }
    ;
    checkConfig(cfg) {
        if (cfg === void 0)
            return false;
        if (Object.keys(cfg).length < 6 || cfg.constructor !== Object)
            return false;
        return true;
    }
}
exports.cfgMgmt = cfgMgmt;
function deepCp(obj) { return JSON.parse(JSON.stringify(obj)); }
