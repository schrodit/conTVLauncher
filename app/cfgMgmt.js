const fs = require('fs');
const defaultCfg = require('./default.json');

class cfg {
    constructor(home, winston) {
        this.home = home;
        this.logger = winston;
        this.hiddenTiles = [];
        this.config = this.readCfg();
    }

    getCfg() { return this.config; }
    setCfg(cfg) {
        this.config = cfg;
    }

    readCfg() {
        this.logger.info('Loading config ...');
        if (!fs.existsSync(this.home + '/.config')) fs.mkdirSync(this.home + '/.config');
        if (!fs.existsSync(this.home + '/.config/conTVLauncher')) fs.mkdirSync(this.home + '/.config/conTVLauncher');
        if (!fs.existsSync(this.home + '/.config/conTVLauncher/config.json')) {
            let config = defaultCfg;
            config.tiles = this.setupTiles(config.tiles);
            return config;
        } else {
            let config = JSON.parse(fs.readFileSync(this.home + '/.config/conTVLauncher/config.json'));
            config.tiles = this.setupTiles(config.tiles);
            return config;
        }
    }

    writeCfg() {
        this.logger.info('Writing config to ' + this.home + '/.config/conTVLauncher/config.json' + ' ...');
        let config = JSON.parse(JSON.stringify(this.config));
        config.tiles = this.restoreHiddenTiles(config.tiles);
        config.tiles = this.removeSystemTiles(config.tiles);
        fs.writeFileSync(this.home + '/.config/conTVLauncher/config.json', JSON.stringify(config));
    };

    setupTiles(tiles) {
        tiles = this.addSystemTiles(tiles);
        tiles.forEach((con, i1) => {
            con.forEach((tile, i2) => {
                if(!tile.show) {
                    this.hiddenTiles.push({'container': i1, 'tile': i2, 'data': tiles[i1][i2]});
                    tiles[i1].splice(i2, 1);
                } else {
                    tile.container = i1;
                    tile.selected = false;
                }
            });
        });

        return tiles;
    }

    addSystemTiles(tiles) {
        let sysTiles = [
            {
                    'title': 'Settings',
                    'icon': 'icons:settings',
                    'type': 'sys',
                    'cmd': 'settings',
                    'selected': false,
                    'show': true
            },
            {
                    'title': 'Close',
                    'icon': 'icons:close',
                    'type': 'sys',
                    'cmd': 'close',
                    'selected': false,
                    'show': true
            },
            {
                    'title': 'Poweroff',
                    'icon': 'icons:power-settings-new',
                    'type': 'sys',
                    'cmd': 'shutdown',
                    'selected': false,
                    'show': false
            },
        ];
        tiles.push(sysTiles);

        return tiles;
    }

    removeSystemTiles(tiles) {
        tiles.forEach((con, i1) => {
            con.forEach((tile, i2) => {
                if(tile.type === 'sys') {
                    tiles.splice(i1, 1);
                } else delete tiles[i1][i2].container;
            });
        });

        return tiles;
    }

    restoreHiddenTiles(tiles) {
        this.hiddenTiles.forEach((tile) => {

            if(tiles[tile.container] !== undefined && 
                tiles[tile.container].length > 0 && 
                tiles[tile.container][0].container === tile.container) tiles[tile.container].splice(tile.tile, 0, tile.data);
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
    };


}

module.exports = cfg;