
class Editor {
    element: HTMLElement;
    svg: SVGElement;

    nodes: { [name: string]: EditorNode };
    connections: { [name: string]: Connection };
    selectedNodes: { [name: string]: EditorNode };

    stagedConnection: Connection;

    mouse: {
        x: number,
        y: number
    };

    functions: FunctionPanel;

    constructor() {
        this.element = null;
        this.mouse = {
            x: 0,
            y: 0
        };
        this.nodes = {};
        this.selectedNodes = {};
        this.connections = {};
        this.stagedConnection = null;

    }
    
    init(element: HTMLElement, svg: SVGElement) {
        this.element = element;
        this.svg = svg;
        this.element.onmousedown = (ev: MouseEvent) => this.mousedown(ev);
        this.element.onmousemove = (ev: MouseEvent) => this.mousemove(ev);
        this.element.onmouseup = (ev: MouseEvent) => this.mouseup(ev);
        
        this.functions = new FunctionPanel(this);
    }

    registerNode(node: EditorNode) {
        this.nodes[node.id] = node;
        this.element.appendChild(node.element);
    }


    deregisterNode(node: EditorNode) {
        this.element.removeChild(node.element);
        delete this.nodes[node.id];
    }

    mousedown(ev: MouseEvent) {

        if (this.stagedConnection)
        {
            this.stagedConnection.remove();
            this.stagedConnection = null;
        } 

        ev.stopPropagation();
        ev.preventDefault();
    }

    mousemove(ev: MouseEvent) {
        let dx = ev.clientX - this.mouse.x;
        let dy = ev.clientY - this.mouse.y;

        for(let node in this.selectedNodes) 
            this.selectedNodes[node].move(dx, dy);
    
        this.mouse.x = ev.clientX;
        this.mouse.y = ev.clientY;

        if (this.stagedConnection)
            this.stagedConnection.move(dx, dy);
    }

    mouseup(ev: MouseEvent) {
        for(let node in this.selectedNodes) 
            this.selectedNodes[node].deselect();
    }

    get serialized() {
        let nodes = [];

        for(let node in this.nodes) 
            nodes.push(this.nodes[node].serialized);

        return JSON.stringify(nodes);
    }

    load(contents: string) {

        try {
            let data = JSON.parse(contents);
            this.clear();
    
            for(let node of data)
                EditorNode.load(node, this)

            for(let node of data)
                for(let param of node.inParameters)
                    for(let conn of param.connections)
                    {
                        let outConn = this.nodes[conn.out.node].getConnector(ConnectorType.output, conn.out.connector);
                        let inConn = this.nodes[conn.in.node].getConnector(ConnectorType.input, conn.in.connector);
    
                        Connection.load(outConn, inConn, this);
                    }
        } catch (error) {
            alert("File corrupted, cannot be loaded");
        }
    }

    clear() {
        //removes all nodes
        for(let node in this.nodes) 
            this.nodes[node].remove();
        this.stagedConnection = null;
    }
}