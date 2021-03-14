enum ConnectorType {
    input,
    output
}

interface ConnectorInterface {
    param: string;
    type: string;
}


interface ValueInterface {
    param: string;
    type: "string" | "number" | "bool" | "file" | "vec3";
    value: string;
}

interface EditorFunction {
    title: string,
    description: string[],
    in: ConnectorInterface[],
    out: ConnectorInterface[],
    value: ValueInterface[],
    disabled: boolean
}

function usesTypes(func: EditorFunction) {
    let inputs = func.in.map(val => val.type);
    let outputs = func.out.map(val => val.type);
    return inputs.concat(outputs.filter((item) => inputs.indexOf(item) < 0));
}

function objectEmpty(obj: Object) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

class Connection {
    
    in: Connector;
    out: Connector;
    connectionContainer: ConnectionHTMLContainer;

    constructor(source: Connector) {

        if (source.inout == ConnectorType.input) {
            this.out = null;
            this.in = source
        } else {
            this.out = source;
            this.in = null;
        }

        this.connectionContainer = NodeEditor.ui.addConnection(this);
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

        //check self-loop
        if (conn.node.id == sourceConn.node.id)
            return false;

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

        this.in.node.checkRequiredInputs();
        this.out.node.checkRequiredInputs();
        return true;
    }


    deregister() {
        if (this.in && this.out)
        {
            let key = this.key;
            delete this.in.connections[key];
            delete this.out.connections[key];
            NodeEditor.instance.removeConnection(key);
            this.in.node.checkRequiredInputs();
            this.out.node.checkRequiredInputs();
        }
    }

    remove() {
        this.connectionContainer.remove();
        this.deregister();
    }

    move(dx: number, dy: number) {
        this.connectionContainer.move();
    }

    get serialized() {
        return {
            out: {
                node: this.out.node.id,
                connector: this.out.parameter
            },
            in: {
                node: this.in.node.id,
                connector: this.in.parameter
            }
        }
    }

    static load(outConn: Connector, inConn: Connector) {
        if (!outConn || !inConn)
            return;

        let connection = new Connection(outConn);
        connection.connect(inConn);
        connection.move(0, 0);
    }
}


class Connector {
    parameter: string;
    type: string;
    inout: ConnectorType;
    
    connections: {[name: string]: Connection} = {};
    node: EditorNode;
    
    connHTML: ConnectorHTMLContainer;

    constructor(structure: ConnectorInterface, inout: ConnectorType, node: EditorNode) {
        this.parameter = structure.param;
        this.type = structure.type;
        this.inout = inout;
        this.node = node;
    }

    drawConnections() {
        for (let conn in this.connections) {
            this.connections[conn].move(0, 0);
        }
    }

    removeAllConnections() {
        for(let conn in this.connections)
            this.connections[conn].remove();
    }

    get serialized() {
        let connections = [];
        for(let conn in this.connections) 
            connections.push(this.connections[conn].serialized);

        return {
            param: this.parameter,
            type: this.type,
            node: this.node.id,
            connections: connections
        }
    }

    get connectionCount(){
        return Object.keys(this.connections).length;
    }
}

class NodeValue {
    param: string;
    type: "string" | "number" | "bool" | "file" | "vec3";
    value: string | number | number[] | boolean;
    node: EditorNode;

    constructor(value: ValueInterface, node: EditorNode) {
        this.param = value.param;
        this.type = value.type;
        this.value = value.value;
        this.node = node;
    }

    get serialized() {
        return {
            param: this.param,
            type: this.type,
            value: this.value
        };
    }
}


class EditorNode { 
    id: string;
    title: string;
    disabled: boolean;
    
    inParams: Connector[];
    outParams: Connector[];
    values: NodeValue[];
    
    nodeComponent: NodeComponent;
    static idCounter = 0;

    constructor(structure: EditorFunction, x: number, y: number, id?: string) {
        if (id)
            this.id = id;
        else {
            this.id = "Node" + EditorNode.idCounter;
            EditorNode.idCounter++;
        } 
        
        this.title = structure.title;
        this.disabled = structure.disabled;

        this.inParams = Array.from(structure.in, (con) => new Connector(con, ConnectorType.input, this));
        this.outParams = Array.from(structure.out, (con) => new Connector(con, ConnectorType.output, this));  
        this.values = Array.from(structure.value, (val) => new NodeValue(val, this));

        this.nodeComponent = NodeEditor.ui.addNode(this, x, y);
        this.checkRequiredInputs();
    }

    move(dx: number, dy: number) {
        this.nodeComponent.move(dx, dy);
    }

    remove() {
        for(let param of this.inParams)
            param.removeAllConnections();
    
        for(let param of this.outParams)
            param.removeAllConnections();

        NodeEditor.instance.removeNode(this.id);
    }

    addConnection(param: Connector) {
        if (NodeEditor.instance.isConnectionStaged()) {
            let conn = NodeEditor.stagedConnection;
            if (conn.connect(param))
            {
                NodeEditor.instance.clearStagedConnection();
                conn.move(0, 0);
            }
            return;
        }

        let connection = new Connection(param);
        NodeEditor.instance.stageConnection(connection);
    }

    get serialized() {
        return {
            title: this.title,
            id: this.id,
            pos: {
                x: this.nodeComponent.pos.x,
                y: this.nodeComponent.pos.y
            },
            value: this.values.map(v => v.serialized),
            in: this.inParams.map(p => p.serialized),
            out: this.outParams.map(p => p.serialized),
            disabled: this.disabled
        };
    }

    checkRequiredInputs() {
        for(let connector of this.inParams)
            if (connector.connectionCount == 0)
            {
                this.nodeComponent.setNotActive();
                return;
            }
        this.nodeComponent.setActive();
    }

    static load(data: any) {
        let node = new EditorNode(data, data.pos.x, data.pos.y, data.id);
        
        let id = data.id;
        let num = Number(id.slice(4)); //skip text "Node" in ID 
        EditorNode.idCounter = Math.max(EditorNode.idCounter, num + 1);
            
        return node;
    }

    getConnector(inout: ConnectorType, param: string) {
        let connectors = inout == ConnectorType.input ? this.inParams : this.outParams;

        for(let conn of connectors)
            if (conn.parameter == param)
                return conn;
    }
}


class NodeEditor {
    private static instanceObject: NodeEditor;

    private nodes: { [name: string]: EditorNode } = {};
    private connections: { [name: string]: Connection } = {};
    private selectedNodes: { [name: string]: EditorNode } = {};
    private functions: {[name: string]: EditorFunction};
    private stagedConnection: Connection = null;


    //Editor node is a singleton
    private constructor() { }

    static get instance() {
        if (!this.instanceObject) {
            this.instanceObject = new this();
        }
        return this.instanceObject;
    }

    init() {
        //nothign to do
    }

    moveNodes(dx: number, dy: number) {
        for (let node in this.selectedNodes)
            this.selectedNodes[node].move(dx, dy);

        if (this.stagedConnection)
            this.stagedConnection.move(dx, dy);
    }

    initFunctions(data: any) {
        let types: string[] = [];
        this.functions = data;

        for (let func in data) {
            let structure = data[func] as EditorFunction;
            
            NodeEditor.ui.loadFunction(structure,
                (x: number, y: number) => {
                    
                    let node = new EditorNode(structure, x, y);
                    this.nodes[node.id] = node;
                    this.selectNode(node.id);

                });

            types = types.concat(usesTypes(structure).filter((item) => types.indexOf(item) < 0))
        }

        Application.ui.setupStyles(types);

        if(!objectEmpty(this.nodes))
            this.revalidate();
    }


    revalidate() {
        let graph = this.serialized;
        this.load(graph);
    }

    selectNode(nodeID: string) {
        this.selectedNodes[nodeID] = this.nodes[nodeID];
    }

    deselectNode(nodeID: string) {
        delete this.selectedNodes[nodeID];
    }

    deselectAllNodes() {
        for (let nodeID in this.selectedNodes){
            this.deselectNode(nodeID);
        }
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

    removeNode(nodeID: string) {
        delete this.nodes[nodeID];
    }

    stageConnection(conn: Connection) {
        this.stagedConnection = conn;
    }

    cancelStagedConnection() {
        this.stagedConnection.remove();
        this.clearStagedConnection();
    }

    clearStagedConnection() {
        this.stagedConnection = null;
    }

    isConnectionStaged() {
        return this.stagedConnection != null;
    }

    debugMessage(title: string, message: string) {
        Application.ui.messages.addMessage(title, message, 0);
    }

    validateParameter(p: ConnectorInterface, structParams: ConnectorInterface[]) {
        for(let sp of structParams) {
            if (sp.param == p.param && sp.type == p.type)
                return true;
        }
        return false;
    }

    validateStructure(struct: EditorFunction) {
        
        if(!(struct.title in this.functions))
        {
            this.debugMessage("Node structure not valid", `Node ${struct.title} is unknown.`)
            return false;
        }
        
        let f = this.functions[struct.title];

        if (f.in.length != struct.in.length || f.out.length != struct.out.length)
        {
            this.debugMessage("Node structure not valid", `Node ${struct.title} has ${struct.in.length} inputs (${f.in.length} expected) and ${struct.out.length} outputs (${f.out.length} expected).`)
            return false;
        }

        for(let p of f.in)
            if (!this.validateParameter(p, struct.in))
            {
                this.debugMessage("Node structure not valid", `Node ${struct.title} missing input parameter ${p.param} [type ${p.type}].`)
                return false;
            }

        for(let p of f.out)
            if (!this.validateParameter(p, struct.out))
            {
                this.debugMessage("Node structure not valid", `Node ${struct.title} missing output parameter ${p.param} [type ${p.type}].`)
                return false;
            }

        return true;
    }

    sortParameters(structParams: ConnectorInterface[], templateParams: ConnectorInterface[]) {
        let params = [];
        for(let p of templateParams)
            for(let sp of structParams)
                if (p.param == sp.param)    
                    params.push(sp);

        return params
    }


    sortConnectors(struct: EditorFunction) {
        struct.in = this.sortParameters(struct.in, this.functions[struct.title].in);
        struct.out = this.sortParameters(struct.out, this.functions[struct.title].out);
    }


    updateStructure(struct: EditorFunction) {
        struct.description = this.functions[struct.title].description;
        struct.disabled = this.functions[struct.title].disabled;
        this.sortConnectors(struct);
    }


    validateConnection(inputNode: string, outNode: string) {
        if (!(inputNode in this.nodes && outNode in this.nodes))
            return false;
        return true;
    }


    load(contents: string) {
        try {
            let data = JSON.parse(contents);
            this.clear();
            Application.ui.messages.closeAllMessages();
    
            for(let node of data) {
                if (this.validateStructure(node)) {                  
                    this.updateStructure(node);
                } else {
                    node["disabled"] = true;
                }
                
                let n = EditorNode.load(node);
                this.nodes[n.id] = n;
            }

            for(let node of data)
                for(let param of node.in)
                    for(let conn of param.connections)
                    {
                        if (!this.validateConnection(conn.out.node, conn.in.node))
                            continue;
                        
                        let outConn = this.nodes[conn.out.node].getConnector(ConnectorType.output, conn.out.connector);
                        let inConn = this.nodes[conn.in.node].getConnector(ConnectorType.input, conn.in.connector);
                        Connection.load(outConn, inConn);
                    }
        } catch (error) {
            console.error(error);
            this.debugMessage("Loading file failed", "The file format is corrupted.")
        }
    }

    get serialized() {
        let nodes = [];

        for(let node in this.nodes) 
            nodes.push(this.nodes[node].serialized);

        return JSON.stringify(nodes);
    }

    recieved(data: any) {
        if(!("status" in data))
        {   
            console.error("unmarked data for node editor", data);
            return;
        }

        switch (data.status) {
            case 'functionsLoaded':
                this.initFunctions(data.functions);
                break;
            case 'pipelineDone':
                
                break;
            case 'error':
                this.debugMessage("Pipeline Error", data.error);
                break;
            case 'nodeStarted':
                this.debugMessage("Pipeline progress", `Node ${data.title} started.`);
                break;
            case 'nodeDone':
                this.debugMessage("Pipeline progress", `Node ${data.title} finished.`);
                break;
            case 'progress':
                Application.ui.messages.updateProgressbar(data.progressID, data.progress, data.message);
                break;
            case 'pipelineDone':
                
                break;    
            default:
                break;
        }
    }

    runProject() {
        let content = this.serialized;
        Application.ui.messages.closeAllMessages();
        DataManager.instance.send({
            command: 'run',
            graph: content
        });
    }

    clear() {
        //removes all nodes
        for(let node in this.nodes) 
            this.nodes[node].remove();
        
        Application.ui.clear();
    }

    static get ui() {
        return Application.instance.ui.components.nodeEditor;
    }

    static get stagedConnection() {
        return NodeEditor.instance.stagedConnection;
    }
}