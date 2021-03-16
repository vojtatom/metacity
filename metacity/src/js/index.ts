const { ipcRenderer, remote } = require('electron');
const dialog = remote.dialog;
const fs = require('fs');



window.onload = function() {
    const main = document.getElementById("main");
	Application.instance.init(main);
}

window.onresize = (ev: Event) => {
	NodeEditor.ui.resize();
	Viewer.instance.resize();
}