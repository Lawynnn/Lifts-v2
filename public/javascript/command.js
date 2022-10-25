const editCommand = (_id, b_id) => {
    let cmd = {
        name: $("#cmd_name").val(),
        trigger: $("#cmd_trigger").val(),
        script: $("#cmd_script").val(),
    }

    $.post(`/api/v1/bot/${b_id}/command/${_id}`, {cmd_name: cmd.name, cmd_trigger: cmd.trigger, cmd_script: cmd.script}, (data) => {
        window.location.reload();
    }).fail(e => {
        console.log(e);
    })
}

const updateLines = () => {
    let side = $("#left_side_cmd");
    let area = $("#cmd_script");
    side.html("");
    area.val().split("\n").forEach((line, i) => {
        side.append(`<p>${i+1}</p>`);
    })
}

window.onload = () => {
    window.Command = {};
    window.Command.bot = window.location.pathname.split("/")[2];
    window.Command.id = window.location.pathname.split("/")[4];
    updateLines();
    let area = $("#cmd_script");
    area.on("input", (event) => {
        updateLines();
    })
}
  
window.addEventListener('keydown', function(e) {
    if(e.key.toLowerCase() === "s" && e.ctrlKey) {
        let cmd = {
            name: $("#cmd_name").val(),
            trigger: $("#cmd_trigger").val(),
            script: $("#cmd_script").val(),
        }
    
        $.post(`/api/v1/bot/${window.Command.bot}/command/${window.Command.id}`, {cmd_name: cmd.name, cmd_trigger: cmd.trigger, cmd_script: cmd.script}, (data) => {
            // $.get(`/api/v1/bot/${window.Command.bot}/command/`, {}, (data) => {
            //     let cmd = data.map(f => f.cmds.find(c => c._id === window.Command.id))[0];
            //     $("#cmd_name").text(cmd.name);
            //     $("#cmd_trigger").text(cmd.trigger);
            //     $("#cmd_script").text(cmd.script);
            //     flashScreen();
            // }).fail(e => console.log(e));
            flashScreen();
        }).fail(e => {
            flashScreen("rgba(255, 0, 0, .05)");
        })
        e.preventDefault();
    }
});