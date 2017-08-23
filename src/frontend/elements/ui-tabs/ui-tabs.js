class uiTabs extends Polymer.Element {
    static get is() { return 'ui-tabs'; }
    static get properties() {
        return {
            selected: {
                type: Number,
                notify: true
            }
        };
    }

    ready() {
        super.ready();
        //this._registerClickEvent();
        this.changeSelected(this.selected);
    }

    changeSelected(newSelected) {
        let children = this.children;
        children[this.selected].selected = false;
        this.selected = newSelected;
        children[this.selected].selected = true;
    }

    _onClick(e) {
        if(e.target != this.children[this.selected]) {
            this.changeSelected(Array.prototype.slice.call(this.children).findIndex(element => {
                return element === e.target;
            }));
        }
    }
}

window.customElements.define(uiTabs.is, uiTabs);