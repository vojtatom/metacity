
function saveProject() {
    let content = NodeEditor.instance.serialized;

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

function openProject() {
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
			NodeEditor.instance.load(content);
			
		});

	  }).catch((err: any) => {
		alert(err)
	  });
}

function runProject(editor: NodeEditor) {
    let content = editor.serialized;

	dm.send({
		command: 'run',
		graph: content
	})
};


/*//communcation with the main thread
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