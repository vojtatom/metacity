class Connector2 {
    parameter: string;
    type: string;
    inout: ConnectorType;
    element: HTMLElement;

    node: EditorNode;
    editor: Editor;

    connections: {[name: string]: Connection};
    value: string;

    static connectorSize = 20;
    
    constructor(parameter: string, type: string, inout: ConnectorType, value: string, editor: Editor, node: EditorNode) {
        this.parameter = parameter;
        this.type = type;
        this.inout = inout;
        this.editor = editor;
        this.node = node;
        this.value = value ? value: null;
        this.connections = {};
    }


    html() {
        //base
        this.element = document.createElement("div");
        this.element.classList.add("connector");
        
        switch (this.inout) {
            case ConnectorType.input:
                this.element.classList.add("in");
                break;
            case ConnectorType.output:
                this.element.classList.add("out");
                break;
        }

        this.element.style.width = Connector.connectorSize + "px";
        this.element.title = this.parameter;
        //callbacks
        this.element.onmousedown = (ev: MouseEvent) => this.mousedown(ev);

        return this.element;
    }

    get pos() {
        let offTop = this.element.offsetTop;
        let offLeft = this.element.offsetLeft;

        let pos = this.node.pos;

        return {
            x: pos.x + offLeft + Connector.connectorSize / 2,
            y: pos.y + offTop + Connector.connectorSize / 2
        };
    }

    mousedown(ev: MouseEvent) {
        //check for staged connection
        if (this.editor.stagedConnection)
        {
            let conn = this.editor.stagedConnection;
            if(conn.connect(this))
            {
                //was connected
                conn.draw();
                this.editor.stagedConnection = null;
            } else {
                //show error
            }

            ev.preventDefault();
            ev.stopPropagation();

            return;
        }

        let pos = this.pos;
        let connection = new Connection(this, pos.x, pos.y, this.editor.svg);
        this.editor.stagedConnection = connection;

        ev.preventDefault();
        ev.stopPropagation();
    }

    removeAllConnections() {
        for(let conn in this.connections)
            this.connections[conn].remove();
    }

    drawConnenctions() {
        for(let conn in this.connections)
            this.connections[conn].draw();
    }

    get serialized() {
        let connections = [];
        for(let conn in this.connections) {
            connections.push(this.connections[conn].serialized);
        }

        return {
            param: this.parameter,
            type: this.type,
            inout: this.inout,
            node: this.node.id,
            value: this.value,
            connections: connections
        }
    }
}