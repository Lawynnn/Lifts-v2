window.onload = () => {
    let topNav = $("top-nav");
    let navItems = [...$("nav-item").map((index, navItem) => navItem)];

    let navHeaders = [...navItems.filter(navItem => $(navItem).attr("is-header") === true)];
    let navFooters = [...navItems.filter(navItem => $(navItem).attr("is-footer") === true)];


    console.table(navItems.map(v => $(v).attr("is-footer")));

    navHeaders.map((index, header) => $(header).addClass("top-nav-header"));
    navFooters.map((index, footer) => $(footer).addClass("top-nav-footer"));
}