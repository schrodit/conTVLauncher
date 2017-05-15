class uiMenu extends Polymer.Element {
    constructor() {
        super();
    }
    static get is() { return 'ui-menu'; }
    static get properties() {
        return {
        };
    }

}

window.customElements.define(uiMenu.is, uiMenu);