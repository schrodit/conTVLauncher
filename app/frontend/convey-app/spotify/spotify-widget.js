
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
        const spotify_imgurl = 'https://i.scdn.co/image/';
        let covers = this.track.album.cover;
        this.cover = spotify_imgurl + covers[0];
    }

    getTitle() {
        return this.track.name;
    }
    getAlbum() {
        return this.track.album.name;
    }
    getArtist() {
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