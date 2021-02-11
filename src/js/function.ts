

class EditorFunction2 {
    title: string;
    description: string;
    inConn: ConnectorInterface[];
    outConn: ConnectorInterface[];

    element: HTMLElement;

    panel: FunctionPanel2;
    
    constructor(title: string, inConn: ConnectorInterface[], outConn: ConnectorInterface[], description: string[], panel: FunctionPanel) {
        this.title = title;
        this.inConn = inConn;
        this.outConn = outConn;
        this.panel = panel;
        this.description = description.join("");

        this.html();
    }

    html() {
        let container = document.createElement("div");
        container.classList.add("function");

        let icon = document.createElement("div");
        icon.classList.add("icon");

        let element = document.createElement("div");
        element.classList.add("labels");
        
        let title = document.createElement("div");
        title.classList.add("title");
        title.innerHTML = this.title;

        let description = document.createElement("div");
        description.classList.add("description");
        description.innerHTML = this.description;

        element.appendChild(title);
        element.appendChild(description);
        container.appendChild(icon);
        container.appendChild(element)
        this.panel.element.appendChild(container);
        
        container.onmousedown = (ev: MouseEvent) => {
            let node = new EditorNode(this.title, ev.x, ev.y, this.inConn, this.outConn, this.panel.editor);
            node.select();

            ev.preventDefault();
            ev.stopPropagation();
        }

        container.onmouseup = (ev: MouseEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
        }
        
        this.element = element;
    }
}