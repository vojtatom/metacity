
interface ConnectorInterface {
    param: string;
    type: string;
}

enum ConnectorType {
    input,
    output
}

class Connector {
    parameter: string;
    type: string;
    inout: ConnectorType;
    element: HTMLElement;

    node: EditorNode;
    editor: Editor;

    connections: {[name: string]: Connection};

    static connectorSize = 20;
    
    constructor(parameter: string, type: string, inout: ConnectorType, editor: Editor, node: EditorNode) {
        this.parameter = parameter;
        this.type = type;
        this.inout = inout;
        this.editor = editor;
        this.node = node;
        this.connections = {};
    }


    html() {
        //base
        this.element = document.createElement("div");
        this.element.classList.add("connector");
        this.element.style.width = Connector.connectorSize + "px";
        this.element.title = this.parameter;
        //callbacks
        this.element.onmousedown = (ev: MouseEvent) => this.mousedown(ev);

        return this.element;
    }

    get pos() {
        //let offset = this.element.offsetTop;
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
            connections: connections
        }
    }
}