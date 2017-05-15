class uiTextEditor extends Polymer.Element {
    static get is() { return 'ui-text-editor'; }
    static get properties() {
        return {
            active: {
                type: Object,
                notify: true
            }
        };
    }

}

window.customElements.define(uiTextEditor.is, uiTextEditor);