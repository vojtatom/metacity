enum ConnectorType {
    input,
    output
}

interface ConnectorInterface {
    param: string;
    type: string;
    inout: ConnectorType;
    value: string;
}

interface EditorFunction {
    title: string,
    description: string,
    in: ConnectorInterface[],
    out: ConnectorInterface[]
}

class Connection {
    
    in: Connector;
    out: Connector;
    connHTML: ConnectionHTMLTemplate;

    constructor(source: Connector, x: number, y: number) {

        if (source.inout == ConnectorType.input) {
            this.out = null;
            this.in = source
        } else {
            this.out = source;
            this.in = null;
        }

        this.connHTML = new ConnectionHTMLTemplate(this, x, y);
    }

    static key(connA: Connector, connB: Connector){
        if (connA.inout == ConnectorType.input)
            return connB.node.id + connB.parameter + "---" + connA.node.id + connA.parameter;
        else
            return connA.node.id + connA.parameter + "---" + connB.node.id + connB.parameter;
    }

    get key() {
        return Connection.key(this.out, this.in);
    }


    connect(conn: Connector) {
        let sourceConn = this.in ? this.in : this.out;
        let key = Connection.key(sourceConn, conn);

        //check for inout
        if (conn.inout + sourceConn.inout != ConnectorType.input + ConnectorType.output)
            return false;

        //check for type
        if (sourceConn.type != conn.type)
            return false;

        //check for existing
        if (NodeEditor.instance.connectionExists(key))
            return false;

        if (this.in)
            this.out = conn;
        else 
            this.in = conn;

        //remove all incoming connections if in-connector
        for(let conn in this.in.connections)
            this.in.connections[conn].remove();

        this.in.connections[key] = this;
        this.out.connections[key] = this;
        NodeEditor.instance.addConnection(this);

        //add html of this
        return true;
    }


    remove() {
        //remove HTML of this

        if (this.in && this.out)
        {
            let key = this.key;
            delete this.in.connections[key];
            delete this.out.connections[key];
            NodeEditor.instance.removeConnection(key);
        }
    }

    move(dx: number, dy: number) {
        this.connHTML.move(dx, dy);
    }
}


class Connector {
    parameter: string;
    type: string;
    inout: ConnectorType;
    value: string;
    
    connections: {[name: string]: Connection} = {};
    node: EditorNode;
    html: HTMLElement;
    
    constructor(structure: ConnectorInterface, inout: ConnectorType, node: EditorNode) {
        this.parameter = structure.param;
        this.type = structure.type;
        this.inout = inout;
        this.node = node;
        this.value = structure.value ? structure.value: null;
    }

    get pos() {
        let offTop = this.html.offsetTop;
        let offLeft = this.html.offsetLeft;

        let pos = this.node.nodeHTML.pos;

        return {
            x: pos.x + offLeft + 20 / 2,
            y: pos.y + offTop + 20 / 2
        };
    }

    drawConnections() {
        for (let conn in this.connections) {
            this.connections[conn].move(0, 0);
        }
    }
}


class EditorNode { 
    id: string;
    title: string;
    
    selected: boolean;
    nodeHTML: NodeHTMLTemplate;

    inParams: Connector[];
    outParams: Connector[];
    
    static idCounter = 0;

    constructor(structure: EditorFunction, x: number, y: number, id?: string) {
        if (id)
            this.id = id;
        else {
            this.id = "Node" + EditorNode.idCounter;
            EditorNode.idCounter++;
        } 
        
        this.selected = false;
        this.title = structure.title;

        this.inParams = Array.from(structure.in, (con) => new Connector(con, ConnectorType.input, this));
        this.outParams = Array.from(structure.out, (con) => new Connector(con, ConnectorType.output, this));  
    
        this.nodeHTML = new NodeHTMLTemplate(this, x, y);
    }

    select() {
        this.selected = true;
        NodeEditor.instance.selectNode(this.id);
    }

    deselect() {
        this.selected = false;
    }

    move(dx: number, dy: number) {
        this.nodeHTML.move(dx, dy);
    }

    addConnection(paramHTML: HTMLElement, param: Connector, x: number, y: number) {
        if (NodeEditor.instance.ui.stagedConnection) {
            let conn = NodeEditor.instance.ui.stagedConnection;
            if (conn.connect(param))
            {
                param.html = paramHTML;
                NodeEditor.instance.ui.stagedConnection = null;
                conn.move(0, 0);
            }
            return;
        }

        param.html = paramHTML;
        let connection = new Connection(param, x, y);
        NodeEditor.instance.ui.stagedConnection = connection;
    }
}


class NodeEditor {
    private static instanceObject: NodeEditor;

    private nodes: { [name: string]: EditorNode } = {};
    private connections: { [name: string]: Connection } = {};
    private selectedNodes: { [name: string]: EditorNode } = {};

    private editorHTML: EditorHTMLTemplate;
    private functions: EditorFunction[];

    //Editor node is a singleton
    private constructor() { }

    static get instance() {
        if (!this.instanceObject) {
            this.instanceObject = new this();
        }
        return this.instanceObject;
    }

    init(parent: HTMLElement) {
        //init UI
        this.editorHTML = new EditorHTMLTemplate(parent);
        
        //UI callbacks 
        this.editorHTML.moveActive = (dx: number, dy: number) => {
            for (let node in this.selectedNodes)
                this.selectedNodes[node].move(dx, dy);

            if (this.editorHTML.stagedConnection)
                this.editorHTML.stagedConnection.move(dx, dy);
        };

        this.editorHTML.clearSelectedNodes = () => {
            for (let nodeID in this.selectedNodes){
                this.selectedNodes[nodeID].deselect();
                delete this.selectedNodes[nodeID];
            }
        };

        //init nodes
        let dm = DataManager.getInstance();
        dm.send({
            'command': 'load_functions'
        }, (data) => this.initFunctions(data))
    }


    private initFunctions(data: any) {
        for (let func in data) {
            let funcInfo = data[func] as EditorFunction;
            this.editorHTML.addFunctionToPanel(funcInfo,
                (ev: MouseEvent) => {
                    let node = new EditorNode(funcInfo, ev.x, ev.y);
                    this.nodes[node.id] = node;
                    node.select();

                    console.log(node);
                    ev.preventDefault();
                    ev.stopPropagation();
                });
        }
    }

    selectNode(nodeID: string) {
        this.selectedNodes[nodeID] = this.nodes[nodeID];
    }

    connectionExists(key: string) {
        return key in this.connections;
    }

    addConnection(connection: Connection) {
        this.connections[connection.key] = connection;
    }

    removeConnection(connectionID: string) {
        delete this.connections[connectionID];
    }

    get ui() {
        return this.editorHTML;
    }
}