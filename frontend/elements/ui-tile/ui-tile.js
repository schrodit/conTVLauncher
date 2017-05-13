class uiTile extends Polymer.Element {
    static get is() { return 'ui-tile'; }
    static get properties() {
        return {
            title: {
                type: String,
                notify: true
            },
            src: {
                type: String,
                value: 'img/DefaultTile.png'
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
        if(this.src === undefined || this.src === '') this.src = 'img/DefaultTile.png';
    }

    onSelected() {
        this.selected ? this.classList.add('selected') : this.classList.remove('selected');
        if(this.selected) this.onScrollY(this);
    }
    onScrollY(elem) {
        let elemTop = elem.getBoundingClientRect().top;
        let scrollHeight = document.body.offsetHeight / 2;

        let scroll = elemTop - scrollHeight;

        if(scroll > 0) window.scrollTo(0, scroll);
        else window.scrollTo(0, 0);
    }
}

window.customElements.define(uiTile.is, uiTile);