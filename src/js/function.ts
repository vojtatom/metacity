

class EditorFunction {
    title: string;
    inConn: ConnectorInterface[];
    outConn: ConnectorInterface[];

    element: HTMLElement;

    panel: FunctionPanel;
    
    constructor(title: string, inConn: ConnectorInterface[], outConn: ConnectorInterface[], panel: FunctionPanel) {
        this.title = title;
        this.inConn = inConn;
        this.outConn = outConn;
        this.panel = panel;

        this.html();
    }

    html() {
        let element = document.createElement("div");
        element.innerHTML = this.title;
        this.panel.element.appendChild(element);

        element.onmousedown = (ev: MouseEvent) => {
            let node = new EditorNode(this.title, ev.x, ev.y, this.inConn, this.outConn, this.panel.editor);
            node.select();

            ev.preventDefault();
            ev.stopPropagation();
        }

        element.onmouseup = (ev: MouseEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
        }
        
        this.element = element;
    }
}