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
            position: {
                type: Number,
                value: 0
            },
            status: {
                type: String,
                value: '',
                observer: '_onStatus'
            },
            screensaverOpen: {
                type: Boolean,
                value: false
            }
        };
    }

    constructor() {
        super();
        //register electron events
        ipcRenderer.on('spotify-new-track', (event, arg) => {
            this.track = arg;
            this.setCover();
            this.screensaverOpen = false;
            this.stopScreensaverTimeout();
        });
        ipcRenderer.on('spotify-new-status', (event, arg) => {
            this.status = arg.status;
            this.position = arg.position;
            if(this.status !== 'stop') this.screensaverOpen = false;
            this.stopScreensaverTimeout();
        });

        //check if track is already loaded
        ipcRenderer.send('spotify-get-track');
    
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.status === '') this.screensaverOpen = true;
    }

    setCover() {
        if (this.track.album === void 0 || this.track.album.images === void 0) return 'img/Spotify_Icon_RGB_White.png';
        //const spotifyImgUrl = 'https://i.scdn.co/image/';
        let covers = this.track.album.images;
        this.cover = covers[0].url;
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

    _onStatus() {
        switch(this.status) {
            case 'play':
                this.startProgress();
                break;
            case 'pause':
                clearInterval(this.progressInterval);
                this.startScreensaverTimeout();
                break;
            case 'stop':
                this.screensaverOpen = true;
                break;
        }
    }

    startProgress() {
        clearInterval(this.progressInterval);
        this.progressInterval = setInterval(() => {
            this.position = this.position + 500;
        }, 500);
    }

    startScreensaverTimeout() {
        this.screensaverTimer = setTimeout(() => {
            this.screensaverOpen = true;
        }, 1000 * 60 * 3);
    }
    stopScreensaverTimeout() {
        clearTimeout(this.screensaverTimer);
    }
    
}

window.customElements.define(spotifyApp.is, spotifyApp);