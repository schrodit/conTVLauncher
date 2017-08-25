const {ipcRenderer} = require('electron');

class conveyApp extends Polymer.Element {
    static get is() { return 'convey-app'; }

    static get properties() {
        return {
            tiles: {
                type: Array,
                notify: true
            },
            zoomFactor: {
                type: Number,
                notify: true,
                observer: '_onZoomFactor'
            },
            spotify: {
                type: Boolean,
                notify: true
            },
            selected: {
                type: Array
            }
        };
    }

    constructor() {
        super();
        //register electron events
        ipcRenderer.on('recieve-cfg', (event, cfg) => {
            this._setConfig(cfg);
        });
        ipcRenderer.on('spotify-close', () => {
            this.selected = [0, 0];
            this.set('tiles.0.0.selected', true);
        });
        
        // register navigation shortcuts
        this.enterCount = 0;
        window.addEventListener('keydown', (event) => {
            ipcRenderer.send('reset-active-time');
            switch(event.keyCode) {
                case 13:
                    event.preventDefault();
                    this.enterCount++;
                    if(this.enterCount === 1) {
                        setTimeout(() => {
                            if(this.enterCount < 2) this._onOpenApp();
                            else this._openContextMenu();
                            this.enterCount = 0;
                        }, 700);
                    }
                    break;
                case 37:
                    event.preventDefault();
                    this._navLeft();
                    break;
                case 38:
                    event.preventDefault();
                    this._navTop();
                    break;
                case 39:
                    event.preventDefault();
                    this._navRight();
                    break;
                case 40:
                    event.preventDefault();
                    this._navDown();
                    break;
                default:
                    break;
            }
        });
    
    }

    connectedCallback() {
        super.connectedCallback();
        let cfg = ipcRenderer.sendSync('get-cfg');
        this._setConfig(cfg);
    }

    _setConfig(cfg) {
        this.zoomFactor = cfg.zoomFactor;
        this.spotify = cfg.enableSpotify;
        this.tiles = cfg.tiles;
        // TODO: check if some tile already selected
        this.selected = [0, 0];
        this.tiles[0][0].selected = true;
    }

    // execute App
    _onOpenApp() {
        let selTile;
        if(this.selected[1] === -1) selTile = {
            type: 'intern',
            cmd: 'spotify-app.html'
        };
        else selTile = this.tiles[this.selected[1]][this.selected[0]];
        ipcRenderer.send('open-App', selTile);
    }


    // Navigation
    goTo(aNewTile) {
        if(this.selected[1] === -1) this.shadowRoot.querySelector('spotify-widget').selected = false;
        else this.set('tiles.' + this.selected[1] + '.' + this.selected[0] + '.selected', false);
        this.set('tiles.' + aNewTile[1] + '.' + aNewTile[0] + '.selected', true);

        this.selected = aNewTile;
    }

    gotoSpotify() {
        this.set('tiles.' + this.selected[1] + '.' + this.selected[0] + '.selected', false);
        this.shadowRoot.querySelector('spotify-widget').selected = true;

        this.selected = [0, -1];
    }

    _navLeft() {
        let x = this.selected[0], y = this.selected[1];
        if(y > -1 && x > 0) {
            this.goTo([x - 1, y]);
        }
    }
    _navRight() {
        let x = this.selected[0], y = this.selected[1];
        if(y > -1 && (this.tiles[y].length - 1) > x) {
            this.goTo([x + 1, y]);
        }
    }
    _navTop() {
        let x = this.selected[0], y = this.selected[1];
        if(y > 0) {
            y = y - 1;
            if (this.tiles[y].length - 1 < x) x = this.tiles[y].length - 1;
            this.goTo([x, y]);
        } else if(this.spotify && this.shadowRoot.querySelector('spotify-widget').open) this.gotoSpotify();
    }
    _navDown() {
        let x = this.selected[0], y = this.selected[1];
        if((this.tiles.length - 1) > y) {
            y = y + 1;
            if (this.tiles[y].length - 1 < x) x = this.tiles[y].length - 1;
            this.goTo([x, y]);
        }
    }

    _onZoomFactor() {
        this.style.zoom = this.zoomFactor;
    }

    checkSysTiles(tile) {
        return tile.type === 'sys' && tile.show ? true : false;
    }
    checkTiles(tile) {
        return tile.type !== 'sys' && tile.show ? true : false;
    }

    //context menu
    _openContextMenu() {
        if(this.selected[1] === -1) {
            this.shadowRoot.querySelector('spotify-widget').openMenu();
        } else {
            ipcRenderer.send('set-tiles', this.tiles);
            ipcRenderer.send('open-tile-editor');
        }
    }
    
}

window.customElements.define(conveyApp.is, conveyApp);