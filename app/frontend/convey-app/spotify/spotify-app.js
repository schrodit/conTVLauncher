const {ipcRenderer} = require('electron');
class spotifyApp extends Polymer.Element {
    static get is() { return 'spotify-app'; }

    static get properties() {
        return {
            track: {
                type: Array,
                notify: true,
                value: {
                    name: 'Title',
                    album: {
                        name: 'Album',
                        covers: [
                            ''
                        ]
                    },
                    artists: [
                        {
                            name: 'Artist'
                        }
                    ]
                }
            },
            cover: {
                type: String,
                value: 'img/Spotify_Icon_RGB_White.png'
            }
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

        //check if track is already loaded
        ipcRenderer.send('spotify-get-track', (event, arg) => {
            if(Object.keys(arg).length === 0 && arg.constructor === Object) {
                this.track = arg;
                this.setCover();
                this.open = true;
            }
        });
    
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