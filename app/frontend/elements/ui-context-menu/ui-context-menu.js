class uiContextMenu extends Polymer.Element {
    constructor() {
        super();
        document.addEventListener('contextmenu', e => this._onContextMenu(e) );
    }
    static get is() { return 'ui-context-menu'; }
    static get properties() {
        return {
            open: {
                type: Boolean,
                value: false
            }
        };
    }

    _onContextMenu(e) {
        if(this._insideElement(e, this.parentNode.host)) this._onOpen(e);
        else this._onClose(e);
    }

    _onClick(e) {
        if(!this._insideElement(e, this.shadowRoot.querySelector('.menu'))) this._onClose();
    }

    getMenuClass(open) {
        return 'menu ' + (open ? 'open' : '');
    }

    setClass (status) {
        return 'icon statusIcon ' + status;
    }

    _onOpen(e) {
        e.preventDefault();
        let menu = this.shadowRoot.querySelector('.menu');
        menu.style.top = e.clientY + 'px';
        menu.style.left = e.clientX + 'px';
        this.open = true;
        this.setClass('open');
        document.addEventListener('mousedown', e => this._onClick(e) );
        document.addEventListener('closeContextMenu', () => this._onClose() );
    }

    _onClose() {
        this.open = false;
    }

    _insideElement(event, parent) {
        let rect = parent.getBoundingClientRect();

        var between = (a, b, c) => {
            return (b > a && b < c);
        };

        return (between(rect.top, event.clientY, rect.bottom) && between(rect.left, event.clientX, rect.right));
    }

}

window.customElements.define(uiContextMenu.is, uiContextMenu);