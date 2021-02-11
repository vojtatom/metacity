class ReconnectingWebSocket {
    constructor(url, protocols = []) {
        this.debug = false;
        this.reconnectInterval = 1000;
        this.timeoutInterval = 2000;
        this.forcedClose = false;
        this.timedOut = false;
        this.protocols = [];
        this.onopen = function (event) { };
        this.onclose = function (event) { };
        this.onconnecting = function () { };
        this.onmessage = function (event) { };
        this.onerror = function (event) { };
        this.url = url;
        this.protocols = protocols;
        this.readyState = WebSocket.CONNECTING;
        this.connect(false);
    }
    connect(reconnectAttempt) {
        this.ws = new WebSocket(this.url, this.protocols);
        this.onconnecting();
        this.log('ReconnectingWebSocket', 'attempt-connect', this.url);
        var localWs = this.ws;
        var timeout = setTimeout(() => {
            this.log('ReconnectingWebSocket', 'connection-timeout', this.url);
            this.timedOut = true;
            localWs.close();
            this.timedOut = false;
        }, this.timeoutInterval);
        this.ws.onopen = (event) => {
            clearTimeout(timeout);
            this.log('ReconnectingWebSocket', 'onopen', this.url);
            this.readyState = WebSocket.OPEN;
            reconnectAttempt = false;
            this.onopen(event);
        };
        this.ws.onclose = (event) => {
            clearTimeout(timeout);
            this.ws = null;
            if (this.forcedClose) {
                this.readyState = WebSocket.CLOSED;
                this.onclose(event);
            }
            else {
                this.readyState = WebSocket.CONNECTING;
                this.onconnecting();
                if (!reconnectAttempt && !this.timedOut) {
                    this.log('ReconnectingWebSocket', 'onclose', this.url);
                    this.onclose(event);
                }
                setTimeout(() => {
                    this.connect(true);
                }, this.reconnectInterval);
            }
        };
        this.ws.onmessage = (event) => {
            this.log('ReconnectingWebSocket', 'onmessage', this.url, event.data);
            this.onmessage(event);
        };
        this.ws.onerror = (event) => {
            this.log('ReconnectingWebSocket', 'onerror', this.url, event);
            this.onerror(event);
        };
    }
    send(data) {
        if (this.ws) {
            this.log('ReconnectingWebSocket', 'send', this.url, data);
            return this.ws.send(data);
        }
        else {
            throw 'INVALID_STATE_ERR : Pausing to reconnect websocket';
        }
    }
    close() {
        if (this.ws) {
            this.forcedClose = true;
            this.ws.close();
            return true;
        }
        return false;
    }
    refresh() {
        if (this.ws) {
            this.ws.close();
            return true;
        }
        return false;
    }
    log(...args) {
        if (this.debug || ReconnectingWebSocket.debugAll) {
            console.debug.apply(console, args);
        }
    }
}
ReconnectingWebSocket.debugAll = false;
class DataManager {
    constructor() {
        this.callbacks = [];
    }
    setupInstance(recieveCallback) {
        this.rc = recieveCallback;
        let socket = new ReconnectingWebSocket('ws://localhost:9003');
        socket.onmessage = (event) => {
            let data = JSON.parse(event.data);
            for (let i = 0, len = this.callbacks.length; i < len; ++i) {
                this.callbacks[i](data);
            }
            this.callbacks.length = 0;
            this.rc(data);
        };
        socket.onerror = (e) => {
            console.error(e);
        };
        this.socket = socket;
    }
    static getInstance() {
        if (!DataManager.instance) {
            DataManager.instance = new DataManager();
        }
        return DataManager.instance;
    }
    send(data, callbacks) {
        if (this.socket.readyState === 1) {
            if (Array.isArray(callbacks))
                for (let c of callbacks)
                    this.callbacks.push(callbacks);
            else if (callbacks)
                this.callbacks.push(callbacks);
            console.log('sending', data);
            this.socket.send(JSON.stringify(data));
        }
        else {
            setTimeout(() => {
                this.send(data, callbacks);
            }, 1000);
        }
    }
}
class EditorHTMLTemplate {
    constructor(parent) {
        this.mouse = {
            x: 0,
            y: 0
        };
        this.moveActive = () => { };
        this.clearSelectedNodes = () => { };
        const editor = `
        <div id="nodes">
            <div id="nodeArea">
                <div id="functionPanel"></div>
                <svg width="100%" height="100%" id="svgEditor"></svg>
                <div id="nodePanel"></div>
            </div>
        </div>
        <div id="actionPanel"></div>
        `;
        this.parentHTML = parent;
        this.parentHTML.innerHTML = editor;
        this.functionPanelHTML = document.getElementById("functionPanel");
        this.nodeAreaHTML = document.getElementById("nodeArea");
        this.nodeAreaSVG = document.getElementById("svgEditor");
        this.nodePanelHTML = document.getElementById("nodePanel");
        this.actionPanel = document.getElementById("actionPanel");
        this.nodeAreaHTML.onmousedown = (ev) => this.mousedown(ev);
        this.nodeAreaHTML.onmousemove = (ev) => this.mousemove(ev);
        this.nodeAreaHTML.onmouseup = (ev) => this.mouseup(ev);
    }
    addFunctionToPanel(data, onmousedown) {
        const func = `
        <div class="function">
            <div class="icon"></div>
            <div class="labels">
                <div class="title">${data.title}</div>
                <div class="description">${data.description}</div>
            </div>
        </div>   
        `;
        this.functionPanelHTML.insertAdjacentHTML("beforeend", func);
        let funcHTML = this.functionPanelHTML.lastElementChild;
        console.log(funcHTML);
        funcHTML.onmousedown = onmousedown;
        funcHTML.onmouseup = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
        };
    }
    mousedown(ev) {
        if (!this.stagedConnection)
            return;
        this.nodeAreaSVG.removeChild(this.stagedConnection.connHTML.line);
        this.nodeAreaSVG.removeChild(this.stagedConnection.connHTML.selectLine);
        this.stagedConnection = null;
        ev.stopPropagation();
        ev.preventDefault();
    }
    mousemove(ev) {
        let dx = ev.clientX - this.mouse.x;
        let dy = ev.clientY - this.mouse.y;
        this.mouse.x = ev.clientX;
        this.mouse.y = ev.clientY;
        this.moveActive(dx, dy);
    }
    mouseup(ev) {
        this.clearSelectedNodes();
    }
}
class NodeHTMLTemplate {
    constructor(node, x, y) {
        this.pos = {
            x: 0,
            y: 0
        };
        const nodeHTML = `
            <div class="node" id="${node.id}">
                <div class="title">${node.title}</div>
                <div class="params">
                    <div class="connectors">
                        ${node.inParams.map(param => `<div class="connector in" title="${param.parameter}"></div>`).join('')}
                    </div>
                    <div class="connectors">
                        ${node.outParams.map(param => `<div class="connector out" title="${param.parameter}"></div>`).join('')}
                    </div>
                </div>
            </div>   
            `;
        let area = NodeEditor.instance.ui.nodeAreaHTML;
        area.insertAdjacentHTML("beforeend", nodeHTML);
        this.nodeHTML = area.lastElementChild;
        this.pos.x = x;
        this.pos.y = y;
        let inParamHTMLs = this.nodeHTML.lastElementChild.firstElementChild.children;
        let outParamHTMLs = this.nodeHTML.lastElementChild.lastElementChild.children;
        let connectionLink = (paramHTML, param) => {
            for (let i = 0; i < paramHTML.length; ++i) {
                paramHTML[i].onmousedown = (ev) => {
                    node.addConnection(paramHTML[i], param[i], ev.x, ev.y);
                    ev.preventDefault();
                    ev.stopPropagation();
                };
            }
        };
        connectionLink(inParamHTMLs, node.inParams);
        connectionLink(outParamHTMLs, node.outParams);
        this.nodeHTML.onmousedown = () => {
            NodeEditor.instance.selectNode(this.nodeHTML.id);
        };
        this.move = (dx, dy) => {
            console.log('moving node', dx, dy);
            this.pos.x += dx;
            this.pos.y += dy;
            this.applyTransform();
            for (let param of node.inParams)
                param.drawConnections();
            for (let param of node.outParams)
                param.drawConnections();
        };
        this.applyTransform();
    }
    applyTransform() {
        this.nodeHTML.style.transform = 'translate(' + this.pos.x + 'px, ' + this.pos.y + 'px)';
    }
}
class ConnectionHTMLTemplate {
    constructor(conn, x, y) {
        this.pos = {
            x: 0,
            y: 0
        };
        this.line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.line.classList.add("connection");
        this.selectLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.selectLine.onmousedown = (ev) => {
            if (conn.in && conn.out) {
                if (ev.button == 0) {
                    let posIn = conn.in.pos;
                    let posOut = conn.out.pos;
                    let distIn = (posIn.x - ev.clientX) * (posIn.x - ev.clientX) + (posIn.y - ev.clientY) * (posIn.y - ev.clientY);
                    let distOut = (posOut.x - ev.clientX) * (posOut.x - ev.clientX) + (posOut.y - ev.clientY) * (posOut.y - ev.clientY);
                    conn.remove();
                    let source;
                    if (distIn < distOut) {
                        conn.in = null;
                        source = conn.out;
                    }
                    else {
                        conn.out = null;
                        source = conn.in;
                    }
                    this.pos = {
                        x: ev.clientX,
                        y: ev.clientY
                    };
                    NodeEditor.instance.ui.stagedConnection = conn;
                    this.move(0, 0);
                }
                else if (ev.button == 2) {
                    conn.remove();
                }
                ev.preventDefault();
                ev.stopPropagation();
            }
        };
        this.selectLine.classList.add("fatline");
        NodeEditor.instance.ui.nodeAreaSVG.appendChild(this.line);
        NodeEditor.instance.ui.nodeAreaSVG.appendChild(this.selectLine);
        this.pos.x = x;
        this.pos.y = y;
        this.move = (dx, dy) => {
            this.pos.x += dx;
            this.pos.y += dy;
            let inpos, outpos;
            if (conn.in && conn.out) {
                inpos = conn.in.pos;
                outpos = conn.out.pos;
            }
            else if (conn.in) {
                inpos = conn.in.pos;
                outpos = this.pos;
                this.redraw(this.pos.x, this.pos.y, inpos.x, inpos.y);
            }
            else if (conn.out) {
                inpos = this.pos;
                outpos = conn.out.pos;
            }
            this.redraw(outpos.x, outpos.y, inpos.x, inpos.y);
        };
    }
    redraw(inx, iny, outx, outy) {
        let handle = Math.min(Math.max((outy - iny) / 2 - 10, 0), 100);
        let startx = inx;
        let starty = iny;
        let endx = outx;
        let endy = outy;
        let d = 'M' + startx + ' ' + starty;
        d += ' C ' + (startx) + ' ' + (starty + handle) + ', ' + (endx) + ' ' + (endy - handle);
        d += ', ' + endx + ' ' + endy;
        this.line.setAttribute('d', d);
        this.selectLine.setAttribute('d', d);
    }
}
var ConnectorType;
(function (ConnectorType) {
    ConnectorType[ConnectorType["input"] = 0] = "input";
    ConnectorType[ConnectorType["output"] = 1] = "output";
})(ConnectorType || (ConnectorType = {}));
class Connection {
    constructor(source, x, y) {
        if (source.inout == ConnectorType.input) {
            this.out = null;
            this.in = source;
        }
        else {
            this.out = source;
            this.in = null;
        }
        this.connHTML = new ConnectionHTMLTemplate(this, x, y);
    }
    static key(connA, connB) {
        if (connA.inout == ConnectorType.input)
            return connB.node.id + connB.parameter + "---" + connA.node.id + connA.parameter;
        else
            return connA.node.id + connA.parameter + "---" + connB.node.id + connB.parameter;
    }
    get key() {
        return Connection.key(this.out, this.in);
    }
    connect(conn) {
        let sourceConn = this.in ? this.in : this.out;
        let key = Connection.key(sourceConn, conn);
        if (conn.inout + sourceConn.inout != ConnectorType.input + ConnectorType.output)
            return false;
        if (sourceConn.type != conn.type)
            return false;
        if (NodeEditor.instance.connectionExists(key))
            return false;
        if (this.in)
            this.out = conn;
        else
            this.in = conn;
        for (let conn in this.in.connections)
            this.in.connections[conn].remove();
        this.in.connections[key] = this;
        this.out.connections[key] = this;
        NodeEditor.instance.addConnection(this);
        return true;
    }
    remove() {
        if (this.in && this.out) {
            let key = this.key;
            delete this.in.connections[key];
            delete this.out.connections[key];
            NodeEditor.instance.removeConnection(key);
        }
    }
    move(dx, dy) {
        this.connHTML.move(dx, dy);
    }
}
class Connector {
    constructor(structure, inout, node) {
        this.connections = {};
        this.parameter = structure.param;
        this.type = structure.type;
        this.inout = inout;
        this.node = node;
        this.value = structure.value ? structure.value : null;
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
    constructor(structure, x, y, id) {
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
    move(dx, dy) {
        this.nodeHTML.move(dx, dy);
    }
    addConnection(paramHTML, param, x, y) {
        if (NodeEditor.instance.ui.stagedConnection) {
            let conn = NodeEditor.instance.ui.stagedConnection;
            if (conn.connect(param)) {
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
EditorNode.idCounter = 0;
class NodeEditor {
    constructor() {
        this.nodes = {};
        this.connections = {};
        this.selectedNodes = {};
    }
    static get instance() {
        if (!this.instanceObject) {
            this.instanceObject = new this();
        }
        return this.instanceObject;
    }
    init(parent) {
        this.editorHTML = new EditorHTMLTemplate(parent);
        this.editorHTML.moveActive = (dx, dy) => {
            for (let node in this.selectedNodes)
                this.selectedNodes[node].move(dx, dy);
            if (this.editorHTML.stagedConnection)
                this.editorHTML.stagedConnection.move(dx, dy);
        };
        this.editorHTML.clearSelectedNodes = () => {
            for (let nodeID in this.selectedNodes) {
                this.selectedNodes[nodeID].deselect();
                delete this.selectedNodes[nodeID];
            }
        };
        let dm = DataManager.getInstance();
        dm.send({
            'command': 'load_functions'
        }, (data) => this.initFunctions(data));
    }
    initFunctions(data) {
        for (let func in data) {
            let funcInfo = data[func];
            this.editorHTML.addFunctionToPanel(funcInfo, (ev) => {
                let node = new EditorNode(funcInfo, ev.x, ev.y);
                this.nodes[node.id] = node;
                node.select();
                console.log(node);
                ev.preventDefault();
                ev.stopPropagation();
            });
        }
    }
    selectNode(nodeID) {
        this.selectedNodes[nodeID] = this.nodes[nodeID];
    }
    connectionExists(key) {
        return key in this.connections;
    }
    addConnection(connection) {
        this.connections[connection.key] = connection;
    }
    removeConnection(connectionID) {
        delete this.connections[connectionID];
    }
    get ui() {
        return this.editorHTML;
    }
}
const { ipcRenderer, remote } = require('electron');
const dialog = remote.dialog;
const fs = require('fs');
let dm = DataManager.getInstance();
dm.setupInstance((data) => {
    console.log('got from server', data);
});
window.onload = function () {
    let editorDom = document.getElementById("editor");
    let editorSVG = document.getElementById("svgeditor");
    let editor = NodeEditor.instance.init(editorDom);
};
//# sourceMappingURL=script.js.map