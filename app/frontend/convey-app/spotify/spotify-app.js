const {ipcRenderer} = require('electron');
class spotifyApp extends Polymer.Element {
    static get is() { return 'spotify-app'; }

    static get properties() {
        return {
            track: {
                type: Array,
                notify: true,
            },
            cover: {
                type: String,
                value: 'img/Spotify_Icon_RGB_White.png'
            },
            status: {
                type: String,
                value: ''
            }
        };
    }

    constructor() {
        super();
        //register electron events
        ipcRenderer.on('spotify-new-track', (event, arg) => {
            this.track = arg;
            this.setCover();
        });
        ipcRenderer.on('spotify-new-status', (event, arg) => {
            console.log(arg);
            this.status = arg.status;
        });

        //check if track is already loaded
        ipcRenderer.send('spotify-get-track');
    
    }

    setCover() {
        if (this.track.album === void 0 || this.track.album.cover === void 0) return 'img/Spotify_Icon_RGB_White.png';
        const spotifyImgUrl = 'https://i.scdn.co/image/';
        let covers = this.track.album.cover;
        this.cover = spotifyImgUrl + covers[0];
    }

    getTitle() {
        if(Object.keys(this.track).length === 0 && this.track.constructor === Object) return 'Title';
        return this.track.name;
    }
    getAlbum() {
        if (this.track.album === void 0) return 'Album';
        return this.track.album.name | 'Album';
    }
    getArtist() {
        if (this.track.artists === void 0) return 'Artist';
        let artists = '';
        this.track.artists.forEach( (artist) => {
            artists += ', ' + artist.name;
        });
        return artists.substr(1);
    }
    getStatus() {
        switch(this.status) {
            case 'play':
                return 'av:play-circle-outline';
            case 'pause':
                return 'av:pause-circle-outline';
            default:
             return 'av:queue-music';
        }
    }
    
}

window.customElements.define(spotifyApp.is, spotifyApp);