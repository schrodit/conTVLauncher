class uiMenuItem extends Polymer.Element {
    constructor() {
        super();
    }
    static get is() { return 'ui-menu-item'; }
    static get properties() {
        return {
            item: {
                type: Object,
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
    }

    setIconClass(icon) {
        return 'icon ' + (icon !== undefined ? 'show' : 'hide');
    }

}

window.customElements.define(uiMenuItem.is, uiMenuItem);