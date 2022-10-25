function disableLoadingScreen() {
    $('.loading-screen').animate({opacity: 0}, 200, () => {
        $('.loading-screen').hide();
    });
}

async function getBotTime() {
    let id = this.window.location.pathname.split('/');
    id = id[id.length - 1];
    return $.get(`/api/v1/bot/${id}/host`, function( data ) {
        return data;
    }).fail(function() {
        return false;
    });
}

async function getBotCommands() {
    let id = this.window.location.pathname.split('/');
    id = id[id.length - 1];
    return $.get(`/api/v1/bot/${id}/command`, function( data ) {
        return data;
    }).fail(function() {
        return false;
    });
}

function hashToTab(hash) {
    if(hash === "#dashboard") return 0;
    else if(hash === "#commands") return 1;
    else if(hash === "#variables") return 2;
    else if(hash === "#status") return 3;
    return 0;
}

function setTab(tab) {
    $('#e_content').children().each(function(index, value, arr) {
        let elem = $(value)
        if(index === tab) {
            window.location.hash = `#${elem.attr('class')}`;
            elem.show();
            $($('#btn_content').children()[index]).addClass('active');
            window.Bot.tab = index;
        }
        else {
            elem.hide();
            $($('#btn_content').children()[index]).removeClass('active');
        }
    })
}


function copyShareCode(code, el) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(code).select();
    document.execCommand("copy");
    $temp.remove();
    let btn = $(el);
    let backup = btn.html();
    btn.html("<span style='color: green;'>Copied!</span>");
    btn.prop('disabled', true);
    setTimeout(() => {
        btn.html(backup);
        btn.prop('disabled', false);
    }, 1500)
}

function copyID(id, el) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(id).select();
    document.execCommand("copy");
    $temp.remove();
    
    let btn = $(el);
    let backup = btn.html();
    btn.html("<span style='color: green;'>Copied!</span>");
    btn.prop('disabled', true);
    setTimeout(() => {
        btn.html(backup);
        btn.prop('disabled', false);
    }, 1500)
}

function stopHostController() {
    let btn = $('#danger-stop-host');
    if(window.Bot.time.expired) {
        btn.remove();
    }
}

function updateBotTime() {
    let time = window.Bot.time;
    if(!time.expired) {
        const diffTime = Math.abs(time.timestamp - new Date());
        if(diffTime > 1000) {
            let seconds = Math.floor(diffTime / 1000 % 60);
            let minutes = Math.floor(diffTime / 1000 / 60 % 60);
            let hours = Math.floor(diffTime / 1000 / 60 / 60 % 24);
            let days = Math.floor(diffTime / 1000 / 60 / 60 / 24 % 7);
            let weeks = Math.floor(diffTime / 1000 / 60 / 60 / 24 / 7);
            $('#bot-time').text(`${weeks > 0 ? weeks + "w " : ""}${days > 0 ? days + "d " : ""}${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutes + "m " : ""}${seconds + "s"}`)
        }
        else {
            $('#bot-time').text("Expired");
            stopHostController();
            window.Bot.time.expired = true;
        }
    }
    else {$('#bot-time').text("Expired"); window.Bot.time.expired = true; stopHostController()};
}

async function mobileSupport() {
    let minWidth = 690;
    let width = window.innerWidth;
    
    if(width <= minWidth) {
        $('#new-bot').html(`<i class="fa-solid fa-square-plus"></i>`);
        $('.left-nav .content .centered button').html(`<i class="fa-solid fa-arrows-rotate"></i>`);
        $('.left-nav .content .others button').html(`<i class="fa-solid fa-gem"></i>`);
    }
    else {
        $('#new-bot').html(`<i class="fa-solid fa-square-plus"></i> Add new bot`);
        $('.left-nav .content .centered button').html(`<i class="fa-solid fa-arrows-rotate"></i> Refresh`);
        $('.left-nav .content .others button').html(`<i class="fa-solid fa-gem"></i> Become premium`);
    }
}

function openCreateBotModal(el) {
    $("body").append(`<div id='modal-background' style='
        background: rgba(0, 0, 0, .5);
        backdrop-filter: blur(10px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        display: flex;'>
        <div id="modal-container" class="container">
            <div class="header">
                <button onClick="closeCreateBotModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="content">
                <h4>Create new bot</h4>
                <form onSubmit="createBot(event)" id="modal_form" action="/api/v1/bot" method="post">
                    <label for="token" id="modal_response">Your bot token <a href="https://discord.com/developers/applications">(Discord developer portal)</a></label>
                    <div class="submit">
                        <input type="password" name="token" id="token">
                        <button id="modal_submit" type="submit"><i class="fa-solid fa-check"></i></button>
                    </div>
                </form>
            </div>
        </div>
        </div>`);
    let bg = $("#modal-background");
    let container = $("#modal-container");
    let canExit = true;
    container.mouseenter(() => {
        canExit = false;
    })

    container.mouseleave(() => {
        canExit = true;
    })

    bg.css("width", "100%");
    bg.css("opacity", "0");
    bg.css("height", "100vh");
    bg.css("z-index", "5");
    bg.css("position", "absolute");
    bg.css("top", "0");
    bg.css("left", "0");
    bg.animate({
        opacity: 1
    }, 150);
    bg.mousedown(() => {
        if(!canExit) return;
        closeCreateBotModal();
    })
}

function closeCreateBotModal() {
    let bg = $("#modal-background");
    bg.animate({
        opacity: 0
    }, 150, () => {
        bg.remove();
    });
}

function createBot(e) {
    e.preventDefault();
    let backup = $("#modal_response").html();
    let backup_submit = $("#modal_submit").html();
    $("#modal_submit").html(`<i class="fas fa-circle-notch fa-spin"></i>`);
    $.post($("#modal_form").attr('action'), $("#modal_form").serialize(), function(res) {
        window.location.reload();
    }).fail((res) => {
        let json = res.responseJSON;
        $('#token').css("border-color", "red");
        $('#modal_response').css("color", "red");
        $('#modal_response').text(json.error.message);
        $('#modal_submit').attr("disabled", true);
        setTimeout(() => {
            $('#modal_submit').attr("disabled", false);
            $('#token').css("border-color", "rgba(255, 255, 255, 0.15)");
            $('#modal_response').css("color", "rgba(255, 255, 255, 0.5)");
            $('#modal_response').html(backup);
        }, 2500)
    }).always(() => {
        $("#modal_submit").html(backup_submit);
    })
}

function add30Minutes() {
    let btn = $("#add-host-free");
    let backup = btn.html();

    btn.html(`<i class="fas fa-circle-notch fa-spin"></i> Add 30 minutes of free hosting`);
    grecaptcha.ready(() => {
        grecaptcha.execute('6LcWKR8iAAAAAHy2WXcpafd1_4PhaGlAgfmSp1Zm', {action: 'submit'}).then(token => {
            $.post(`/api/v1/bot/${window.Bot.id}/host`, {'g-recaptcha-response': token}, (res) => {
                window.location.reload();
            }).fail((err) => {
                new MError(`${err.responseJSON.error.message}`, `Failed to add host!`, Type.Error, {okayButton: true, cancelButton: false});
            }).always(() => {
                btn.html(backup);
            })
        })
    })
}

function openTab(url) {
    window.open(url, "_blank").focus();
}

function stopHost() {
    let btn = $('#stop-bot-host');
    let backup = btn.html();

    let confirm = new MError(
        `This action will remove all yor bot hosting time and cant be retrieved back`,
        `Are you sure?`,
        Type.Warning,
        {cancelButton: true, okayButton: true}
    );
    confirm.onSuccess(() => {
        btn.html(`<i class="fas fa-circle-notch fa-spin"></i> Stop hosting`);
        $.ajax({
            url: `/api/v1/bot/${window.Bot.id}/host`,
            type: 'DELETE',
            success: (result) => {
                window.location.reload();
            },
            fail: (err) => {
                new MError(`${err.responseJSON.error.message}`, `Failed to remove host!`, Type.Error, {okayButton: true, cancelButton: false});
            },
            always: () => {
                btn.html(backup);
            }
        })
    })
}

function deleteBot() {
    let btn = $('#delete-bot');
    let backup = btn.html();

    let confirm = new MError(
        `This action will remove your bot permanently and lose all bot data`,
        `Are you sure?`,
        Type.Warning,
        {cancelButton: true, okayButton: true}
    );

    confirm.onSuccess(() => {
        btn.html(`<i class="fas fa-circle-notch fa-spin"></i> Delete bot`);
        $.ajax({
            url: `/api/v1/bot/${window.Bot.id}`,
            type: 'DELETE',
            success: (result) => {
                window.location = "/dashboard";
            },
            fail: (err) => {
                new MError(`${err.responseJSON.error.message}`, `Failed to remove bot!`, Type.Error, {okayButton: true, cancelButton: false});
            },
            always: () => {
                btn.html(backup);
            }
        })
    })
}

async function loadCommands() {
    let container = $('.command-container');
    container.html("");
    let commands = await getBotCommands();
    window.Bot.commands = commands;

    commands.forEach(async (folder, index) => {
        // console.log(folder);
        if(folder.name !== "~default~") {
            container.append(`
                <div class="folder" data-name="${folder.name}" data-len="${folder.cmds.length}" ></div>
            `)

            let folderElement = $("div").find("[data-name='" + folder.name + "']");
            folderElement.html(`
                <div class="folder-header">
                    <h6 class="folder-title">${folder.name}</h6>
                    <button onClick="triggerFolder('${folder.name}', this, event)"><i class="fa-solid fa-folder"></i></button>
                </div>
                <div class="folder-container" data-open="false" data-container-id="${folder.name}">
                </div>
            `);

            let f_container = $("div").find("[data-container-id='" + folder.name + "']");
            folder.cmds.forEach((command, cIndex) => {
                f_container.append(`
                    <a href="/bot/${window.Bot.id}/command/${command._id}" class="command" data-name="${command.name}" data-trigger="${command.trigger}"
                        data-id="${command._id}">
                        <strong>${command.name}</strong>
                        <span>${command.trigger}</span>
                    </a>
                `)
            })
            
        }
        else {
            folder.cmds.forEach((command, cIndex) => {
                container.append(`
                    <a href="/bot/${window.Bot.id}/command/${command._id}" class="command default" data-name="${command.name}" data-trigger="${command.trigger}"
                        data-id="${command._id}">
                        <strong>${command.name}</strong>
                        <span>${command.trigger}</span>
                    </a>
                `)
            })
        }
    });
        
}

function triggerFolder(folder, those, event) {
    let btn = $(those);

    let container = $("div").find("[data-container-id='" + folder + "']");
    let autoHeight = container.get(0).scrollHeight;
    let opened = container.data("open");
    if(opened) {
        btn.html(`<i class="fa-solid fa-folder"></i>`);
        container.animate({height: 0}, 300, () => {
            console.log("closed: " + folder);
            container.data("open", false);
        })
        
    }
    else {
        btn.html(`<i class="fa-solid fa-folder-open"></i>`);
        container.animate({height: autoHeight}, 300, () => {
            $(this).height('auto');
            console.log("opened: " + folder);
            container.data("open", true);
        });
        

    }
}

this.window.onresize = async () => {
    await mobileSupport();
}

this.window.onload = async () => {
    let lScreen = new LoadingScreen({
        loaderClass: "#in_load",
        textClass: null
    });
    $('#add-host-free').click(() => add30Minutes());
    $('#stop-bot-host').click(() => stopHost());
    $('#delete-bot').click(() => deleteBot());
    let perm = await Notification.requestPermission();
    window.Bot = {};
    lScreen.addStep(10);
    Bot.time = await getBotTime();
    await getBotTime();
    lScreen.addStep(15);
    Bot.tab = window.location.hash ? hashToTab(window.location.hash) : 0;
    lScreen.addStep(15);
    Bot.id = window.location.pathname.split("/")[2];

    lScreen.addStep(15);
    await loadCommands()

    console.log(Bot);

    $("#sc_redeem").submit(e => {
        e.preventDefault();
        let confirm = new MError("By performing this action, you will change all your bot commands and variables with the shared person", "Are your sure?", Type.Warning, {cancelButton: true, okayButton: true});
        confirm.onSuccess(() => {
            $.post($("#sc_redeem").attr('action'), $("#sc_redeem").serialize(), function(res) {
                console.log(res);
            }).fail((res) => {
                let json = res.responseJSON;
                $('#sharecode').css("border-color", "red");
                $('#response').css("color", "red");
                $('#response').text(json.error.message);
                setTimeout(() => {
                    $('#sharecode').css("border-color", "rgba(255, 255, 255, 0.15)");
                    $('#response').css("color", "rgba(255, 255, 255, 0.5)");
                    $('#response').text("Redeem share code");
                }, 2500)
            });
        })
    })

    lScreen.addStep(5);
    await mobileSupport()
    lScreen.addStep(10);
    updateBotTime()
    setInterval(() => {
        updateBotTime();
    }, 500);
    lScreen.addStep(5);
    setTab(Bot.tab)

    lScreen.on('load', () => {
        lScreen.remove();
    }, true);
}