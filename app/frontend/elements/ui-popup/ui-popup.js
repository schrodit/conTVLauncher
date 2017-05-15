class uiPopup extends Polymer.Element {
    constructor() {
        super();
        document.addEventListener('openPopup', e => this.onOpen(e) );
        if (this.stick) this.classList.add('sticky');
    }

    set parentElement(parent) { this._parentElement = parent; }
    get parentElement() {
        return this._parentElement;
    }

    static get is() { return 'ui-popup'; }
    static get properties() {
        return {
            stick: {
                type: Boolean,
                value: false
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        //this.adjustTriangle();
        this.addEventListener('transitionend', () => {
            this.style.transition = 'none';
        });
    }

    onOpen(e) {
        if(e.detail.popupId === this.id) {
            this.parentElement = e.detail.target;
            this.style.transition = 'all 1s ease-out';
            this.classList.add('open');
            this.setPosition(this.parentElement);
            this.setBackdrop();
            document.addEventListener('closePopup', () => this.onClose() );
            window.addEventListener('resize', () => this.setPosition(this.parentElement) );
        }
    }

    setPosition(target) {
        let targetRect = target.getBoundingClientRect();

        // check window size
        let popupRect = this.getBoundingClientRect();
        if (popupRect.bottom > window.innerHeight) this.style.top = (window.innerHeight - popupRect.height) + 'px';
        else this.style.top = targetRect.top + 'px';
        if (popupRect.right > window.innerWidth) this.style.left = (window.innerWidth - popupRect.width) + 'px';
        else this.style.left = targetRect.left + 'px';        
    }

    setBackdrop() {
        let backdrop = document.createElement('DIV');
        backdrop.id = this.id + 'Backdrop';
        backdrop.style.position = 'absolute';
        backdrop.style.width = '100%';
        backdrop.style.height = '100%';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style['z-index'] = '400';
        backdrop.addEventListener('mousedown', e => this.onClick(e) );
        document.body.appendChild(backdrop);
    }

    onClose() {
        this.style.transition = '1s ease-out';
        this.classList.remove('open');
        document.body.removeChild(document.getElementById(this.id + 'Backdrop'));
        document.removeEventListener('closePopup', () => this.onClose() );
        window.removeEventListener('resize', () => this.setPosition(this.parentElement) );
    }

    onClick(e) {
        if(!this._insideElement(e, this.parentNode.host) || !this._insideElement(e, this)) this.onClose();
    }

    _insideElement(event, parent) {
        let rect = parent.getBoundingClientRect();

        var between = (a, b, c) => {
            return (b > a && b < c);
        };

        return (between(rect.top, event.clientY, rect.bottom) && between(rect.left, event.clientX, rect.right));
    }


}

window.customElements.define(uiPopup.is, uiPopup);