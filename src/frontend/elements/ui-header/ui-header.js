class uiHeader extends Polymer.Element {
    static get is() { return 'ui-header'; }
    static get properties() {
        return {
            title: {
                type: String,
                notify: true
            },
            openMenu: {
                type: Boolean,
                notify: true
            }
        };
    }

    onOpenMenu(e) {
        document.dispatchEvent(new CustomEvent('openPopup', { detail: {popupId: 'headerMenuPopup', target: e.target}, composed: true }));
    }
}

window.customElements.define(uiHeader.is, uiHeader);