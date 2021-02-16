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
    static get instance() {
        if (!DataManager.instanceObject) {
            DataManager.instanceObject = new DataManager();
        }
        return DataManager.instanceObject;
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
let colorScheme = {
    colors: [
        [159, 237, 215],
        [254, 249, 199],
        [252, 225, 129]
    ],
    gray: [237, 234, 229],
    black: [10, 10, 10]
};
function createStyleRule(name, i, length) {
    let colorIdx = (i / (length - 1)) * (colorScheme.colors.length - 1);
    let colorA = Math.floor(colorIdx);
    let colorB = Math.ceil(colorIdx);
    let t = colorIdx - colorA;
    return `.connector.${name} {
        background: rgb(${colorScheme.colors[colorA].map((v, i) => v * (1 - t) + colorScheme.colors[colorB][i] * t).join(", ")});
    }`;
}
class EditorHTMLTemplate {
    constructor(parent) {
        this.mouse = {
            x: 0,
            y: 0
        };
        this.functionMenu = [];
        this.transform = {
            zoom: 1,
            x: 0,
            y: 0,
        };
        this.moveArea = false;
        this.moveActive = () => { };
        this.clearSelectedNodes = () => { };
        const editor = `
        <div id="nodes">
            <div id="functionPanel">
                <div id="functionSearchBar">
                    <label for="functionSearch">Search</label>
                    <input type="text" id="functionSearch" name="functionSearch" placeholder="Node name or description">
                    <div id="clearFunctionSearch">&#8612;</div>
                </div>
                <div id="functionActions">
                    <div class="functionAction" id="functionReloadAction">Reaload Nodes</div>
                    <div class="functionAction" id="functionNewScriptAction">New Script</div>
                    <div class="functionAction" id="functionOpenFolderAction">Open Script Folder</div>
                </div>
                <div id="functionList"></div>
            </div>
            <div id="nodeArea">
                <svg width="100%" height="100%" id="svgEditor"></svg>
            </div>
        </div>
        <div id="actionPanel">
            <div id="openProjectButton">Open</div>
            <div id="saveProjectButton">Save</div>
            <div id="runProjectButton" class="delimiter">Run</div>
            <div id="addNodeButton">Nodes</div>
        </div>
        `;
        this.parentHTML = parent;
        this.parentHTML.innerHTML = editor;
        this.functionPanelHTML = document.getElementById("functionPanel");
        this.functionListHTML = document.getElementById("functionList");
        this.editorAreaHTML = document.getElementById("nodes");
        this.nodeAreaHTML = document.getElementById("nodeArea");
        this.nodeAreaSVG = document.getElementById("svgEditor");
        this.actionPanel = document.getElementById("actionPanel");
        this.editorAreaHTML.onmousedown = (ev) => this.mousedown(ev);
        this.editorAreaHTML.onmousemove = (ev) => this.mousemove(ev);
        this.editorAreaHTML.onmouseup = (ev) => this.mouseup(ev);
        this.editorAreaHTML.onwheel = (ev) => this.wheel(ev);
        this.setupFunctionDialog();
        this.setupBottomMenu();
        this.resize();
    }
    get mousePosition() {
        let offsetX = (this.mouse.x - this.start.x - this.center.x - this.transform.x) / this.transform.zoom;
        let offsetY = (this.mouse.y - this.start.y - this.center.y - this.transform.y) / this.transform.zoom;
        let x = this.center.x + offsetX;
        let y = this.center.y + offsetY;
        return { x: x, y: y };
    }
    toggleFunctionPanel() {
        let nodes = document.getElementById("addNodeButton");
        if (this.functionPanelHTML.style.display == 'none') {
            nodes.classList.add('active');
            this.functionPanelHTML.style.display = 'block';
        }
        else {
            nodes.classList.remove('active');
            this.functionPanelHTML.style.display = 'none';
        }
    }
    addFunctionToPanel(data, onmousedown) {
        const func = `
        <div class="function">
            <div class="labels">
                <div class="title">${data.title}</div>
                <div class="description">${data.description}</div>
            </div>
        </div>   
        `;
        this.functionListHTML.insertAdjacentHTML("beforeend", func);
        let funcHTML = this.functionPanelHTML.lastElementChild;
        funcHTML.onmousedown = (ev) => {
            if (ev.button == 0) {
                this.toggleFunctionPanel();
                this.setMouse(ev);
                let pos = this.mousePosition;
                onmousedown(pos.x, pos.y);
                ev.preventDefault();
                ev.stopPropagation();
            }
        };
        funcHTML.onmouseup = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
        };
        this.functionMenu.push({
            label: data.title + ' ' + data.description + ' ' + usesTypes(data).join(' '),
            html: funcHTML
        });
    }
    clearFunctionList() {
        this.functionMenu = [];
        this.functionListHTML.innerHTML = "";
    }
    setupFunctionDialog() {
        let input = document.getElementById("functionSearch");
        let clear = document.getElementById("clearFunctionSearch");
        let reload = document.getElementById("functionReloadAction");
        input.onkeyup = (ev) => {
            let query = input.value;
            if (query == '')
                this.functionMenu.map(v => v.html.style.display = 'block');
            else
                this.functionMenu.map(v => v.label.includes(query) ?
                    v.html.style.display = 'block' :
                    v.html.style.display = 'none');
        };
        clear.onclick = () => {
            input.value = '';
            this.functionMenu.map(v => v.html.style.display = 'block');
        };
        reload.onclick = () => {
            this.clearFunctionList();
            DataManager.instance.send({
                'command': 'load_functions'
            }, (data) => NodeEditor.instance.initFunctions(data));
        };
    }
    setupBottomMenu() {
        let nodes = document.getElementById("addNodeButton");
        nodes.onclick = (ev) => this.toggleFunctionPanel();
        this.functionPanelHTML.style.display = 'none';
        let open = document.getElementById("openProjectButton");
        open.onclick = (ev) => openProject();
        let save = document.getElementById("saveProjectButton");
        save.onclick = (ev) => saveProject();
        let run = document.getElementById("runProjectButton");
        run.onclick = (ev) => runProject();
    }
    setupStyles(types) {
        let style = document.getElementById("colorScheme");
        if (!style) {
            style = document.createElement('style');
            document.getElementsByTagName('head')[0].appendChild(style);
        }
        style.innerHTML = `
            ${types.map((t, i) => createStyleRule(t, i, types.length)).join("\n\n")}
        `;
    }
    clear() {
        this.stagedConnection = null;
        while (this.nodeAreaHTML.children.length > 1) {
            this.nodeAreaHTML.removeChild(this.nodeAreaHTML.lastElementChild);
        }
    }
    mousedown(ev) {
        if (!this.stagedConnection) {
            this.moveArea = true;
            return;
        }
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
        if (this.moveArea) {
            this.transform.x += dx;
            this.transform.y += dy;
            this.applyTransform();
        }
        else {
            dx = dx / this.transform.zoom;
            dy = dy / this.transform.zoom;
            this.moveActive(dx, dy);
        }
    }
    setMouse(ev) {
        this.mouse.x = ev.clientX;
        this.mouse.y = ev.clientY;
    }
    mouseup(ev) {
        this.clearSelectedNodes();
        this.moveArea = false;
    }
    wheel(ev) {
        let delta = -ev.deltaY / 1000;
        delta = this.transform.zoom + delta > 0.1 ? delta : 0;
        let old_zoom = this.transform.zoom;
        this.transform.zoom = this.transform.zoom + delta;
        this.transform.x = this.transform.x * (this.transform.zoom / old_zoom);
        this.transform.y = this.transform.y * (this.transform.zoom / old_zoom);
        this.applyTransform();
        ev.preventDefault();
    }
    resize() {
        const rect = this.editorAreaHTML.getBoundingClientRect();
        this.center = { x: this.editorAreaHTML.offsetWidth / 2, y: this.editorAreaHTML.offsetHeight / 2 };
        this.start = { x: rect.left, y: rect.top };
    }
    applyTransform() {
        this.nodeAreaHTML.style.transform = 'translate(' + this.transform.x + 'px, '
            + this.transform.y + 'px) scale('
            + this.transform.zoom + ')';
    }
}
function valueHTMLTitle(value) {
    switch (value.type) {
        case 'string':
            return `
                <label for="${value.node.id + value.param}"><span class="title string">${value.param}</span></label>
            `;
        case 'file':
            return `
                <label for="${value.node.id + value.param}"><span class="title file">${value.param}</span></label>
            `;
        case 'number':
            return `
                <label for="${value.node.id + value.param}"><span class="title number">${value.param}</span></label>
            `;
        case 'color':
            return `
            <div class="value color">

            </div>
            `;
        case 'bool':
            return `
                <label for="${value.node.id + value.param}"><span class="title bool">${value.param}</span></label>
            `;
        case 'vec3':
            return `
                <label for="${value.node.id + value.param}"><span class="title vec3">${value.param}</span></label>
            `;
        default:
            break;
    }
}
function valueHTMLValue(value) {
    switch (value.type) {
        case 'string':
            return `
            <div class="value string">
                <input type="text" id="${value.node.id + value.param}" name="${value.node.id + value.param}" value="${value.value}">
            </div>
            `;
        case 'file':
            return `
            <div class="value file">
                    <input type="button" id="${value.node.id + value.param}" name="${value.node.id + value.param}", value="${value.value}">
            </div>
            `;
        case 'number':
            return `
            <div class="value number">
                    <input type="number" id="${value.node.id + value.param}" name="${value.node.id + value.param}" value="${value.value}">
            </div>
            `;
        case 'color':
            return `
            <div class="value color">

            </div>
            `;
        case 'bool':
            return `
            <div class="value bool">
                <label for="${value.node.id + value.param}">
                    <input type="checkbox" id="${value.node.id + value.param}" name="${value.node.id + value.param}" ${value.value ? 'Checked' : ''}>
                    <span class="checkmark"></span>
                </label>
            </div>
            `;
        case 'vec3':
            return `
            <div class="value vec3">
                    <input type="number" id="${value.node.id + value.param + 'x'}" name="${value.node.id + value.param}" value="${value.value[0]}">
                    <input type="number" id="${value.node.id + value.param + 'y'}" name="${value.node.id + value.param}" value="${value.value[1]}">
                    <input type="number" id="${value.node.id + value.param + 'z'}" name="${value.node.id + value.param}" value="${value.value[2]}">
            </div>
            `;
        default:
            break;
    }
}
function nothing(ev) {
    ev.stopPropagation();
}
function setupValueCallbacks(value) {
    switch (value.type) {
        case 'string':
        case 'number':
            let input = document.getElementById(value.node.id + value.param);
            input.onkeyup = (ev) => {
                value.value = input.value;
            };
            input.onmousedown = nothing;
            input.onmousemove = nothing;
            break;
        case 'bool':
            let checkbox = document.getElementById(value.node.id + value.param);
            checkbox.onchange = (ev) => {
                value.value = checkbox.checked;
            };
            checkbox.onmousedown = nothing;
            checkbox.onmousemove = nothing;
        case 'color':
            let color = document.getElementById(value.node.id + value.param);
            break;
        case 'file':
            let file = document.getElementById(value.node.id + value.param);
            file.onclick = (ev) => {
                let options = {
                    defaultPath: value.value
                };
                dialog.showOpenDialog(options).then((result) => {
                    let filename = result.filePaths[0];
                    if (filename === undefined) {
                        return;
                    }
                    file.value = filename;
                    value.value = filename;
                }).catch((err) => {
                    alert(err);
                });
            };
            break;
        case 'vec3':
            let vec3x = document.getElementById(value.node.id + value.param + 'x');
            let vec3y = document.getElementById(value.node.id + value.param + 'y');
            let vec3z = document.getElementById(value.node.id + value.param + 'z');
            let callback = (ev) => {
                value.value = [parseFloat(vec3x.value), parseFloat(vec3y.value), parseFloat(vec3z.value)];
            };
            [vec3x, vec3y, vec3z].map(elem => {
                elem.onkeydown = callback;
                elem.onmousedown = nothing;
                elem.onmousemove = nothing;
            });
        default:
            break;
    }
}
function setupConnector(node, nodeHTML, connectorHTML, param) {
    for (let i = 0; i < connectorHTML.length; ++i) {
        param[i].connHTML = new ConnectorHTMLTemplate(connectorHTML[i], nodeHTML);
        connectorHTML[i].onmousedown = (ev) => {
            node.addConnection(param[i]);
            ev.preventDefault();
            ev.stopPropagation();
        };
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
                <div class="contents">
                    <div class="connectors">
                        ${node.inParams.map(param => `<div class="connector in ${param.type}" title="${param.parameter} [${param.type}]"></div>`).join('')}
                    </div>
                    
                    <div class="values">
                        <div class="values-titles">
                            ${node.values.map(value => valueHTMLTitle(value)).join('')}
                        </div>
                        <div class="values-values">
                            ${node.values.map(value => valueHTMLValue(value)).join('')}
                        </div>
                    </div>
                    <div class="connectors">
                        ${node.outParams.map(param => `<div class="connector out ${param.type}" title="${param.parameter} [${param.type}]"></div>`).join('')}
                    </div>
                </div>   
            </div>   
            `;
        let area = NodeEditor.instance.ui.nodeAreaHTML;
        area.insertAdjacentHTML("beforeend", nodeHTML);
        this.nodeHTML = area.lastElementChild;
        node.values.map(value => setupValueCallbacks(value));
        this.pos.x = x;
        this.pos.y = y;
        let inParamHTMLs = this.nodeHTML.lastElementChild.firstElementChild.children;
        let outParamHTMLs = this.nodeHTML.lastElementChild.lastElementChild.children;
        setupConnector(node, this, inParamHTMLs, node.inParams);
        setupConnector(node, this, outParamHTMLs, node.outParams);
        this.nodeHTML.onmousedown = (ev) => this.onmousedown(ev, node);
        this.move = (dx, dy) => this.onmove(dx, dy, node);
        this.applyTransform();
    }
    applyTransform() {
        this.nodeHTML.style.transform = 'translate(' + this.pos.x + 'px, ' + this.pos.y + 'px)';
    }
    remove() {
        NodeEditor.instance.ui.nodeAreaHTML.removeChild(this.nodeHTML);
    }
    onmousedown(ev, node) {
        if (ev.button == 0) {
            NodeEditor.instance.selectNode(this.nodeHTML.id);
        }
        else if (ev.button == 2) {
            node.remove();
            this.remove();
        }
        ev.preventDefault();
        ev.stopPropagation();
    }
    onmove(dx, dy, node) {
        this.pos.x += dx;
        this.pos.y += dy;
        this.applyTransform();
        for (let param of node.inParams)
            param.drawConnections();
        for (let param of node.outParams)
            param.drawConnections();
    }
    setNotActive() {
        this.nodeHTML.classList.add("nonactive");
    }
    setActive() {
        this.nodeHTML.classList.remove("nonactive");
    }
}
class ConnectorHTMLTemplate {
    constructor(elem, nodeHTML) {
        this.nodeHTML = nodeHTML;
        this.connHTML = elem;
    }
    get pos() {
        let offTop = this.connHTML.offsetTop;
        let offLeft = this.connHTML.offsetLeft;
        let pos = this.nodeHTML.pos;
        return {
            x: pos.x + offLeft + 20 / 2,
            y: pos.y + offTop + 20 / 2
        };
    }
}
class ConnectionHTMLTemplate {
    constructor(connection) {
        this.line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.line.classList.add("connection");
        this.selectLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.selectLine.classList.add("fatline");
        this.selectLine.onmousedown = (ev) => this.onmousedown(ev, connection);
        this.move = () => this.onmove(connection);
        NodeEditor.instance.ui.nodeAreaSVG.appendChild(this.line);
        NodeEditor.instance.ui.nodeAreaSVG.appendChild(this.selectLine);
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
    remove() {
        NodeEditor.instance.ui.nodeAreaSVG.removeChild(this.line);
        NodeEditor.instance.ui.nodeAreaSVG.removeChild(this.selectLine);
    }
    onmousedown(ev, connection) {
        if (connection.in && connection.out) {
            if (ev.button == 0) {
                let posIn = connection.in.connHTML.pos;
                let posOut = connection.out.connHTML.pos;
                let pos = NodeEditor.instance.ui.mousePosition;
                let distIn = (posIn.x - pos.x) * (posIn.x - pos.x) + (posIn.y - pos.y) * (posIn.y - pos.y);
                let distOut = (posOut.x - pos.x) * (posOut.x - pos.x) + (posOut.y - pos.y) * (posOut.y - pos.y);
                connection.deregister();
                let source;
                if (distIn < distOut) {
                    connection.in = null;
                    source = connection.out;
                }
                else {
                    connection.out = null;
                    source = connection.in;
                }
                NodeEditor.instance.ui.stagedConnection = connection;
                this.move();
            }
            else if (ev.button == 2) {
                connection.remove();
            }
            ev.preventDefault();
            ev.stopPropagation();
        }
    }
    ;
    onmove(connection) {
        let inpos, outpos;
        let pos = NodeEditor.instance.ui.mousePosition;
        if (connection.in && connection.out) {
            inpos = connection.in.connHTML.pos;
            outpos = connection.out.connHTML.pos;
        }
        else if (connection.in) {
            inpos = connection.in.connHTML.pos;
            outpos = pos;
            this.redraw(pos.x, pos.y, inpos.x, inpos.y);
        }
        else if (connection.out) {
            inpos = pos;
            outpos = connection.out.connHTML.pos;
        }
        this.redraw(outpos.x, outpos.y, inpos.x, inpos.y);
    }
}
var ConnectorType;
(function (ConnectorType) {
    ConnectorType[ConnectorType["input"] = 0] = "input";
    ConnectorType[ConnectorType["output"] = 1] = "output";
})(ConnectorType || (ConnectorType = {}));
function usesTypes(func) {
    let inputs = func.in.map(val => val.type);
    let outputs = func.out.map(val => val.type);
    return inputs.concat(outputs.filter((item) => inputs.indexOf(item) < 0));
}
class Connection {
    constructor(source) {
        if (source.inout == ConnectorType.input) {
            this.out = null;
            this.in = source;
        }
        else {
            this.out = source;
            this.in = null;
        }
        this.connHTML = new ConnectionHTMLTemplate(this);
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
        if (conn.node.id == sourceConn.node.id)
            return false;
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
        this.in.node.checkRequiredInputs();
        this.out.node.checkRequiredInputs();
        return true;
    }
    deregister() {
        if (this.in && this.out) {
            let key = this.key;
            delete this.in.connections[key];
            delete this.out.connections[key];
            NodeEditor.instance.removeConnection(key);
            this.in.node.checkRequiredInputs();
            this.out.node.checkRequiredInputs();
        }
    }
    remove() {
        this.connHTML.remove();
        this.deregister();
    }
    move(dx, dy) {
        this.connHTML.move();
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
    static load(outConn, inConn) {
        let connection = new Connection(outConn);
        connection.connect(inConn);
        connection.move(0, 0);
    }
}
class Connector {
    constructor(structure, inout, node) {
        this.connections = {};
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
        for (let conn in this.connections)
            this.connections[conn].remove();
    }
    get serialized() {
        let connections = [];
        for (let conn in this.connections)
            connections.push(this.connections[conn].serialized);
        return {
            param: this.parameter,
            type: this.type,
            inout: this.inout,
            node: this.node.id,
            connections: connections
        };
    }
    get connectionCount() {
        return Object.keys(this.connections).length;
    }
}
class NodeValue {
    constructor(value, node) {
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
    constructor(structure, x, y, id) {
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
        this.nodeHTML = new NodeHTMLTemplate(this, x, y);
        this.checkRequiredInputs();
    }
    move(dx, dy) {
        this.nodeHTML.move(dx, dy);
    }
    remove() {
        for (let param of this.inParams)
            param.removeAllConnections();
        for (let param of this.outParams)
            param.removeAllConnections();
        NodeEditor.instance.removeNode(this.id);
    }
    addConnection(param) {
        if (NodeEditor.instance.ui.stagedConnection) {
            let conn = NodeEditor.instance.ui.stagedConnection;
            if (conn.connect(param)) {
                NodeEditor.instance.ui.stagedConnection = null;
                conn.move(0, 0);
            }
            return;
        }
        let connection = new Connection(param);
        NodeEditor.instance.ui.stagedConnection = connection;
    }
    get serialized() {
        return {
            title: this.title,
            id: this.id,
            pos: {
                x: this.nodeHTML.pos.x,
                y: this.nodeHTML.pos.y
            },
            value: this.values.map(v => v.serialized),
            in: this.inParams.map(p => p.serialized),
            out: this.outParams.map(p => p.serialized)
        };
    }
    checkRequiredInputs() {
        for (let connector of this.inParams)
            if (connector.connectionCount == 0) {
                this.nodeHTML.setNotActive();
                return;
            }
        this.nodeHTML.setActive();
    }
    static load(data) {
        let node = new EditorNode(data, data.pos.x, data.pos.y, data.id);
        let id = data.id;
        let num = Number(id.slice(4));
        EditorNode.idCounter = Math.max(EditorNode.idCounter, num + 1);
        return node;
    }
    getConnector(inout, param) {
        let connectors = inout == ConnectorType.input ? this.inParams : this.outParams;
        for (let conn of connectors)
            if (conn.parameter == param)
                return conn;
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
                this.deselectNode(nodeID);
            }
        };
        DataManager.instance.send({
            'command': 'load_functions'
        }, (data) => this.initFunctions(data));
    }
    initFunctions(data) {
        let types = [];
        for (let func in data) {
            let funcInfo = data[func];
            this.editorHTML.addFunctionToPanel(funcInfo, (x, y) => {
                let node = new EditorNode(funcInfo, x, y);
                this.nodes[node.id] = node;
                this.selectNode(node.id);
            });
            types = types.concat(usesTypes(funcInfo).filter((item) => types.indexOf(item) < 0));
        }
        this.editorHTML.setupStyles(types);
    }
    selectNode(nodeID) {
        this.selectedNodes[nodeID] = this.nodes[nodeID];
    }
    deselectNode(nodeID) {
        delete this.selectedNodes[nodeID];
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
    removeNode(nodeID) {
        delete this.nodes[nodeID];
    }
    get ui() {
        return this.editorHTML;
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
            for (let node of data) {
                let n = EditorNode.load(node);
                this.nodes[n.id] = n;
            }
            for (let node of data)
                for (let param of node.in)
                    for (let conn of param.connections) {
                        let outConn = this.nodes[conn.out.node].getConnector(ConnectorType.output, conn.out.connector);
                        let inConn = this.nodes[conn.in.node].getConnector(ConnectorType.input, conn.in.connector);
                        Connection.load(outConn, inConn);
                    }
        }
        catch (error) {
            alert("File corrupted, cannot be loaded");
        }
    }
    clear() {
        for (let node in this.nodes)
            this.nodes[node].remove();
        this.editorHTML.clear();
    }
}
function saveProject() {
    let content = NodeEditor.instance.serialized;
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
}
;
function openProject() {
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
            NodeEditor.instance.load(content);
        });
    }).catch((err) => {
        alert(err);
    });
}
function runProject() {
    let content = NodeEditor.instance.serialized;
    DataManager.instance.send({
        command: 'run',
        graph: content
    });
}
;
const { ipcRenderer, remote } = require('electron');
const dialog = remote.dialog;
const fs = require('fs');
DataManager.instance.setupInstance((data) => {
    console.log('got from server', data);
});
window.onload = function () {
    let editorDom = document.getElementById("editor");
    NodeEditor.instance.init(editorDom);
    ;
};
window.onresize = (ev) => {
    NodeEditor.instance.ui.resize();
};
//# sourceMappingURL=script.js.map