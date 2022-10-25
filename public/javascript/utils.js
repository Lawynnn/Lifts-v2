const toggleDropdown = () => {
    let open_icon = $(".open_icon");
    let dropdown = $(".dropdown");
    let opened = false;
    if(open_icon.css("rotate") === "180deg") {
        opened = true;
    }

    if(opened) {
        opened = false;
        open_icon.css("rotate", "0deg");
        dropdown.animate({height: 0}, 200, () => {
            dropdown.hide();
        })
    }
    else {
        opened = true;
        open_icon.css("rotate", "180deg");
        dropdown.show();
        dropdown.animate({height: "154px"}, 200, () => {
            
        })
    }
}

const flashScreen = (color = "rgba(0, 255, 0, .05)") => {
    let flash = $('.flash');
    flash.css("background", color);
    flash.show();
    flash.css("opacity", 0);
    flash.animate({opacity: 1}, 200, () => {
        flash.animate({opacity: 0}, 200, () => {
            flash.hide();
        })
    })
    
}