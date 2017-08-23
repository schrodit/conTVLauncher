class uiChat extends Polymer.Element {
    static get is() { return 'ui-chat'; }
    static get properties() {
        return {
            channel: {
                type: Object,
                notify: true
            },
            chat: {
                type: Object,
                notify: true
            },
        };
    }

}

window.customElements.define(uiChat.is, uiChat);