class uiScreensaver extends Polymer.Element {
    static get is() { return 'ui-screensaver'; }
    static get properties() {
        return {
            src: {
                type: String,
                value: 'img/DefaultTile.png',
                observer: '_onSrc'
            },
            open: {
                type: Boolean,
                value: false,
                observer: '_onOpen'
            },
            random: {
                type: Boolean,
                value: false
            }
        };
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

    startRandom() {
        this.randomInterval = setInterval(() => {
            let r = Math.floor((Math.random() * 700) + 1);
            let url = 'http://tv.convey.tk/img/' + r + '.jpg';
            this.style.backgroundImage = 'url("' + url + '")';
        }, 5000);
    }
}

window.customElements.define(uiScreensaver.is, uiScreensaver);