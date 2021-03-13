const { ipcRenderer, remote } = require('electron');
const dialog = remote.dialog;
const fs = require('fs');


//default callback for recieved data
DataManager.instance.setupInstance((data: object) => {
    console.log('got from server', data);
    NodeEditor.instance.recieved(data);
    Viewer.instance.recieved(data);
});

window.onload = function() {
    let editorDom = document.getElementById("editor");
	NodeEditor.instance.init(editorDom);
    Viewer.instance.init();
    Viewer.instance.startRender();
}

window.onresize = (ev: Event) => {
	NodeEditor.instance.ui.resize();
}