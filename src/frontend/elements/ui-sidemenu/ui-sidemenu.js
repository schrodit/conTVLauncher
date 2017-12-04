class uiSidemenu extends Polymer.Element {
    static get is() { return 'ui-sidemenu'; }
    static get properties() {
        return {
            open: {
                type: Boolean,
                observer: 'onOpen'
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
    }

    onOpen() {
        if(this.open) this.classList.add('open');
        else this.classList.remove('open');
    }

    
}

window.customElements.define(uiSidemenu.is, uiSidemenu);