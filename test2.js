const {reload, remove, store, activeClients} = require("./client/clientStore");



store("MTAyMDM1NTA2ODAzMTE0ODA1Mw.GSY4KX.gnNP-DH_weaVMCYa_KHIcgCZskGsrcQxNYRVMc", "123").then(res => {
    reload(res._id).then(res => {
    });
})