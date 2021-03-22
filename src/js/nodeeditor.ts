enum ConnectorType {
    input,
    output
}

interface ConnectorInterface {
    param: string;
    type: string;
}

type ValueTypes = "string" | "number" | "select" | "bool" | "file" | "vec3";
type ValueInputTypes = string | number | number[] | boolean;;


interface ValueInterface {
    param: string;
    type: ValueTypes;
    value: string;
    optionals: any;
}

interface EditorFunction {
    title: string,
    description: string[],
    in: ConnectorInterface[],
    out: ConnectorInterface[],
    value: ValueInterface[],
    disabled: boolean
}


enum CycleSearch {
    nocycle,
    cycle
};


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


    connect(conn: Connector, connections: { [name: string]: Connection }) {
        let sourceConn = this.in ? this.in : this.out;
        let key = Connection.key(sourceConn, conn);

        //check self-loop
        if (conn.node.id == sourceConn.node.id)
        {
            NodeEditor.instance.debugMessage("Conneciton error", "Cannot connect node with itself.");
            return null;
        }

        //check for inout
        if (conn.inout + sourceConn.inout != ConnectorType.input + ConnectorType.output)
        {
            NodeEditor.instance.debugMessage("Conneciton error", "Cannot connect input to input or output to output.");
            return null;
        }

        //check for type
        if (sourceConn.type != conn.type)
        {
            NodeEditor.instance.debugMessage("Conneciton error", `Incompatible types ${sourceConn.type} and ${conn.type}.`);
            return null;
        }

        //check for existing
        if (key in connections)
        {
            NodeEditor.instance.debugMessage("Conneciton error", "Connection already exists.");
            return null;
        }

        if (this.in)
            this.out = conn;
        else 
            this.in = conn;

        //remove all incoming connections if in-connector
        for(let conn in this.in.connections)
            this.in.connections[conn].remove();

        this.in.connections[key] = this;
        this.out.connections[key] = this;
        return this;
    }


    deregister() {
        if (this.in && this.out)
        {
            let key = this.key;
            delete this.in.connections[key];
            delete this.out.connections[key];
            NodeEditor.instance.removeConnection(key);
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

    static load(outConn: Connector, inConn: Connector, connections: { [name: string]: Connection }) {
        if (!outConn || !inConn)
            return;

        let connection = new Connection(outConn);
        connection.connect(inConn, connections);
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
    computedForConnKey: string;

    constructor(structure: ConnectorInterface, inout: ConnectorType, node: EditorNode) {
        this.parameter = structure.param;
        this.type = structure.type;
        this.inout = inout;
        this.node = node;
        this.computedForConnKey = null;
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

    get hasBeenUpdated() {
        if (this.inout == ConnectorType.output) 
            return false;

        //input
        if (!this.computedForConnKey || 
            this.computedForConnKey != Object.keys(this.connections)[0])
            return true;
    }

    computed() {
        if (this.inout == ConnectorType.output) 
            return;
        this.computedForConnKey = Object.keys(this.connections)[0];
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

const arrayEquals = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

enum NodeStatus {
    active = 0,
    execute = 1,
    disabled = 2,
    cycle = 3
};

class NodeValue {
    param: string;
    type: ValueTypes;
    value: ValueInputTypes;
    node: EditorNode;
    optionals: any;

    computedForValue: ValueInputTypes;

    constructor(value: ValueInterface, node: EditorNode) {
        this.param = value.param;
        this.type = value.type;
        this.value = value.value;
        this.optionals = value.optionals;
        this.node = node;
        this.computedForValue = null;
    }

    computed() {
        this.computedForValue = this.value;
    }

    get hasBeenUpdated() {
        if(this.value instanceof Array && this.computedForValue instanceof Array) {
            return !arrayEquals(this.value, this.computedForValue);
        }

        return this.computedForValue != this.value;
    }

    get serialized() {
        return {
            param: this.param,
            type: this.type,
            value: this.value,
            optionals: this.optionals
        };
    }
}


class EditorNode { 
    id: string;
    title: string;
    
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

        this.inParams = Array.from(structure.in, (con) => new Connector(con, ConnectorType.input, this));
        this.outParams = Array.from(structure.out, (con) => new Connector(con, ConnectorType.output, this));  
        this.values = Array.from(structure.value, (val) => new NodeValue(val, this));

        this.nodeComponent = NodeEditor.ui.addNode(this, x, y);
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

    markForExecution() {
        this.nodeComponent.setExecute();
    }

    markActive() {
        this.nodeComponent.setActive();
    }

    markDisabled() {
        this.nodeComponent.setDisabled();
    }

    markCycle() {
        this.nodeComponent.setCyclePart();
    }


    addConnection(param: Connector, connections: {[name: string]: Connection}) {
        if (NodeEditor.instance.isConnectionStaged()) {
            let conn = NodeEditor.stagedConnection;
            if (conn.connect(param, connections))
            {
                NodeEditor.instance.addStagedConnection();
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
            out: this.outParams.map(p => p.serialized)
        };
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

    computed() {
        for(let value of this.values) {
            value.computed();
        }

        for(let inparam of this.inParams) {
            inparam.computed();
        }
    }

    get hasBeenUpdated() {
        for(let value of this.values) {
            if(value.hasBeenUpdated)
                return true;
        }

        for(let inparam of this.inParams) {
            if (inparam.hasBeenUpdated)
                return true;
        }

        return false;
    }
}


class NodeEditor {
    private static instanceObject: NodeEditor;

    private nodes: { [name: string]: EditorNode } = {};
    connections: { [name: string]: Connection } = {};

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
                    this.checkGraph();
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

    checkGraph() {
        validateNodeGraph(this.nodes);
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

    removeConnection(connectionID: string) {
        delete this.connections[connectionID];
        this.checkGraph();
    }

    removeNode(nodeID: string) {
        delete this.nodes[nodeID];
        this.checkGraph();
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

    addStagedConnection() {
        this.connections[this.stagedConnection.key] = this.stagedConnection;
        this.stagedConnection = null;
        this.checkGraph();
    }

    isConnectionStaged() {
        return this.stagedConnection != null;
    }

    debugMessage(title: string, message: string) {
        Application.ui.messages.addMessage(title, message, 0);
    }

    openNewProject(content: string) {
        DataManager.instance.send({
            command: 'clearPipeline'
        });
        Application.instance.clear();
        this.load(content);
    }
    
    load(contents: string) {
        try {
            this.clear();
            let graph = load(contents, this.functions)
            this.connections = graph.connections;
            this.nodes = graph.nodes;

        } catch (error) {
            console.error(error);
            this.debugMessage("Loading file failed", "The file format is corrupted.")
        }

        this.checkGraph();
    }

    get serialized() {
        let nodes = [];

        for(let node in this.nodes) 
            nodes.push(this.nodes[node].serialized);

        return JSON.stringify(nodes);
    }

    recieved(data: any) {
        switch (data.status) {
            case 'functionsLoaded':
                this.initFunctions(data.functions);
                break;
            case 'error':
                this.debugMessage("Pipeline Error", data.error);
                break;
            case 'nodeStarted':
                this.debugMessage("Pipeline progress", `Node ${data.title} processing...`);
                break;
            case 'nodeDone':
                this.debugMessage("Pipeline progress", `Node ${data.title} finished.`);
                this.nodes[data.id].computed();
                this.checkGraph();
                break;
            case 'progress':
                Application.ui.messages.updateProgressbar(data.progressID, data.progress, data.message);
                break;
            case 'pipelineDone':
                //this.markNodesComputed();
                this.checkGraph();
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

    markNodesComputed() {
        for(let node in this.nodes) 
            this.nodes[node].computed();
    }

    clear() {
        //removes all nodes
        this.nodes = {};
        this.connections = {};
        Application.ui.clear();
    }

    static get ui() {
        return Application.instance.ui.components.nodeEditor;
    }

    static get stagedConnection() {
        return NodeEditor.instance.stagedConnection;
    }

    willAppear() {
        NodeEditor.ui.resize();
    }
}