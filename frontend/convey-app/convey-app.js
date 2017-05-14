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
            },
            toast: {
                type: Object,
                notify: true,
                value: {open: false}
            }
        };
    }

    constructor() {
        super();
        //register electron events
        ipcRenderer.on('on-error', (event, arg) => {
            this.set('toast.type', 'error');
            this.set('toast.msg', arg);
            this.set('toast.open', 'true');
        });
        
        // register navigation shortcuts
        window.addEventListener('keydown', (event) => {
            event.preventDefault();
            switch(event.keyCode) {
                case 13:
                    this._onOpenApp();
                    break;
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
        this.selected = [0, 0];
        this.tiles[0][0].selected = true;
    }

    // execute App
    _onOpenApp() {
        let selTile = this.tiles[this.selected[1]][this.selected[0]];
        ipcRenderer.send('open-App', selTile);
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
        return tile.type === 'sys' && tile.show ? true : false;
    }
    checkTiles(tile) {
        return tile.type !== 'sys' && tile.show ? true : false;
    }
    
}

window.customElements.define(conveyApp.is, conveyApp);