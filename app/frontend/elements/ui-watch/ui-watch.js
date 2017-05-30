class uiWatch extends Polymer.Element {
    static get is() { return 'ui-watch'; }
    static get properties() {
        return {
            time: {
                type: String,
                value: '00:00'
            },
            seconds: String
        };
    }

    connectedCallback() {
        super.connectedCallback();
        let date = new Date();
        this.time = date.getHours() + ":" + date.getMinutes();
        this.seconds = date.getSeconds();
        setInterval(() => {
            let date = new Date();
            this.time = (date.getHours() < 10 ? "0" + date.getHours() : date.getHours().toString()) + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes().toString());
            this.seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds().toString(); 
        }, 1000);
    }
}

window.customElements.define(uiWatch.is, uiWatch);