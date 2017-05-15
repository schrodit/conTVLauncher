class uiTextarea extends Polymer.Element {
    static get is() { return 'ui-textarea'; }
    static get properties() {
        return {
            text: {
                type: String,
                notify: true
            },
            rows: {
                type: Number,
                value: 5
            }
        };
    }

}

window.customElements.define(uiTextarea.is, uiTextarea);