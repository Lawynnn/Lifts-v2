const Options = {
    loaderClass: "#in_load",
    textClass: null
}

class _LoadingScreen {
    constructor(steps) {
        this.one_step_length = 100 / steps;
        this.elem_length = 0;
        this.elements = new Map();
        this.elements.set("loadingScreen", $(".loading-screen"));
        this.elements.set("loader", $(".loader"));
        this.elements.set("innerLoader", $(".inner-loader"));
        this.elements.set("image", $("#loading-img"));
    }

    addStep() {
        this.elem_length += this.one_step_length;
        this.elements.get("innerLoader").css("width", `${this.elem_length}%`);
        if(this.elem_length >= 100) this.remove();
    }

    remove() {
        this.elements.get("loadingScreen").animate({opacity: 0}, 200, () => {
            this.elements.get("loadingScreen").remove();
        })
    }
}

class LoadingScreenEvents {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.triggerdLabels = new Map();
    }

    _fCheckPast(label, callback) {
        if (this.triggerdLabels.has(label)) {
            callback(this.triggerdLabels.get(label));
            return true;
        } else {
            return false;
        }
    }

    on(label, callback, checkPast = false) {
        this.listeners.has(label) || this.listeners.set(label, []);
        this.listeners.get(label).push(callback);
        if (checkPast)
            this._fCheckPast(label, callback);
    }

    once(label, callback, checkPast = false) {
        this.onceListeners.has(label) || this.onceListeners.set(label, []);
        if (!(checkPast && this._fCheckPast(label, callback))) {
            this.onceListeners.get(label).push(callback);
        }
    }

    off(label, callback = true) {
        if (callback === true) {
            this.listeners.delete(label);
            this.onceListeners.delete(label);
        } else {
            let _off = (inListener) => {
                let listeners = inListener.get(label);
                if (listeners) {
                    inListener.set(label, listeners.filter((value) => !(value === callback)));
                }
            };
            _off(this.listeners);
            _off(this.onceListeners);
        }   
    }

    trigger(label, ...args) {
        let res = false;
        this.triggerdLabels.set(label, ...args); 
        let _trigger = (inListener, label, ...args) => {
            let listeners = inListener.get(label);
            if (listeners && listeners.length) {
                listeners.forEach((listener) => {
                    listener(...args);
                });
                res = true;
            }
        };
        _trigger(this.onceListeners, label, ...args);
        _trigger(this.listeners, label, ...args);
        this.onceListeners.delete(label);
        return res;
    }
}

class LoadingScreen extends LoadingScreenEvents {
    constructor(options = Options) {
        super();
        this.loader = $(options.loaderClass);
        if(!this.loader) return console.error(`Cant find ${options.loaderClass}`);
    }

    async addStep(width = 10, content = "") {
        this.loader.width(`${this.loader.width() + width}%`);

        this.trigger('step');
        if(this.loader.width() >= 99) {
            this.trigger('load');
        }
        return this;
    }

    remove() {
        $('.loading-screen').animate({opacity: 0}, 200, () => {
            $('.loading-screen').remove();
        })
    }


}
