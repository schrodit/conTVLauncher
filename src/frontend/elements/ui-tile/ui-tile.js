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
            },
            editMode: {
                type: Boolean,
                observer: 'onEditMode'
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        if(this.src === undefined || this.src === '') this.src = 'img/DefaultTile.png';
    }

    onSelected() {
        this.selected ? this.classList.add('selected') : this.classList.remove('selected');
        if(this.selected) {
            this.onScrollY(this);
            this.onScrollX(this);
            if(this.editMode) this.classList.remove('edited');
        } else if(this.editMode) this.classList.add('edited');
    }
    onEditMode() {
        if(!this.editMode) this.classList.remove('edited');
        else if(!this.selected) this.classList.add('edited');
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

    showTitle() {
        return this.src === 'img/DefaultTile.png' ? true : false;
    }
}

window.customElements.define(uiTile.is, uiTile);