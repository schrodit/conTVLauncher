
class spotifyApp extends Polymer.Element {
    static get is() { return 'spotify-app'; }

    static get properties() {
        return {
            track: {
                type: Array,
                notify: true
            },
            cover: String
        };
    }

    constructor() {
        super();
        //register electron events
        ipcRenderer.on('spotify-new-track', (event, arg) => {
            this.track = arg;
            this.setCover();
            this.open = true;
        });
        ipcRenderer.on('spotify-close', () => {
            this.open = false;
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
    
}

window.customElements.define(spotifyApp.is, spotifyApp);