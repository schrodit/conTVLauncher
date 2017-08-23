const {ipcRenderer} = require('electron');

class uiScreensaver extends Polymer.Element {
    static get is() { return 'ui-screensaver'; }
    static get properties() {
        return {
            src: {
                type: String,
                value: 'img/screenSaverDefault.jpg',
                observer: '_onSrc'
            },
            watch: {
                type: Boolean,
                value: false
            },
            open: {
                type: Boolean,
                value: false,
                observer: '_onOpen'
            },
            random: {
                type: Boolean,
                value: false
            },
            closable: {
                type: Boolean,
                value: false
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        if(this.closable) {
            window.addEventListener('keydown', (event) => {
                if(event.keyCode === 27) ipcRenderer.send('close-screensaver');
            });
        }
    }

    _onSrc(){
        this.style.backgroundImage = 'url("' + this.src + '")';
    }
    _onOpen() {
        if(this.open) {
            this.classList.add('open');
            if(this.random) this.startRandom();
        } else {
            this.classList.remove('open');
            if(this.random) clearInterval(this.randomInterval);
        }
    }

    preload() {
        let r = Math.floor((Math.random() * 700) + 1);
        this.preUrl = 'http://tv.convey.tk/img/' + r + '.jpg';
        this.shadowRoot.getElementById('preload').style.backgroundImage = 'url("' + this.preUrl + '")';
    }
    startRandom() {
        this.preload();
        this.randomInterval = setInterval(() => {
            this.style.backgroundImage = 'url("' + this.preUrl + '")';
            this.preload();
        }, 10000);
    }
}

window.customElements.define(uiScreensaver.is, uiScreensaver);