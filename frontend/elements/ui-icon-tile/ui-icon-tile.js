class uiIconTile extends Polymer.Element {
    static get is() { return 'ui-icon-tile'; }
    static get properties() {
        return {
            title: {
                type: String,
                notify: true
            },
            icon: {
                type: String,
                value: 'icons:close'
            },
            selected: {
                type: Boolean,
                notify: true,
                observer: 'onSelected'
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        if(this.icon === undefined || this.icon === '') this.icon = 'icons:close';
    }

    onSelected() {
        this.selected ? this.classList.add('selected') : this.classList.remove('selected');
        if(this.selected) this.onScrollY(this);
    }

    onScrollY(elem) {
        let elemTop = elem.getBoundingClientRect().bottom;
        let scrollHeight = document.body.offsetHeight / 2;

        let scroll = elemTop - scrollHeight;

        if(scroll > 0) window.scrollTo(0, scroll);
    }
}

window.customElements.define(uiIconTile.is, uiIconTile);