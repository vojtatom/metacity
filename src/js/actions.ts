
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

function runProject() {
	NodeEditor.instance.runProject();
};

