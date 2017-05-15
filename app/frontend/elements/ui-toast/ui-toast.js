class uiToast extends Polymer.Element {
    constructor() {
        super();
        this.toggleOpen();
    }
    static get is() { return 'ui-toast'; }
    static get properties() {
        return {
            open: {
                type: Boolean,
                notify: true,
                observer: '_open'
            },
            stick: {
                type: Boolean,
                value: false
            },
            type: {
                type: String,
                value: 'initial',
                notify: true
            },
            icon: {
                type: String,
                notify: true
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.adjustTriangle();
        if (this.stick) this.classList.add('sticky');
        this.addEventListener('transitionend', () => {
            this.style.transition = 'none';
        });
    }

    _open() {
        this.toggleOpen();
    }

    toggleOpen() {
        this.style.transition = '1s ease-out';
        if(this.open) {
            this.adjustTriangle();
            this.classList.add('open');
            if (!this.stick) this.timeoutClose();
        }
        else this.classList.remove('open');
    }

    onClose() {
        this.open = false;
    }

    setIcon(type) {
        if(this.icon) return this.icon;
        switch(type) {
            case 'done' : {
                return 'icons:done';
            }
            case 'error' : {
                return 'icons:error';
            }
            case 'info' : {
                return 'icons:error';
            }
            default: {
                return 'icons:info-outline';
            }
        }
    }

    adjustTriangle() {
        let height = this.getBoundingClientRect().height;
        this.style.left = 'calc(-45vw - ' + height + 'px)';
        this.shadowRoot.querySelector('.triangle').style['border-width'] = height + 'px ' + height + 'px 0 0';
    }

    timeoutClose() {
        setTimeout( () => this.set('open',  false), 3000);
    }

}

window.customElements.define(uiToast.is, uiToast);