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
    let editorSVG: SvgInHtml = document.getElementById("svgeditor") as SvgInHtml;
	
	let editor = NodeEditor.instance.init(editorDom);

	//editor.init(editorDom, editorSVG);
}

/*let saveProject = () => {
    let content = editor.serialized;

    let options = {
        defaultPath: 'project.json',
        filters: [{
            extensions: ['json']
        }]
    }

    dialog.showSaveDialog(options).then( (result: any) => {
        let filename = result.filePath;
        
        if (filename === undefined) {
          //user didnt save
          return;
        }
        
        fs.writeFile(filename, content, (err: any) => {
          if (err) {
            //could not create the file
            return;
          }
        });

      }).catch((err: any) => {
        alert(err)
      });
};

let openProject = () => {
    let options = {
		filters: [{
			extensions: ['json']
		}]
	}

	dialog.showOpenDialog(options).then( (result: any) => {
		let filename = result.filePaths[0];
		
		if (filename === undefined) {
		  //user didnt save
		  return;
		}
		
		fs.readFile(filename, 'utf8', (err: any, data: string) => {
			if (err) {
				throw err;
			}

			const content = data;
			editor.load(content);
			
		});

	  }).catch((err: any) => {
		alert(err)
	  });
}

let runProject = () => {
    let content = editor.serialized;

	dm.send({
		command: 'run',
		graph: content
	})
};


//communcation with the main thread
ipcRenderer.on('editor', (event: any, command: any) => {
	switch (command) {
		case 'save':
			saveProject();
			break;
		case 'open':
			openProject();
			break;
		case 'run':
			runProject();
			break;
		default:
			break;
	}
	
    //todo more commands
})*/
