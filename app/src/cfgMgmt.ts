import {ipcMain} from 'electron';
const fs = require('fs');
const defaultCfg = require('./default.json');

import * as winston from 'winston';
import {appMgmt} from './appMgmt';

export interface tile {
    title: string;
    img: string;
    type: string;
    cmd: string;
    show: boolean;
    container?: number;
    selected?: boolean;
}

export interface config {
    zoomFactor: number;
    enableSpotify: boolean;
    enableShutdown: boolean;
    prettyprint: boolean;
    screensaver: number,
    tiles: Array<Array<tile>>;
}


export class cfgMgmt {
    home: string;
    aMgmt: appMgmt;
    logger: winston.LoggerInstance;
    hiddenTiles: Array<{
        container: number;
        tile: number;
        data: tile;
    }>;
    config: config;
    
    constructor(aMgmt: appMgmt) {
        this.aMgmt = aMgmt;
        this.home = this.aMgmt.home;
        this.logger = this.aMgmt.logger;
        this.hiddenTiles = [];
        this.config = this.readCfg();

        //register events
        ipcMain.on('get-cfg', (event: Electron.Event) => {
            event.returnValue = this.getCfg();
        });
        ipcMain.on('save-cfg', (event: Electron.Event, arg: config) => {
            this.setCfg(arg);
            // config functions   
            this.writeCfg();
            this.aMgmt.win.webContents.send('recieve-cfg', this.aMgmt.cfg.getCfg());
        });
        ipcMain.on('settings-restore-cfg', (event: Electron.Event) => {
            event.returnValue = this.restoreDefaultCfg();
        });
        ipcMain.on('set-tiles', (event: NodeJS.EventEmitter, args: Array<Array<tile>>) => {
            this.config.tiles = args;
        });

    }

    getCfg() { return this.config; }
    setCfg(cfg: config) {
        if(this.checkConfig(cfg)) this.config = deepCp(cfg);
    }

    readCfg() {
        this.logger.info('Loading config ...');
        if (!fs.existsSync(this.home + '/.config')) fs.mkdirSync(this.home + '/.config');
        if (!fs.existsSync(this.home + '/.config/conTVLauncher')) fs.mkdirSync(this.home + '/.config/conTVLauncher');
        if (!fs.existsSync(this.home + '/.config/conTVLauncher/config.json')) {
            let config = defaultCfg;
            config.tiles = this.setupTiles(config);
            this.writeCfg(deepCp(config));
            return config;
        } else {
            let config = JSON.parse(fs.readFileSync(this.home + '/.config/conTVLauncher/config.json'));
            config.tiles = this.setupTiles(config);
            return config;
        }
    }

    writeCfg(cfg?: config) {
        this.logger.info('Writing config to ' + this.home + '/.config/conTVLauncher/config.json' + ' ...');
        let config;
        if(cfg === undefined) {
            config = deepCp(this.config);
        } else {
            config = cfg;
            this.setCfg(cfg);
        }
        if(this.checkConfig(config)) {
            config.tiles = this.restoreHiddenTiles(config.tiles);
            config.tiles = this.removeSystemTiles(config.tiles);
            fs.writeFileSync(this.home + '/.config/conTVLauncher/config.json', config.prettyprint ? JSON.stringify(config, null, 1) : JSON.stringify(config));
        } else this.aMgmt.logger.error('Cannot write config, check config: \n' + JSON.stringify(config, null, 1));
    };

    setupTiles(cfg: config) {
        let tiles = cfg.tiles;
        let hide: Array<number> = [];
        tiles = this.addSystemTiles(cfg);
        tiles.forEach((con, i1) => {
            con.forEach((tile, i2) => {
                if(!tile.show) {
                    this.hiddenTiles.push({'container': i1, 'tile': i2, 'data': tiles[i1][i2]});
                    hide.push(i2);
                } else {
                    tile.container = i1;
                    tile.selected = false;
                }
            });
            hide.forEach((elem, i) => {
                tiles[i1].splice(elem-i, 1);
            });
            hide = [];
        });

        return tiles;
    }

    addSystemTiles(cfg: config) {
        let tiles = cfg.tiles;
        let sysTiles: Array<tile> = [
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

    removeSystemTiles(tiles: Array<Array<tile>>) {
        let conCount = 0;
        let conLength = tiles.length;
        for(let i = 0; i < conLength;i++) {
            let i1 = i - conCount;
            let tileCount = 0;
            let tilesLength = tiles[i1].length;
            for (let ii = 0; ii < tilesLength; ii++) {
                let i2 = ii - tileCount;
                let tile = tiles[i1][i2];
                if(tile.type === 'sys' && this.isSystemTile(tile.cmd)) {
                    tiles[i1].splice(i2, 1);
                    tileCount++;
                    if(tiles[i1].length === 0) {
                        tiles.splice(i1, 1);
                        conCount++;
                    }
                } else {
                    if(tiles[i1][i2].container !== undefined ) delete tiles[i1][i2].container;
                    if(tiles[i1][i2].selected !== undefined ) delete tiles[i1][i2].selected;
                }
            }
        }

        return tiles;
    }
    isSystemTile(cmd: string) {
        switch(cmd) {
            case 'shutdown': case 'settings': case 'close':
                return true;
            default:
                return false; 
        }
    }

    restoreHiddenTiles(tiles: Array<Array<tile>>) {
        this.hiddenTiles.forEach((tile) => {
            if(tiles[tile.container] !== undefined && 
                tiles[tile.container].length > 0 && 
                tiles[tile.container][0].container === tile.container) {
                    if(tile.data.type === 'sys') tiles[tiles.length-1].splice(tile.tile, 0, tile.data);
                    else tiles[tile.container].splice(tile.tile, 0, tile.data);
            } else {
                tiles.splice(tile.container, 0, [null]);
                tiles[tile.container].splice(tile.tile, 0, tile.data);
            }
        });
        return tiles;
    }

    restoreDefaultCfg() {
        let config = defaultCfg;
        config.tiles = this.setupTiles(defaultCfg);
        return config;
    };

    checkConfig(cfg: config) {
        if (cfg === void 0) return false;

        if(Object.keys(cfg).length < 6 || cfg.constructor !== Object) return false;

        return true;
    }


}
function deepCp(obj: Object) { return JSON.parse(JSON.stringify(obj)); }