
class spotifyWidget extends Polymer.Element {
    static get is() { return 'spotify-widget'; }

    static get properties() {
        return {
            track: {
                type: Array,
                notify: true
            },
            cover: String,
            selected: {
                type: Boolean,
                value: false,
                observer: '_onSelect'
            },
            disabled: {
                type: Boolean,
                value: false
            },
            open: {
                type: Boolean,
                value: false
            }
        };
    }

    constructor() {
        super();
        //register electron events
        ipcRenderer.on('spotify-new-track', (event, arg) => {
            if (!this.disabled) {
                this.track = arg;
                this.setCover();
                this.open = true;
            }
        });
        ipcRenderer.on('spotify-new-status', (event, arg) => {
            if(arg.status === 'stop') this.open = false;
        });
        ipcRenderer.on('spotify-close', () => {
            this.open = false;
        });
        ipcRenderer.on('spotify-toggle-disabled', () => {
            this.disabled = !this.disabled;
        });
    
    }

    openMenu() {
        ipcRenderer.send('spotify-open-menu');
    }

    setCover() {
        if (this.track.album === void 0 || this.track.album.images === void 0) return 'img/Spotify_Icon_RGB_White.png';
        //const spotifyImgUrl = 'https://i.scdn.co/image/';
        let covers = this.track.album.images;
        this.cover = covers[1].url;
    }

    getTitle() {
        if(Object.keys(this.track).length === 0 && this.track.constructor === Object) return 'Title';
        return this.track.name;
    }
    getAlbum() {
        if (this.track.album === void 0) return 'Album';
        return this.track.album.name;
    }
    getArtist() {
        if (this.track.artists === void 0) return 'Artist';
        let artists = '';
        this.track.artists.forEach( (artist) => {
            artists += ', ' + artist.name;
        });
        return artists.substr(1);
    }

    _onSelect() {
        if(this.selected) {
            this.classList.add('selected');
            window.scrollTo( window.scrollX, 0 );
        } else this.classList.remove('selected');
    }
    
}

window.customElements.define(spotifyWidget.is, spotifyWidget);