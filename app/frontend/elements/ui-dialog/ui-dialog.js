class uiDialog extends Polymer.Element {
    constructor() {
        super();
        document.addEventListener('openDialog', e => this.onOpen(e) );
    }

    static get is() { return 'ui-dialog'; }
    static get properties() {
        return {
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('transitionend', () => {
            this.style.transition = 'none';
        });
    }

    onOpen(e) {
        if(e.detail.dialogId === this.id && !this.classList.contains('open')) {
            this.style.transition = '1s ease-out';
            this.classList.add('open');
            this.closeOpen();
            this.setPosition();
            this.setBackdrop();
            document.addEventListener('closeDialog', () => this.onClose() );
            window.addEventListener('resize', () => this.setPosition() );
        }
    }

    setBackdrop() {
        let backdrop = document.createElement('DIV');
        backdrop.id = this.id + 'Backdrop';
        backdrop.style.position = 'absolute';
        backdrop.style.width = '100%';
        backdrop.style.height = '100%';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style['z-index'] = '100';
        backdrop.style.background = 'rgba(0,0,0,0.38)';
        backdrop.addEventListener('mousedown', e => this.onClick(e) );
        document.body.appendChild(backdrop);
    }

    onClose() {
        this.style.transition = '1s ease-out';
        this.classList.remove('open');
        document.body.removeChild(document.getElementById(this.id + 'Backdrop'));
        document.removeEventListener('closePopup', () => this.onClose() );
        window.removeEventListener('resize', () => this.setPosition() );
    }

    closeOpen() {
        document.dispatchEvent(new CustomEvent('closeContextMenu', {composed: true}));
        document.dispatchEvent(new CustomEvent('closePopup', {composed: true}));
    }

    setPosition() {
        let dialogRect = this.getBoundingClientRect();
        if (dialogRect.height > window.innerHeight) this.style.top = '0';
        else this.style.top = ( window.innerHeight - dialogRect.height ) / 2 + 'px';
        if (dialogRect.width > window.innerWidth) this.style.left = '0';
        else this.style.left = ( window.innerWidth - dialogRect.width ) / 2 + 'px';        
    }

    onClick(e) {
        if(!this._insideElement(e, this)) this.onClose();
    }

    _insideElement(event, parent) {
        let rect = parent.getBoundingClientRect();

        var between = (a, b, c) => {
            return (b > a && b < c);
        };

        return (between(rect.top, event.clientY, rect.bottom) && between(rect.left, event.clientX, rect.right));
    }


}

window.customElements.define(uiDialog.is, uiDialog);