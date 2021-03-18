class Application {
    private static instanceObject: Application;
    private constructor() { }
    static get instance() {
        if (!this.instanceObject) {
            this.instanceObject = new this();
        }
        return this.instanceObject;
    }

    ui: ApplicationComponent;

    init(main: HTMLElement) {
        this.ui = new ApplicationComponent();
        this.ui.compile(main);

        NodeEditor.instance.init();
        Viewer.instance.init();
        Viewer.instance.startRender();

        //default callback for recieved data
        DataManager.instance.setupInstance((data: any) => {
            this.recieved(data)
        });

        DataManager.instance.send({
            'command': 'loadFunctions'
        });
    }


    recieved(data: any) {
        if (data.recipient == "editor")
            NodeEditor.instance.recieved(data);
        else if (data.recipient == "viewer")
            Viewer.instance.recieved(data);
        else
            console.error("message misses recipient", data);
    }

    static get ui() {
        return Application.instance.ui;
    }

}