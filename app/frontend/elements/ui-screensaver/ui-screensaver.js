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
            }
        };
    }

    _onSrc(){
        this.style.backgroundImage = 'url("' + this.src + '")';
    }
    _onOpen() {
        if(this.open) this.classList.add('open');
        else this.classList.remove('open');
    }
}

window.customElements.define(uiScreensaver.is, uiScreensaver);