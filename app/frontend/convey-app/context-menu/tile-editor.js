const {ipcRenderer} = require('electron');

class tileEditor extends Polymer.Element {
    static get is() { return 'tile-editor'; }

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
            editMode: {
                type: Boolean
            },
            selected: {
                type: Array
            },
            openMenu: {
                type: Boolean,
                value: false
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
        this.enterCount = 0;
        window.addEventListener('keydown', (event) => {
            ipcRenderer.send('reset-active-time');
            switch(event.keyCode) {
                case 13:
                    event.preventDefault();
                    this.enterCount++;
                    if(this.enterCount === 1) {
                        setTimeout(() => {
                            if(this.enterCount < 2 && this.editMode && !this.openMenu) this.saveTiles();
                            else if(this.enterCount < 2 && this.openMenu) this.selectMenu();
                            else if(!this.editMode) this.changeToEditMode();
                            this.enterCount = 0;
                        }, 700);
                    }
                    break;
                case 27:
                    event.preventDefault();
                    this.enterCount++;
                    if(this.enterCount === 1) {
                        setTimeout(() => {
                            if(this.enterCount < 2 && this.editMode && !this.openMenu) this.changeToNormalMode();
                            else if(this.openMenu) this.closeTileSettings();
                            else this.closeEditor();
                            this.enterCount = 0;
                        }, 700);
                    }
                    break;
                case 37:
                    event.preventDefault();
                    if(!this.editMode) this._navLeft();
                    else if(this.openMenu) this._navMenuLeft();
                    else this._moveLeft();
                    break;
                case 38:
                    event.preventDefault();
                    if(!this.editMode) this._navTop();
                    else if(this.openMenu) this._navMenuTop();
                    else this._moveTop();
                    break;
                case 39:
                    event.preventDefault();
                    if(!this.editMode) this._navRight();
                    else if(this.openMenu) this.closeTileSettings();
                    else this._moveRight();
                    break;
                case 40:
                    event.preventDefault();
                    if(!this.editMode) this._navDown();
                    else if(this.openMenu) this._navMenuDown();
                    else this._moveDown();
                    break;
                default:
                    break;
            }
        });
    
    }

    connectedCallback() {
        super.connectedCallback();
        this._setConfig(ipcRenderer.sendSync('get-cfg'));
    }

    _setConfig(cfg) {
        this.zoomFactor = cfg.zoomFactor;
        this.spotify = cfg.enableSpotify;
        this.tiles = cfg.tiles;
        
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                if(this.tiles[y][x].selected) {
                    if(this.tiles[y][x].type !== 'sys') this.selected = [x, y];
                    else {
                        this.set('tiles.' + y + '.' + x + '.selected', true);
                        this.selected = [0,0];
                        this.set('tiles.0.0.selected', true);
                    }
                } 
            }
        }
        if(this.selected === void 0) {
            this.selected = [0,0];
            this.set('tiles.0.0.selected', true);
        }
        this.changeToEditMode();
    }

    // Editor Operations
    saveTiles() {
        //remove empty container
        for(let y = 0; y < this.tiles.length; y++) {
            if(this.tiles[y].length === 0) this.tiles.splice(y, 1);
        }
        ipcRenderer.send('save-tiles', this.tiles);
        this.editMode = false;
    }
    changeToEditMode() {
        this.tilesBak = JSON.parse(JSON.stringify(this.tiles));
        this.selectedBak = JSON.parse(JSON.stringify(this.selected));
        this.editMode = true;
    }
    changeToNormalMode() {
        this.set('tiles', this.tilesBak);
        this.set('selected', this.selectedBak);
        this.editMode = false;
    }
    closeEditor() {
        ipcRenderer.send('close-App');
    }

    // Navigation
    goTo(aNewTile) {
        this.set('tiles.' + this.selected[1] + '.' + this.selected[0] + '.selected', false);
        this.set('tiles.' + aNewTile[1] + '.' + aNewTile[0] + '.selected', true);

        this.selected = aNewTile;
    }
    moveTo(aNewTile) {
        let x = this.selected[0], y = this.selected[1];
        let tile = this.tiles[y][x];
        tile.container = aNewTile[1];
        this.splice('tiles.' + aNewTile[1], aNewTile[0], 0, tile);
        //remove from old
        this.splice('tiles.' + y, x, 1);
        this.selected = aNewTile;
    }
    moveToRight(aNewTile) {
        let x = this.selected[0], y = this.selected[1];
        let tile = this.tiles[y][x];
        tile.container = aNewTile[1];
        this.splice('tiles.' + aNewTile[1], aNewTile[0] + 1, 0, tile);
        //remove from old
        this.splice('tiles.' + y, x, 1);
        this.selected = aNewTile;
    }
    moveToLeft(aNewTile) {
        let x = this.selected[0], y = this.selected[1];
        let tile = this.tiles[y][x - 1];
        tile.container = aNewTile[1];
        this.splice('tiles.' + aNewTile[1], aNewTile[0] + 2, 0, tile);
        //remove from old
        this.splice('tiles.' + y, x - 1, 1);
        this.selected = aNewTile;
    }

    _moveLeft() {
        let x = this.selected[0], y = this.selected[1];
        if(y > -1 && x > 0) {
            this.moveToLeft([x - 1, y]);
        } else if(x === 0) {
            this.openTileSettings();
        }
    }
    _moveRight() {
        let x = this.selected[0], y = this.selected[1];
        if(y > -1 && (this.tiles[y].length - 1) > x) {
            this.moveToRight([x + 1, y]);
        }
    }
    _moveTop() {
        let x = this.selected[0], y = this.selected[1];
        if(y > 0) {
            y = y - 1;
            if(this.tiles[y].length === 0) x = 0;
            else if (this.tiles[y].length - 1 < x && x > 0) x = this.tiles[y].length;
        } else {
            //add new container
            this.splice('tiles', 0, 0, []);
            // update selected 
            this.selected[1] = this.selected[1] + 1;
            y = 0;
            x = 0;
        }
        this.moveTo([x, y]);
    }
    _moveDown() {
        let x = this.selected[0], y = this.selected[1];
        if((this.tiles.length - 2) > y) {
            y = y + 1;
            if(this.tiles[y].length === 0) x = 0;
            else if (this.tiles[y].length - 1 < x && x > 0) x = this.tiles[y].length; 
        } else {
            y = y + 1;
            this.splice('tiles', y, 0, []);
            x = 0;
        }
        this.moveTo([x, y]);
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
        }
    }
    _navDown() {
        let x = this.selected[0], y = this.selected[1];
        if((this.tiles.length - 2) > y) {
            y = y + 1;
            if (this.tiles[y].length - 1 < x) x = this.tiles[y].length - 1;
            this.goTo([x, y]);
        }
    }


    selectMenu() {
        let x = this.selected[0], y = this.selected[1];
        let item = this.shadowRoot.querySelector('#tileSettings > .selected');
        switch (item.innerHTML) {
            case 'Remove':
                this.splice('tiles.' + y, x, 1);
                this.closeTileSettings();
                for(let i = 0; i < this.tiles.length; i++) {
                    if(this.tiles[i].length > 0) {
                        this.selected = [0, i];
                        this.set('tiles.' + i + '.0.selected', true);
                        this.saveTiles();
                        break;
                    }                    
                }
            break;
        }
    }
    _navMenuLeft() {
        return null;
    }
    _navMenuTop() {
        let items = this.shadowRoot.querySelector('#tileSettings').querySelectorAll('ui-menu-item');
        items.forEach((item, i) => {
            if(item.classList.contains('selected') && i > 0) {
                items[i-1].classList.add('selected');
                items[i].classList.remove('selected');
            }
        });
    }
    _navMenuDown() {
        let items = this.shadowRoot.querySelector('#tileSettings').querySelectorAll('ui-menu-item');
        items.forEach((item, i) => {
            if(item.classList.contains('selected') && i < items.length - 1) {
                items[i+1].classList.add('selected');
                items[i].classList.remove('selected');
            }
        });
    }

    openTileSettings() {
        this.openMenu = true;
        this.shadowRoot.querySelector('#tileSettings').querySelectorAll('ui-menu-item')[0].classList.add('selected');
        this.shadowRoot.querySelector('ui-tile.selected').classList.add('contextMenuOpen');
    }
    closeTileSettings() {
        this.openMenu = false;
        this.shadowRoot.querySelector('ui-tile.selected').classList.remove('contextMenuOpen');
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
    
}

window.customElements.define(tileEditor.is, tileEditor);