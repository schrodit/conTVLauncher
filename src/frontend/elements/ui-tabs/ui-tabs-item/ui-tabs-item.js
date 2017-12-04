class uiTabsItem extends Polymer.Element {
    constructor() {
        super();
    }
    static get is() { return 'ui-tabs-item'; }
    static get properties() {
        return {
            title: {
                type: String,
                notify: true
            },
            selected: {
                type: Boolean,
                value: false,
                notify: true,
                observer: 'toggleTab'
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('click', e => this.parentNode._onClick(e) );
    }

    toggleTab() {
        this.selected ? this.classList.add('selected') :  this.classList.remove('selected');
    }

    
}

window.customElements.define(uiTabsItem.is, uiTabsItem);