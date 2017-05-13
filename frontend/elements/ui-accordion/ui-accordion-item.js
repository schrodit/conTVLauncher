class uiAccordionItem extends Polymer.Element {
    constructor() {
        super();
    }

    static get is() { return 'ui-accordion-item'; }
    static get properties() {
        return {
            title: {
                type: String,
                notify: true
            },
            type: {
                type: String,
                value: ""
            },
            showExpand: {
                type: Boolean,
                value: false
            },
            expand: {
                type: Boolean,
                value: false
            }
        };
    }

    toggleNewItem() {
        document.dispatchEvent(new CustomEvent('openDialog', { detail: {dialogId: 'newChannelDialog-' + this.title, parentElement: this}, composed: true }));
    }

    showExpandMoreIcon(expand) {
        return (this.showExpand && !expand);
    }
    showExpandLessIcon(expand) {
        return (this.showExpand && expand);
    }

    getChildrenClasses(expand) {
        let classes = 'children ' + (expand ? '' : 'closed');
        return classes;
    }

    toggle() {
        this.expand = !this.expand;
    }

    openContext() {
        this.contextOpen = true;
    }

    onDblClick() {
        this.toggle();
    }

}

window.customElements.define(uiAccordionItem.is, uiAccordionItem);