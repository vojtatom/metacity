const { ipcRenderer, remote } = require('electron');
const dialog = remote.dialog;
const fs = require('fs');


//default callback for recieved data
let dm = DataManager.getInstance();
dm.setupInstance((data: object) => {
    console.log('got from server', data);
});

window.onload = function() {
    let editorDom = document.getElementById("editor");
	NodeEditor.instance.init(editorDom);;
}

window.onresize = (ev: Event) => {
	NodeEditor.instance.ui.resize();
}