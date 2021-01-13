

class FunctionPanel {
    editor: Editor;
    functions: EditorFunction[];
    element: HTMLElement;

    constructor(editor: Editor) {
        this.editor = editor;
        this.functions = [];

        this.html();

        let dm = DataManager.getInstance();
        dm.send({
            'command': 'load_functions'
        }, (data) => this.initFunctions(data))
    }

    html() {
        let sidebar = document.createElement("div");
        sidebar.id = "functions";
        sidebar.classList.add("sidebar");

        this.element = sidebar;
        this.editor.element.appendChild(sidebar);
    }


    initFunctions(data: any) {
        for(let func in data) {
            let funcInfo = data[func];
            this.functions.push(new EditorFunction(funcInfo.title, funcInfo.in, funcInfo.out, this))
        }

    }
}