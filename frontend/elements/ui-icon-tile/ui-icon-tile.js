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
        if(this.selected) {
            this.onScrollY(this);
            this.onScrollX(this);
        }
    }

    onScrollY(elem) {
        Element.prototype.documentOffsetTop = function () {
            return this.offsetTop + ( this.offsetParent ? this.offsetParent.documentOffsetTop() : 0 );
        };

        var top = elem.documentOffsetTop() - ( window.screenY / 2 );
        window.scrollTo( window.scrollX, top );
    }
    onScrollX(elem) {
        Element.prototype.documentOffsetLeft = function () {
            return this.offsetLeft + ( this.offsetParent ? this.offsetParent.documentOffsetLeft() : 0 );
        };

        var left = elem.documentOffsetLeft() - ( window.screenX / 2 );
        window.scrollTo( left, window.scrollY );
    }
}

window.customElements.define(uiIconTile.is, uiIconTile);