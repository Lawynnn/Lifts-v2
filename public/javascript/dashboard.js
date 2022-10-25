


const closeModal = () => {
    let body = $(".modal-body");
    let container = $(".modal-container");

    body.animate({opacity: 0}, 200, () => {
        body.remove();
        // body.hide();
    })
    
}

const openModal = () => {
    $("body").html($("body").html() + `<div class="modal modal-body">
        <div class="modal modal-container">
            <div class="modal modal-close">
                <button onClick="closeModal()"><i class='bx bx-x'></i></button>
            </div>
            <div class="modal modal-header">
                <h4>Add a new bot</h4>
                <span>You cant add more than five bots without premium, so buy premium.</span>
            </div>
            <div class="modal modal-content">
                <div class="modal modal-tutorial">
                    <a href="https://discord.com/developers" target="_blank" rel="noopener noreferrer">
                        <div class="modal modal-link-header">
                            <i class='bx bxl-discord-alt'></i>
                            <span>Discord Developers Portal</span>
                        </div>
                        <div class="modal modal-link-footer">
                            <i class='bx bxs-chevron-right' ></i>
                        </div>
                    </a>
                    <a href="https://discord.com/terms" target="_blank" rel="noopener noreferrer">
                        <div class="modal modal-link-header">
                            <i class='bx bxs-book-alt' ></i>
                            <span>Discord Terms</span>
                        </div>
                        <div class="modal modal-link-footer">
                            <i class='bx bxs-chevron-right' ></i>
                        </div>
                    </a>
                    <a href="https://discord.com/guidelines" target="_blank" rel="noopener noreferrer">
                        <div class="modal modal-link-header">
                            <i class='bx bxs-info-circle' ></i>
                            <span>Discord Guidelines</span>
                        </div>
                        <div class="modal modal-link-footer">
                            <i class='bx bxs-chevron-right' ></i>
                        </div>
                    </a>
                    
                </div>
                <label id="error-store" style="color: #ff7272;font-size: 14px;padding: 5px;"></label>
                <div class="modal modal-input">
                    <input id="token" type="password" name="token" placeholder="Your bot token">
                    <i id="bot-loader" class='bx bx-loader-alt bx-spin' ></i>
                </div>
                
            </div>
            <div class="modal modal-footer">
                <button onclick="submitBot()">Add your bot</button>
            </div>
        </div>
    </div>`);
    let body = $('.modal-body');
    let modal_container = $('.modal-container');
    let canExit = true;
    modal_container.mouseenter(() => {
        canExit = false;
    })

    modal_container.mouseleave(() => {
        canExit = true;
    })

    body.mousedown(() => {
        if(!canExit) return;
        closeModal();
    })
    body.hide();
    body.css("opacity", 0);
    body.show();
    body.animate({opacity: 1}, 200);

    $(".modal-input input").focus(() => {
        let modal_input = $(".modal-input");
        modal_input.css("border", "1px solid rgba(255, 255, 255, .15)");
    })
    $(".modal-input input").blur(() => {
        let modal_input = $(".modal-input");
        modal_input.css("border", "1px solid transparent");
    })
}

const getBots = async () => {
    return $.get("/api/v1/bot", (data) => {
        return data;
    }).fail(err => { return false; })
}

const submitBot = async () => {
    let error = $("#error-store");
    let token = $("#token").val();
    let loader = $("#bot-loader");
    loader.show();
    $.post("/api/v1/bot", {token: token}, (data) => {
        window.location.reload();
    }).fail(e => {
        error.html(e.responseJSON.error.message);
    }).always(() => {
        loader.hide();
    })
}

const hoverCallback = (obj) => {
    let el = $(obj);
    let children = $(el.children()[1]);
    console.log("Current hover ", children.data("for"));
    
}

const createCaptcha = (text) => {
    for(let i = 0; i < text.length; i++) {
        var canvas = document.createElement("canvas");
        canvas.width = 20;
        canvas.height = 30;
        var ctx = canvas.getContext('2d');
        ctx.font = `${Math.floor(Math.random() * (23 - 18 + 1) + 18)}px Georgia`;
        // ctx.fillText(text,10,50);
        let items = ["white", "pink", "red", "green", "yellow"];
        let random = items[Math.floor(Math.random()*items.length)];

        let isStroke = Math.round(Math.random() * 1) === 1 ? true : false;
        if(isStroke) {
            ctx.strokeStyle = random;
            ctx.strokeText(text[i], 0, Math.floor(Math.random() * (25 - 10 + 1) + 10));
        }
        else {
            ctx.fillStyle = random;
            ctx.fillText(text[i], 0, Math.floor(Math.random() * (25 - 10 + 1) + 10));
        }

        ctx.rotate(Math.PI*2/(45*6));
        var img = document.createElement("img");
        img.src=canvas.toDataURL();
        $("#captcha_img").append(img);
    }
}

const showCaptchaHost = (id) => {
    let confirm = new MError(`<div id="captcha_img"></div>
        <div class="captcha_entry">
            <input id="captcha_code" type="text" placeholder="Captcha code">
        </div>
    `, "Redeem captcha code", Type.Info, {cancelButton: true, okayButton: true});
    createCaptcha(id);

    confirm.onSuccess(() => {
        let capCode = $("#captcha_code").val();
        let id = window.localStorage.getItem("activeBot") || null;
        if(!id) {
            return console.log("No bot selected");
        }
        $.post(`/api/v1/bot/${id}/host`, {captchaCode: capCode}, (data) => {
            window.location.reload();
        }).fail((e) => {
            console.log(e);
        })
    })
}

const stopBotHosting = () => {
    let confirm = new MError(`Remember! After this action, you cant get your hosting time back.`, `Are you sure?`, Type.Warning, {cancelButton: true, okayButton: true});
    confirm.onSuccess(() => {
        let id = window.localStorage.getItem("activeBot") || null;
        if(!id) {
            return console.log("No bot selected");
        }
        $.ajax({
            url: `/api/v1/bot/${id}/host`,
            type: "DELETE",
            success: (data) => {
                window.location.reload();
            },
            fail: (e) => console.log(e)
        })
        $.ajax(`/api/v1/bot/${id}/host`, {}, (data) => {
            window.location.reload();
        }).fail(e => console.log(e));
    })
}

window.onload = async () => {
    // new MError("test", "asd", Type.Info);
    let bots = await getBots();
    if(!bots) {
        console.log("no bots");
        return;
    }
    bots = bots.bots;
    const container = $("#bot-list");
    let str = ``;
    bots.map((bot) => {
        str += `
        <div class="bot-container ${window.location.pathname === `/dashboard/${bot._id}` ? "active" && window.localStorage.setItem("activeBot", bot._id) : ""}" onclick="window.location.href = '/dashboard/${bot._id}'" onmouseover="hoverCallback(this)">
            <button data-id="${bot._id}" class="bot">
                <img src="${bot.data.avatar.split("/")[bot.data.avatar.split("/").length - 1] === "null.png" ? "/images/default_avatar.png" : bot.data.avatar}" alt="">
            </button>
            <div class="tooltip" data-for="${bot._id}">
                <h4>${bot.data.username}</h4>
                <span>${bot.online ? "<span style='color: var(--blue);'>Online</span>" : "Offline"}</span>
            </div>
        </div>`;
    })
    container.html(str);

    $("#bot-countdown").html(`${moment(new Date($("#bot-countdown").data("date"))).startOf("second").fromNow()}`);
    setInterval(() => $("#bot-countdown").html(`${moment(new Date($("#bot-countdown").data("date"))).startOf("second").fromNow()}`), 1500);
}