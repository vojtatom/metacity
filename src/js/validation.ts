function debugMessage(title: string, message: string) {
    Application.ui.messages.addMessage(title, message, 0);
}


function findCycle(node: EditorNode, visited: Set<string>): EditorNode|boolean {
    if (visited.has(node.id)) {
        return node;
    }

    visited.add(node.id);

    for(let param of node.outParams) {
        for(let conn in param.connections) {
            let successor = param.connections[conn].in.node;
            let cc: EditorNode|boolean = findCycle(successor, new Set(visited));            
            if (cc instanceof EditorNode) {
                successor.markCycle();
                if (node.id == cc.id)
                    return true;
                return cc;
            }
        }
    }
    return false;
}


function markExecutable(node: EditorNode, parentExecutable: boolean, active: Set<string>) {
    let executable = (node.hasBeenUpdated || parentExecutable) && active.has(node.id) ;

    if(executable)
        node.markForExecution();

    for(let param of node.outParams) {
        for(let conn in param.connections) {
            let successor = param.connections[conn].in.node;  
            markExecutable(successor, executable, active);            
        }
    }
}


function getStartingNodes(nodes: { [name: string]: EditorNode }) {
    let startings = [];
    for(let nodeId in nodes) {
        if (nodes[nodeId].inParams.length == 0)
            startings.push(nodes[nodeId]);
    }
    return startings;
}


function validateNodeGraph(nodes: { [name: string]: EditorNode }) {
    for(let nodeID in nodes) {
        nodes[nodeID].markDisabled();
    }


    let startNodes = getStartingNodes(nodes);

    if (startNodes.length == 0) {
        debugMessage("No start found", "No starting nodes founds, insert node with no inputs");
        return [];
    }

    for(let node of startNodes)
        if (findCycle(node, new Set()))
        {
            debugMessage("Cycle detected", "Cycle detected, please rearrange highlited nodes");
            return [];
        }
    
        
    let ordered = [...startNodes];
    let active: Set<string> = new Set();
    ordered.map(value => {
        active.add(value.id);
        value.markActive();
    });

    for(let i = 0; i < ordered.length; ++i) {
        let node = ordered[i];
        for(let oparam of node.outParams) {
            for(let oconn in oparam.connections) {
                let succesor = oparam.connections[oconn].in.node;
                let satisfied = true;
                
                for(let iparam of succesor.inParams) {
                    for(let iconn in iparam.connections) {
                        let requiredNode = iparam.connections[iconn].out.node;
                    
                        if(!active.has(requiredNode.id))
                            satisfied = false;
                    }

                    if(Object.keys(iparam.connections).length == 0)
                        satisfied = false;
                }

                if(satisfied && !active.has(succesor.id)) {
                    ordered.push(succesor);
                    active.add(succesor.id);
                    succesor.markActive();
                }
            }
        }
    }

    for(let node of startNodes)
        markExecutable(node, false, active);

    return ordered;
} 



function validateParameter(p: ConnectorInterface, structParams: ConnectorInterface[]) {
    for(let sp of structParams) {
        if (sp.param == p.param && sp.type == p.type)
            return true;
    }
    return false;
}

function validateStructure(struct: EditorFunction, funcDefs: {[name: string]: EditorFunction}) {
        
    if(!(struct.title in funcDefs))
    {
        debugMessage("Node structure not valid", `Node ${struct.title} is unknown.`)
        return false;
    }
    
    let f = funcDefs[struct.title];

    if (f.in.length != struct.in.length || f.out.length != struct.out.length)
    {
        debugMessage("Node structure not valid", `Node ${struct.title} has ${struct.in.length} inputs (${f.in.length} expected) and ${struct.out.length} outputs (${f.out.length} expected).`)
        return false;
    }

    for(let p of f.in)
        if (!this.validateParameter(p, struct.in))
        {
            debugMessage("Node structure not valid", `Node ${struct.title} missing input parameter ${p.param} [type ${p.type}].`)
            return false;
        }

    for(let p of f.out)
        if (!this.validateParameter(p, struct.out))
        {
            debugMessage("Node structure not valid", `Node ${struct.title} missing output parameter ${p.param} [type ${p.type}].`)
            return false;
        }

    return true;
}


function sortParameters(structParams: ConnectorInterface[], templateParams: ConnectorInterface[]) {
    let params = [];
    for(let p of templateParams)
        for(let sp of structParams)
            if (p.param == sp.param)    
                params.push(sp);

    return params
}


function sortConnectors(struct: EditorFunction, funcDefs: {[name: string]: EditorFunction}) {
    struct.in = sortParameters(struct.in, funcDefs[struct.title].in);
    struct.out = sortParameters(struct.out, funcDefs[struct.title].out);
}


function updateStructure(struct: EditorFunction, funcDefs: {[name: string]: EditorFunction}) {
    struct.description = funcDefs[struct.title].description;
    struct.disabled = funcDefs[struct.title].disabled;
    sortConnectors(struct, funcDefs);
}


function validateConnection(inputNode: string, outNode: string, nodes: { [name: string]: EditorNode } ) {
    if (!(inputNode in nodes && outNode in nodes))
        return false;
    return true;
}


function load(contents: string, funcDefs: {[name: string]: EditorFunction}) {
    let connections: { [name: string]: Connection } = {};
    let nodes: { [name: string]: EditorNode } = {};


    let data = JSON.parse(contents);

    for(let node of data) {
        if (validateStructure(node, funcDefs)) {                  
            updateStructure(node, funcDefs);
        } else {
            node["disabled"] = true;
        }
        
        let n = EditorNode.load(node);
        nodes[n.id] = n;
    }

    for(let node of data) {
        for(let param of node.in) {
            for(let conn of param.connections) {
                if (!validateConnection(conn.out.node, conn.in.node, nodes))
                    continue;
                
                let outConn = nodes[conn.out.node].getConnector(ConnectorType.output, conn.out.connector);
                let inConn = nodes[conn.in.node].getConnector(ConnectorType.input, conn.in.connector);
                Connection.load(outConn, inConn, connections);
            }
        }
    }

    return {
        nodes: nodes,
        connections: connections
    };
}


