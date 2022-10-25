function closeError() {
    let bg = $(".mError-background");
    bg.animate({
        opacity: 0
    }, 150, () => {
        bg.remove();
    });
}

const Settings = {
    cancelButton: false,
    okayButton: true,
}

const Type = {
    Error: { 
        code: 4,
        icon: "bx bxs-x-circle",
        color: "#833838",
        background: "#151618"
    },
    Warning: {
        code: 3,
        icon: "bx bxs-error-circle",
        color: "#9d7a2b",
        background: "#151618"
    },
    Info: {
        code: 2,
        icon: "bx bxs-info-circle",
        color: "#757676",
        background: "#151618"
    },
    Success: {
        code: 1,
        icon: "bx bxs-check-circle",
        color: "#31785e",
        background: "#151618"
    }
}

let activeErrors = [];

/**
 * @param {string} content
 * @param {string} title
 * @param {Type} type
 * @param {Settings} settings
 */
class MError {
    constructor(content, title = "", type = Type.Info, settings = Settings) {
        this.content = content;
        this.title = title;
        this.type = type;
        activeErrors.push(this);
        $("body").append(`
        <div class="mError-background" style="opacity: 0;">
            <div class="mError-container" style="background: ${type.background}">
                <div class="mError-header">
                    <h4 style="color: ${type.color}"><i style="color: ${type.color}" class="${type.icon}"></i> ${title}</h4>
                </div>
                <div class="mError-content">
                    <span style="font-size: 14px;">${content}</span>
                </div>
                <div class="mError-footer">
                    ${settings.cancelButton ? '<button id="cancelError" onClick="closeError()">Cancel</button>' : ""}
                    ${settings.okayButton ? '<button id="closeError">Okay</button>' : ""}
                </div>
            </div>
        </div>`)

        let elem = $(".mError-background");
        elem.animate({
            opacity: 1
        }, 150);

        $("#closeError").click(() => {
            closeError();
        })

        return this;
    }

    /**
     * 
     * @param {function} callback 
     */
    async onSuccess(callback) {
        await new Promise((resolve, reject) => {
            $("#closeError").click(() => {
                closeError();
                resolve(this);
            })
        })
        callback();
    }

    hide() {
        let bg = $(".mError-background");
        bg.animate({
            opacity: 0
        }, 150, () => {
            bg.remove();
        });
    }

    setTitle(title) {
        this.title = title;
        $(".mError-background .mError-container .mError-header h4").html(`<i class="fa-solid ${this.type.icon}"></i> ${title}`);
        return this;
    }

    setContent(content) {
        this.content = content;
        $(".mError-background .mError-container .mError-content span").html(`${content}`);
        return this;
    }
}