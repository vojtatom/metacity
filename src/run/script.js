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
var ConnectorType;
(function (ConnectorType) {
    ConnectorType[ConnectorType["input"] = 0] = "input";
    ConnectorType[ConnectorType["output"] = 1] = "output";
})(ConnectorType || (ConnectorType = {}));
class Connector {
    constructor(parameter, type, inout, editor, node) {
        this.parameter = parameter;
        this.type = type;
        this.inout = inout;
        this.editor = editor;
        this.node = node;
        this.connections = {};
    }
    html() {
        this.element = document.createElement("div");
        this.element.classList.add("connector");
        this.element.style.width = Connector.connectorSize + "px";
        this.element.title = this.parameter;
        this.element.onmousedown = (ev) => this.mousedown(ev);
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
    mousedown(ev) {
        if (this.editor.stagedConnection) {
            let conn = this.editor.stagedConnection;
            if (conn.connect(this)) {
                conn.draw();
                this.editor.stagedConnection = null;
            }
            else {
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
        for (let conn in this.connections)
            this.connections[conn].remove();
    }
    drawConnenctions() {
        for (let conn in this.connections)
            this.connections[conn].draw();
    }
    get serialized() {
        let connections = [];
        for (let conn in this.connections) {
            connections.push(this.connections[conn].serialized);
        }
        return {
            param: this.parameter,
            type: this.type,
            inout: this.inout,
            node: this.node.id,
            connections: connections
        };
    }
}
Connector.connectorSize = 20;
class EditorNode {
    constructor(title, x, y, inParams, outParams, editor, id) {
        this.pos = {
            x: x,
            y: y
        };
        if (id)
            this.id = id;
        else
            this.id = "Node" + EditorNode.idCounter;
        this.selected = false;
        this.title = title;
        this.editor = editor;
        this.inParams = Array.from(inParams, (con) => new Connector(con.param, con.type, ConnectorType.input, editor, this));
        this.outParams = Array.from(outParams, (con) => new Connector(con.param, con.type, ConnectorType.output, editor, this));
        EditorNode.idCounter++;
        this.html();
        this.editor.registerNode(this);
    }
    html() {
        this.element = document.createElement("div");
        this.element.id = this.id;
        this.element.classList.add("node");
        let title = document.createElement("div");
        title.innerHTML = this.title;
        title.classList.add("title");
        title.title = this.id;
        let inputParam = this.paramsConatiner(this.inParams);
        let outputParam = this.paramsConatiner(this.outParams);
        let params = document.createElement("div");
        params.classList.add("params");
        this.element.appendChild(title);
        params.appendChild(inputParam);
        params.appendChild(outputParam);
        this.element.appendChild(params);
        this.applyTransform();
        this.element.onmousedown = (ev) => this.mousedown(ev);
    }
    paramsConatiner(params) {
        let container = document.createElement("div");
        container.classList.add("connectors");
        container.style.height = Connector.connectorSize + "px";
        for (let param of params) {
            container.appendChild(param.html());
        }
        return container;
    }
    mousedown(ev) {
        if (ev.button == 0) {
            if (this.selected)
                this.deselect();
            else
                this.select();
        }
        else if (ev.button == 2) {
            this.remove();
        }
        ev.stopPropagation();
        ev.preventDefault();
    }
    select() {
        this.selected = true;
        this.editor.selectedNodes[this.id] = this;
        this.element.classList.add("selected");
    }
    deselect() {
        this.selected = false;
        delete this.editor.selectedNodes[this.id];
        this.element.classList.remove("selected");
    }
    move(dx, dy) {
        this.pos.x += dx;
        this.pos.y += dy;
        this.applyTransform();
        for (let param of this.inParams)
            param.drawConnenctions();
        for (let param of this.outParams)
            param.drawConnenctions();
    }
    remove() {
        for (let param of this.inParams)
            param.removeAllConnections();
        for (let param of this.outParams)
            param.removeAllConnections();
        this.editor.deregisterNode(this);
    }
    applyTransform() {
        this.element.style.transform = 'translate(' + this.pos.x + 'px, ' + this.pos.y + 'px)';
    }
    get serialized() {
        let inPars = [];
        for (let param of this.inParams)
            inPars.push(param.serialized);
        let outPars = [];
        for (let param of this.outParams)
            outPars.push(param.serialized);
        return {
            title: this.title,
            id: this.id,
            pos: {
                x: this.pos.x,
                y: this.pos.y
            },
            inParameters: inPars,
            outParameters: outPars
        };
    }
    getConnector(inout, param) {
        let connectors = inout == ConnectorType.input ? this.inParams : this.outParams;
        for (let conn of connectors)
            if (conn.parameter == param)
                return conn;
    }
    static load(data, editor) {
        let node = new EditorNode(data.title, data.pos.x, data.pos.y, data.inParameters, data.outParameters, editor, data.id);
        let id = data.id;
        let num = Number(id.slice(4));
        EditorNode.idCounter = Math.max(EditorNode.idCounter, num + 1);
        return node;
    }
}
EditorNode.idCounter = 0;
class Connection {
    constructor(source, x, y, svg) {
        this.svg = svg;
        if (source.inout == ConnectorType.input) {
            this.out = null;
            this.in = source;
        }
        else {
            this.out = source;
            this.in = null;
        }
        this.pos = {
            x: x,
            y: y
        };
        this.html();
    }
    static key(outConn, inConn) {
        return outConn.node.id + outConn.parameter + "---" + inConn.node.id + inConn.parameter;
    }
    get key() {
        return Connection.key(this.out, this.in);
    }
    connect(conn) {
        let sourceConn;
        let key;
        if (this.in) {
            sourceConn = this.in;
            key = Connection.key(conn, this.in);
            if (conn.inout == ConnectorType.input)
                return false;
        }
        else {
            sourceConn = this.out;
            key = Connection.key(this.out, conn);
            if (conn.inout == ConnectorType.output)
                return false;
        }
        if (sourceConn.type != conn.type)
            return false;
        if (key in sourceConn.editor.connections)
            return false;
        if (this.in)
            this.out = conn;
        else
            this.in = conn;
        for (let conn in this.in.connections) {
            this.in.connections[conn].remove();
        }
        this.in.connections[key] = this;
        this.out.connections[key] = this;
        this.in.node.editor.connections[key] = this;
        return true;
    }
    remove() {
        this.svg.removeChild(this.element);
        this.svg.removeChild(this.selecElement);
        if (this.in && this.out) {
            let key = this.key;
            delete this.in.connections[key];
            delete this.out.connections[key];
            delete this.in.node.editor.connections[key];
        }
    }
    html() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.element.classList.add("connection");
        this.selecElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.selecElement.onmousedown = (ev) => this.mousedown(ev);
        this.selecElement.classList.add("fatline");
        this.svg.appendChild(this.element);
        this.svg.appendChild(this.selecElement);
    }
    mousedown(ev) {
        if (this.in && this.out) {
            if (ev.button == 0) {
                let posIn = this.in.pos;
                let posOut = this.out.pos;
                let distIn = (posIn.x - ev.clientX) * (posIn.x - ev.clientX) + (posIn.y - ev.clientY) * (posIn.y - ev.clientY);
                let distOut = (posOut.x - ev.clientX) * (posOut.x - ev.clientX) + (posOut.y - ev.clientY) * (posOut.y - ev.clientY);
                this.remove();
                let source;
                if (distIn < distOut) {
                    this.in = null;
                    source = this.out;
                }
                else {
                    this.out = null;
                    source = this.in;
                }
                this.pos = {
                    x: ev.clientX,
                    y: ev.clientY
                };
                source.node.editor.stagedConnection = this;
                this.html();
                this.move(0, 0);
            }
            else if (ev.button == 2) {
                this.remove();
            }
            ev.preventDefault();
            ev.stopPropagation();
        }
    }
    move(dx, dy) {
        this.pos.x += dx;
        this.pos.y += dy;
        if (this.in && this.out) {
            this.draw();
        }
        else if (this.in) {
            let inpos = this.in.pos;
            this.redraw(this.pos.x, this.pos.y, inpos.x, inpos.y);
        }
        else if (this.out) {
            let outpos = this.out.pos;
            this.redraw(outpos.x, outpos.y, this.pos.x, this.pos.y);
        }
    }
    draw() {
        let inpos = this.in.pos;
        let outpos = this.out.pos;
        this.redraw(outpos.x, outpos.y, inpos.x, inpos.y);
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
        this.element.setAttribute('d', d);
        this.selecElement.setAttribute('d', d);
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
        };
    }
    static load(outConn, inConn, editor) {
        let connection = new Connection(outConn, 0, 0, editor.svg);
        connection.connect(inConn);
        connection.draw();
    }
}
class EditorFunction {
    constructor(title, inConn, outConn, panel) {
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
        element.onmousedown = (ev) => {
            let node = new EditorNode(this.title, ev.x, ev.y, this.inConn, this.outConn, this.panel.editor);
            node.select();
            ev.preventDefault();
            ev.stopPropagation();
        };
        element.onmouseup = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
        };
        this.element = element;
    }
}
class FunctionPanel {
    constructor(editor) {
        this.editor = editor;
        this.functions = [];
        this.html();
        let dm = DataManager.getInstance();
        dm.send({
            'command': 'load_functions'
        }, (data) => this.initFunctions(data));
    }
    html() {
        let sidebar = document.createElement("div");
        sidebar.id = "functions";
        sidebar.classList.add("sidebar");
        this.element = sidebar;
        this.editor.element.appendChild(sidebar);
    }
    initFunctions(data) {
        for (let func in data) {
            let funcInfo = data[func];
            this.functions.push(new EditorFunction(funcInfo.title, funcInfo.in, funcInfo.out, this));
        }
    }
}
class Editor {
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
    init(element, svg) {
        this.element = element;
        this.svg = svg;
        this.element.onmousedown = (ev) => this.mousedown(ev);
        this.element.onmousemove = (ev) => this.mousemove(ev);
        this.element.onmouseup = (ev) => this.mouseup(ev);
        this.functions = new FunctionPanel(this);
    }
    registerNode(node) {
        this.nodes[node.id] = node;
        this.element.appendChild(node.element);
    }
    deregisterNode(node) {
        this.element.removeChild(node.element);
        delete this.nodes[node.id];
    }
    mousedown(ev) {
        if (this.stagedConnection) {
            this.stagedConnection.remove();
            this.stagedConnection = null;
        }
        ev.stopPropagation();
        ev.preventDefault();
    }
    mousemove(ev) {
        let dx = ev.clientX - this.mouse.x;
        let dy = ev.clientY - this.mouse.y;
        for (let node in this.selectedNodes)
            this.selectedNodes[node].move(dx, dy);
        this.mouse.x = ev.clientX;
        this.mouse.y = ev.clientY;
        if (this.stagedConnection)
            this.stagedConnection.move(dx, dy);
    }
    mouseup(ev) {
        for (let node in this.selectedNodes)
            this.selectedNodes[node].deselect();
    }
    get serialized() {
        let nodes = [];
        for (let node in this.nodes)
            nodes.push(this.nodes[node].serialized);
        return JSON.stringify(nodes);
    }
    load(contents) {
        try {
            let data = JSON.parse(contents);
            this.clear();
            for (let node of data)
                EditorNode.load(node, this);
            for (let node of data)
                for (let param of node.inParameters)
                    for (let conn of param.connections) {
                        let outConn = this.nodes[conn.out.node].getConnector(ConnectorType.output, conn.out.connector);
                        let inConn = this.nodes[conn.in.node].getConnector(ConnectorType.input, conn.in.connector);
                        Connection.load(outConn, inConn, this);
                    }
        }
        catch (error) {
            alert("File corrupted, cannot be loaded");
        }
    }
    clear() {
        for (let node in this.nodes)
            this.nodes[node].remove();
        this.stagedConnection = null;
    }
}
const { ipcRenderer, remote } = require('electron');
const dialog = remote.dialog;
const fs = require('fs');
let editor = new Editor();
let dm = DataManager.getInstance();
dm.setupInstance((data) => {
    console.log('got from server', data);
});
window.onload = function () {
    let editorDom = document.getElementById("editor");
    let editorSVG = document.getElementById("svgeditor");
    editor.init(editorDom, editorSVG);
};
let saveProject = () => {
    let content = editor.serialized;
    let options = {
        defaultPath: 'project.json',
        filters: [{
                extensions: ['json']
            }]
    };
    dialog.showSaveDialog(options).then((result) => {
        let filename = result.filePath;
        if (filename === undefined) {
            return;
        }
        fs.writeFile(filename, content, (err) => {
            if (err) {
                return;
            }
        });
    }).catch((err) => {
        alert(err);
    });
};
let openProject = () => {
    let options = {
        filters: [{
                extensions: ['json']
            }]
    };
    dialog.showOpenDialog(options).then((result) => {
        let filename = result.filePaths[0];
        if (filename === undefined) {
            return;
        }
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                throw err;
            }
            const content = data;
            editor.load(content);
        });
    }).catch((err) => {
        alert(err);
    });
};
let runProject = () => {
    let content = editor.serialized;
    dm.send({
        command: 'run',
        graph: content
    });
};
ipcRenderer.on('editor', (event, command) => {
    switch (command) {
        case 'save':
            saveProject();
            break;
        case 'open':
            openProject();
            break;
        case 'run':
            runProject();
            break;
        default:
            break;
    }
});
//# sourceMappingURL=script.js.map