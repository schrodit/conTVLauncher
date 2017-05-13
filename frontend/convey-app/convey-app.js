const {ipcMain, ipcRenderer} = require('electron');

class conveyApp extends Polymer.Element {
    static get is() { return 'convey-app'; }

    static get properties() {
        return {
            tiles: {
                type: Array,
                notify: true
            },
            selected: {
                type: Array
            }
        };
    }

    constructor() {
        super();
        // register navigation shortcuts
        window.addEventListener('keydown', (event) => {
            event.preventDefault();
            switch(event.keyCode) {
                case 37:
                    this._navLeft();
                    break;
                case 38:
                    this._navTop();
                    break;
                case 39:
                    this._navRight();
                    break;
                case 40:
                    this._navDown();
                    break;
            }
        });
    
    }

    connectedCallback() {
        super.connectedCallback();
        this.tiles = ipcRenderer.sendSync('get-cfg').tiles;
        setAttribute(this.tiles);
        addSystemTiles(this.tiles);
        this.selected = [0, 0];
        this.tiles[0][0].selected = true;
    }

    // Navigation
    goTo(aNewTile) {
        this.set('tiles.' + this.selected[1] + '.' + this.selected[0] + '.selected', false);
        this.set('tiles.' + aNewTile[1] + '.' + aNewTile[0] + '.selected', true);

        this.selected = aNewTile;
    }

    _navLeft() {
        let x = this.selected[0], y = this.selected[1];
        if(x > 0) {
            this.goTo([x - 1, y]);
        }
    }
    _navRight() {
        let x = this.selected[0], y = this.selected[1];
        if((this.tiles[y].length - 1) > x) {
            this.goTo([x + 1, y]);
        }
    }
    _navTop() {
        let x = this.selected[0], y = this.selected[1];
        if(y > 0) {
            y = y - 1;
            if (this.tiles[y].length - 1 < x) x = this.tiles[y].length - 1;
            this.goTo([x, y]);
        }
    }
    _navDown() {
        let x = this.selected[0], y = this.selected[1];
        if((this.tiles.length - 1) > y) {
            y = y + 1;
            if (this.tiles[y].length - 1 < x) x = this.tiles[y].length - 1;
            this.goTo([x, y]);
        }
    }

    checkSysTiles(tile) {
        return tile.type === "sys" ? true : false;
    }
    checkTiles(tile) {
        return tile.type !== "sys" ? true : false;
    }
    
}

window.customElements.define(conveyApp.is, conveyApp);

function setAttribute(tiles) {
    tiles.forEach((con) => {
        con.forEach((tile) => {
            tile.selected = false;
        })
    });
}
function addSystemTiles(tiles) {
    let sysTiles = [
        {
                "title": "Close",
                "icon": "icons:close",
                "type": "sys",
                "cmd": "",
                "selected": false
        },
        {
                "title": "Poweroff",
                "icon": "icons:power-settings-new",
                "type": "sys",
                "cmd": "",
                "selected": false
        },
    ];
    tiles.push(sysTiles);
}