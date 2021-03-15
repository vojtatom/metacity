type SvgInHtml = HTMLElement & SVGElement;


function HTMLElementType() {
    return undefined as HTMLElement;
}

function HTMLInputElementType() {
    return undefined as HTMLInputElement;
}

function SVGPathElementType() {
    return undefined as SVGPathElement;
}

function SVGAElementType() {
    return undefined as SVGAElement;
}

function HTMLCanvasElementType() {
    return undefined as HTMLCanvasElement;
}

const Symbols = {
    cross: '&#10005;',
    erase: '&#8612;',
};

class HTMLContainer {
    elements: {
        [id: string]: HTMLElement | SVGElement | SvgInHtml
    };

    components: {
        [id: string]: HTMLComponent | HTMLComponent[],
    };

    constructor() {
        this.elements = {}
    }
}

abstract class HTMLComponent extends HTMLContainer {
    constructor() {
        super();
    }

    initElements() {

        for (let id in this.elements) {
            this.elements[id] = document.getElementById(id);
        }

        for (let id in this.components) {
            let comp = this.components[id]

            if (comp instanceof StaticHTMLComponent)
                comp.initElements();
        }
    }

    abstract render(): string;

    compile(parent: HTMLElement) {
        let contents = this.render();
        parent.innerHTML += contents;
        this.initElements();
        this.setupComponents();
    }

    private setupComponents() {
        for (let id in this.components) {
            let comp = this.components[id]

            if (comp instanceof StaticHTMLComponent)
                comp.setup();

            if (comp instanceof HTMLComponent)
                comp.setupComponents();
        }
    }

    protected appenToEnd(parent: HTMLElement, html: string) {
        parent.insertAdjacentHTML("beforeend", html);
        return parent.lastElementChild as HTMLElement;
    }

    protected toggleElement(elem: HTMLElement) {
        if (elem.hasAttribute("data-active"))
            elem.removeAttribute("data-active");
        else
            elem.setAttribute("data-active", "");
    }
}

abstract class StaticHTMLComponent extends HTMLComponent {
    constructor() {
        super();
    }

    abstract setup(): void;
}

function nothing(ev: Event) {
    //ev.preventDefault();
    ev.stopPropagation();
}

function nameFromPath(path: string) {
    return path.split("/").slice(-1)[0].split("\\").slice(-1)[0];
}


//-----------------------------------------------------------------------------------------

class FunctionItemComponent extends HTMLComponent {
    elements: {
        function: HTMLElement;
    };

    data: EditorFunction;
    label: string;

    constructor(data: EditorFunction) {
        super();

        this.data = data;
        this.label = data.title.toLowerCase() + ' '
            + data.description.join(' ').toLowerCase() + ' '
            + usesTypes(data).join(' ').toLowerCase();
    }

    render() {
        return `
        <div class="function">
            <div class="labels">
                <div class="title">${this.data.title}</div>
                <div class="description">${this.data.description}</div>
            </div>
        </div>  
        `;
    }
}

//-----------------------------------------------------------------------------------------

class FunctionPanelComponent extends StaticHTMLComponent {
    elements = {
        functionSearchBar: HTMLElementType(),
        functionSearch: HTMLInputElementType(),
        clearFunctionSearch: HTMLElementType(),
        closeFunctionPanel: HTMLElementType(),
        functionReloadAction: HTMLElementType(),
        functionList: HTMLElementType()
    };

    functions: FunctionItemComponent[] = [];

    constructor() {
        super();
    }

    render() {
        return `
        <div id="functionSearchBar">
            <label for="functionSearch">Search</label>
            <input type="text" id="functionSearch" name="functionSearch" placeholder="Node name or description">
            <div id="clearFunctionSearch">${Symbols.erase}</div>
            <div id="closeFunctionPanel">${Symbols.cross}</div>
        </div>
        <div id="functionActions">
            <div class="functionAction" id="functionReloadAction">Reaload Nodes</div>
            <div class="functionAction" id="functionNewScriptAction">New Script</div>
            <div class="functionAction" id="functionOpenFolderAction">Open Script Folder</div>
        </div>
        <div id="functionList"></div>
        `;
    }

    loadFunction(data: EditorFunction) {
        let func = new FunctionItemComponent(data);
        let funcHTML = this.appenToEnd(this.elements.functionList, func.render());
        func.elements.function = funcHTML;
        this.functions.push(func);
        return funcHTML;
    }

    clearFunctionList() {
        this.functions = [];
        this.elements.functionList.innerHTML = "";
    }


    setup() {
        this.elements.functionSearch.onkeyup = (ev: Event) => {
            let query = this.elements.functionSearch.value.toLowerCase();
            if (query == '')
                this.functions.map(v => v.elements.function.style.display = 'block');
            else
                this.functions.map(v => v.label.includes(query) ?
                    v.elements.function.style.display = 'block' :
                    v.elements.function.style.display = 'none');
        }

        this.elements.clearFunctionSearch.onclick = () => {
            this.elements.functionSearch.value = '';
            this.functions.map(v => v.elements.function.style.display = 'block');
        }

        this.elements.functionReloadAction.onclick = () => {
            this.clearFunctionList()
            DataManager.instance.send({
                'command': 'loadFunctions'
            });
        }

        this.elements.functionList.onwheel = (ev: WheelEvent) => {
            ev.stopPropagation();
        }

        this.elements.closeFunctionPanel.onclick = (ev: MouseEvent) => {
            this.toggleElement(NodeEditor.ui.elements.functionPanel);
        }
    }

}

//-----------------------------------------------------------------------------------------

class NodeEditorMenuComponent extends StaticHTMLComponent {
    elements = {
        functionPanelButton: HTMLElementType(),
    };

    constructor() {
        super();
    }

    render() {
        return `
        <div id="functionPanelButton">Nodes</div>
        `;
    }

    setup() {
        this.elements.functionPanelButton.onclick = (ev: MouseEvent) => {
            this.toggleElement(NodeEditor.ui.elements.functionPanel);
        };
    }

}

//-----------------------------------------------------------------------------------------

class ApplicationMenuComponent extends StaticHTMLComponent {
    elements = {
        openProjectButton: HTMLElementType(),
        saveProjectButton: HTMLElementType(),
        runProjectButton: HTMLElementType(),
        nodesButton: HTMLElementType(),
        viewerButton: HTMLElementType(),
        messageButton: HTMLElementType(),
    };

    constructor() {
        super();
    }

    render() {
        return `
        <div id="openProjectButton">Open</div>
        <div id="saveProjectButton">Save</div>
        <div id="runProjectButton" class="delimiter">Run</div>
        <div id="nodesButton">Nodes</div>
        <div id="viewerButton">Viewer</div>
        <div id="messageButton">Messages</div>
        `;
    }

    setup() {
        this.elements.openProjectButton.onclick = (ev: MouseEvent) => openProject();
        this.elements.saveProjectButton.onclick = (ev: MouseEvent) => saveProject();
        this.elements.runProjectButton.onclick = (ev: MouseEvent) => runProject();
        
        this.elements.nodesButton.onclick = () => {
            Application.ui.openNodeEditor();
        };

        this.elements.viewerButton.onclick = () => {
            Application.ui.openViewer();
        };

        this.elements.runProjectButton.onclick = () => runProject();

        this.elements.messageButton.onclick = () => {
            this.toggleElement(Application.ui.messages.elements.messagePanel);
        }
    }

}

//-----------------------------------------------------------------------------------------

class ConnectorHTMLContainer extends HTMLContainer {
    elements = {
        connector: HTMLElementType()
    };
    
    components: {
        node: NodeComponent
    };
    
    constructor(connector: HTMLElement, node: NodeComponent) {
        super();
        this.elements = {
            connector: connector
        };
        
        this.components = {
            node: node
        };
    }
    
    get pos() {
        let offTop = this.elements.connector.offsetTop;
        let offLeft = this.elements.connector.offsetLeft;
        let pos = this.components.node.pos;
        
        return {
            x: pos.x + offLeft + 20 / 2,
            y: pos.y + offTop + 20 / 2
        };
    }
}

//-----------------------------------------------------------------------------------------

class ConnectionHTMLContainer extends HTMLContainer {
    elements = {
        line: SVGPathElementType(),
        selectLine: SVGPathElementType()
    };
    
    components: {
        node: NodeComponent
    };

    connection: Connection;

    constructor(connection: Connection) {
        super();
        this.connection = connection;
        this.elements.line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.elements.line.classList.add("connection");
        this.elements.selectLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.elements.selectLine.classList.add("fatline");
        this.elements.selectLine.onmousedown = (ev: MouseEvent) => this.onmousedown(ev, connection);
    }

    private redraw(inx: number, iny: number, outx: number, outy: number) {
        let handle = Math.min(Math.max((outy - iny) / 2 - 10, 0), 100);
        let startx = inx;
        let starty = iny;

        let endx = outx;
        let endy = outy;

        let d = 'M' + startx + ' ' + starty;
        d += ' C ' + (startx) + ' ' + (starty + handle) + ', ' + (endx) + ' ' + (endy - handle);
        d += ', ' + endx + ' ' + endy;

        this.elements.line.setAttribute('d', d);
        this.elements.selectLine.setAttribute('d', d);
    }

    remove() {
        this.elements.line.parentElement.removeChild(this.elements.line);
        this.elements.selectLine.parentElement.removeChild(this.elements.selectLine);
    }

    private onmousedown(ev: MouseEvent, connection: Connection) {
        if (connection.in && connection.out) {
            if (ev.button == 0) {
                //move existing
                let posIn = connection.in.connHTML.pos;
                let posOut = connection.out.connHTML.pos;
                let pos = NodeEditor.ui.mousePosition;

                let distIn = (posIn.x - pos.x) * (posIn.x - pos.x) + (posIn.y - pos.y) * (posIn.y - pos.y);
                let distOut = (posOut.x - pos.x) * (posOut.x - pos.x) + (posOut.y - pos.y) * (posOut.y - pos.y);

                connection.deregister();

                let source;
                if (distIn < distOut) {
                    connection.in = null;
                    source = connection.out;
                } else {
                    connection.out = null;
                    source = connection.in;
                }

                NodeEditor.instance.stageConnection(connection);
                this.move();

            } else if (ev.button == 2) {
                connection.remove();
            }

            ev.preventDefault();
            ev.stopPropagation();
        }
    };

    move() {
        let inpos, outpos;
        let pos =  NodeEditor.ui.mousePosition; 

        if (this.connection.in && this.connection.out) {
            //move all
            inpos = this.connection.in.connHTML.pos;
            outpos = this.connection.out.connHTML.pos;
        } else if (this.connection.in) {
            //move the bottom end
            inpos = this.connection.in.connHTML.pos;
            outpos = pos;
            this.redraw(pos.x, pos.y, inpos.x, inpos.y);
        } else if (this.connection.out) {
            //move the top end
            inpos = pos;
            outpos = this.connection.out.connHTML.pos;
        }

        this.redraw(outpos.x, outpos.y, inpos.x, inpos.y);
    }
}

//-----------------------------------------------------------------------------------------

abstract class ValueComponent {};

function rw(text: string) {
    return text.replace(/\s/g, "");
}

class StringValueComponent extends ValueComponent {
    static title(value: NodeValue) {
        return `<label for="${rw(value.node.id + value.param)}"><span class="title string">${value.param}</span></label>`;
    }

    static value(value: NodeValue) {
        return `
        <div class="value string">
            <input type="text" id="${rw(value.node.id + value.param)}" name="${rw(value.node.id + value.param)}" value="${value.value}">
        </div>
        `
    }

    static callback(value: NodeValue) {
        let input = document.getElementById(rw(value.node.id + value.param)) as HTMLInputElement;
        input.onkeyup = (ev: Event) => { value.value = input.value; };
        input.onmousedown = nothing;
        input.onmousemove = nothing;
    }
}

class NumberValueComponent extends ValueComponent {
    static title(value: NodeValue) {
        return `<label for="${rw(value.node.id + value.param)}"><span class="title number">${value.param}</span></label>`;
    }

    static value(value: NodeValue) {
        return `
        <div class="value number">
            <input type="number" id="${rw(value.node.id + value.param)}" name="${rw(value.node.id + value.param)}" value="${value.value}">
        </div>
        `
    }

    static callback(value: NodeValue) {
        let input = document.getElementById(rw(value.node.id + value.param)) as HTMLInputElement;
        input.onkeyup = (ev: Event) => { value.value = input.value; };
        input.onmousedown = nothing;
        input.onmousemove = nothing;
    }
}

class SelectValueComponent extends ValueComponent {
    static title(value: NodeValue) {
        return `<label for="${rw(value.node.id + value.param)}"><span class="title select">${value.param}</span></label>`;
    }

    static value(value: NodeValue) {
        let options = value.optionals as string[];

        return `
        <div class="value select">
            <select type="text" id="${rw(value.node.id + value.param)}" name="${rw(value.node.id + value.param)}" value="${value.value}">
                ${ options.map(option => ` <option value="${option}" ${ option == value.value ? 'selected' : ''}>${option}</option>` )}
            </select>
        </div>
        `
    }

    static callback(value: NodeValue) {
        let selection = document.getElementById(rw(value.node.id + value.param)) as HTMLSelectElement;
        selection.onchange = (ev: Event) => { value.value = selection.value; };
        selection.onmousedown = nothing;
        selection.onmousemove = nothing;
    }
}

class FileValueComponent extends ValueComponent {
    static title(value: NodeValue) {
        return `<label for="${rw(value.node.id + value.param)}"><span class="title file">${value.param}</span></label>`;
    }

    static value(value: NodeValue) {
        return `
        <div class="value file">
            <input type="button" id="${rw(value.node.id + value.param)}" name="${rw(value.node.id + value.param)}", value="${nameFromPath(value.value as string)}">
        </div>
        `;
    }

    static callback(value: NodeValue) {
        let file = document.getElementById(rw(value.node.id + value.param)) as HTMLInputElement;
        file.onclick = (ev: Event) => {
            let options = {
                defaultPath: value.value
            }

            dialog.showOpenDialog(options).then((result: any) => {
                let filename = result.filePaths[0];
                //a little nasty hack

                if (filename === undefined) {
                    //user didnt choose
                    return;
                }

                let name = nameFromPath(result.filePaths[0]);
                file.value = name;
                value.value = filename;
            }).catch((err: any) => {
                alert(err)
            });
        };
    }
}

class Vec3ValueComponent extends ValueComponent {
    static title(value: NodeValue) {
        return `
        <label for="${rw(value.node.id + value.param)}"><span class="title vec3">${value.param}</span></label>
    `;
    }

    static value(value: NodeValue) {
        return `
        <div class="value vec3">
            <input type="number" id="${rw(value.node.id + value.param + 'x')}" name="${rw(value.node.id + value.param + 'x')}" value="${(value.value as number[])[0]}">
            <input type="number" id="${rw(value.node.id + value.param + 'y')}" name="${rw(value.node.id + value.param + 'y')}" value="${(value.value as number[])[1]}">
            <input type="number" id="${rw(value.node.id + value.param + 'z')}" name="${rw(value.node.id + value.param + 'z')}" value="${(value.value as number[])[2]}">
        </div>
        `;
    }

    static callback(value: NodeValue) {
        let vec3x = document.getElementById(rw(value.node.id + value.param + 'x')) as HTMLInputElement;
        let vec3y = document.getElementById(rw(value.node.id + value.param + 'y')) as HTMLInputElement;
        let vec3z = document.getElementById(rw(value.node.id + value.param + 'z')) as HTMLInputElement;

        let callback = (ev: Event) => {
            value.value = [parseFloat(vec3x.value), parseFloat(vec3y.value), parseFloat(vec3z.value)];
        }

        [vec3x, vec3y, vec3z].map(elem => {
            elem.onkeydown = callback;
            elem.onmousedown = nothing;
            elem.onmousemove = nothing;
        });
    }
}

class BoolValueComponent extends ValueComponent {
    static title(value: NodeValue) {
        return `
        <label for="${rw(value.node.id + value.param)}"><span class="title bool">${value.param}</span></label>
    `;
    }

    static value(value: NodeValue) {
        return `
        <div class="value bool">
            <label for="${rw(value.node.id + value.param)}">
                <input type="checkbox" id="${rw(value.node.id + value.param)}" name="${rw(value.node.id + value.param)}" ${value.value ? 'Checked' : ''}>
                <span class="checkmark"></span>
            </label>
        </div>
        `;
    }

    static callback(value: NodeValue) {
        let checkbox = document.getElementById(rw(value.node.id + value.param)) as HTMLInputElement;
        checkbox.onchange = (ev: Event) => {
            value.value = checkbox.checked;
        }

        checkbox.onmousedown = nothing;
        checkbox.onmousemove = nothing;
    }
}


const ValueInitializer = {
    string: StringValueComponent,
    number: NumberValueComponent,
    bool: BoolValueComponent,
    file: FileValueComponent,
    vec3: Vec3ValueComponent,
    select: SelectValueComponent
};


//-----------------------------------------------------------------------------------------
class NodeComponent extends HTMLComponent {
    elements = {
        node: HTMLElementType()
    }

    pos = {
        x: 0,
        y: 0
    };

    node: EditorNode

    constructor(node: EditorNode) {
        super();
        this.node = node;
    }

    render() {
        return `
        <div class="node ${this.node.disabled ? "disabled" : ""}" id="${this.node.id}">
        <div class="title">${this.node.title}</div>
        <div class="contents">
            <div class="connectors">${this.node.inParams.map(param =>
            `<div class="connector in ${param.type}" data-title="${param.parameter} [type ${param.type}]">
                 </div>`).join('')}
            </div>
            <div class="values">
                <div class="values-titles">
                    ${this.node.values.map(value => ValueInitializer[value.type].title(value)).join('')}
                </div>
                <div class="values-values">
                    ${this.node.values.map(value => ValueInitializer[value.type].value(value)).join('')}
                </div>
            </div>
            <div class="connectors">${this.node.outParams.map(param =>
                `<div class="connector out ${param.type}" data-title="${param.parameter} [type ${param.type}]">
                 </div>`).join('')}
            </div>
        </div>   
    </div>   
        `
    }

    get id() {
        return this.node.id;
    }

    get inputConnectors() {
        return this.elements.node.lastElementChild.firstElementChild.children;
    }

    get outputConnectors() {
        return this.elements.node.lastElementChild.lastElementChild.children;
    }

    init(elem: HTMLElement, x: number, y: number) {
        this.elements.node = elem;
        this.pos.x = x;
        this.pos.y = y;

        this.node.values.map(value => ValueInitializer[value.type].callback(value));
        console.log(this.node);
        this.setupConnector(this.inputConnectors, this.node.inParams);
        this.setupConnector(this.outputConnectors, this.node.outParams);

        this.elements.node.onmousedown = (ev: MouseEvent) => this.mousedown(ev);
        this.applyTransform();
    }

    move(dx: number, dy: number) {
        this.pos.x += dx;
        this.pos.y += dy;
        this.applyTransform();

        for (let param of this.node.inParams)
            param.drawConnections();

        for (let param of this.node.outParams)
            param.drawConnections();
    }

    mousedown(ev: MouseEvent) {
        if (ev.button == 0) {
            NodeEditor.instance.selectNode(this.elements.node.id);
        }
        else if (ev.button == 2) {
            this.node.remove();
            this.remove();
        }

        ev.preventDefault();
        ev.stopPropagation();
    }

    remove() {
        this.elements.node.parentElement.removeChild(this.elements.node);
    }

    setupConnector(connectorHTML: HTMLCollection, param: Connector[]) {
        for (let i = 0; i < connectorHTML.length; ++i) {
            param[i].connHTML = new ConnectorHTMLContainer(connectorHTML[i] as HTMLElement, this);

            //click event on connector
            (connectorHTML[i] as HTMLElement).onmousedown = (ev: MouseEvent) => {
                this.node.addConnection(param[i]);
                ev.preventDefault();
                ev.stopPropagation();
            }
        }
    }

    setNotActive() {
        this.elements.node.classList.add("nonactive");
    }

     setActive() {
        this.elements.node.classList.remove("nonactive");
     }

    private applyTransform() {
        this.elements.node.style.transform = 'translate(' + this.pos.x + 'px, ' + this.pos.y + 'px)';
    }
}

//-----------------------------------------------------------------------------------------

class ProgressBarComponent extends HTMLComponent {
    elements = {
        container: HTMLElementType(),
        title: HTMLElementType(),
        bar: HTMLElementType()
    };

    id: string;

    constructor(id: string) {
        super();
        this.id = `progressbar${id}`;
    }

    render() {
        return `
        <div class="progressBar" id="${this.id}">
            <div class="progressBarContainer">
                <div class="progressBarLine" id="messageProgressBar"></div>
            </div>
            <div class="progressBarTitle" id="messageProgressBarTitle">
        </div>
        `;
    }

    init(elem: HTMLElement) {
        this.elements.container = elem;
        this.elements.title = elem.lastElementChild as HTMLElement;
        this.elements.bar = elem.firstElementChild.firstElementChild as HTMLElement;
    }

    update(value: number, text: string) {

        this.elements.bar.style.width = `${value}%`;
        this.elements.title.innerHTML = text;

        if (value == 100)
            this.remove();
    }

    remove() {
        this.elements.container.parentElement.removeChild(this.elements.container);
    }


}

//-----------------------------------------------------------------------------------------

class MessageComponent extends HTMLComponent {
    elements = {
        message: HTMLElementType(),
    };

    title: string;
    body: string;
    id: string;

    static staicId: number = 0;

    constructor(title: string, body: string) {
        super();
        this.title = title;
        this.body = body;
        this.id = `message${MessageComponent.staicId++}`;
    }

    render() {
        return `
            <div class="message" id="${this.id}" data-active>
                <div class="title">
                    ${this.title}
                </div>
                <div class="body">
                    ${this.body}
                </div>
            </div>
        `;
    }

    init(elem: HTMLElement, timeout: number) {
        this.elements.message = elem;

        if (timeout > 0)
            setTimeout(() => { this.close(elem) }, timeout)

        elem.onwheel = (ev: WheelEvent) => { ev.stopPropagation() };
        elem.onclick = (ev: MouseEvent) => { this.close(elem) };
    }

    close(elem: HTMLElement) {
        elem.removeAttribute("data-active");
    }
}

//-----------------------------------------------------------------------------------------


class MessagePanelComponent extends StaticHTMLComponent {
    elements = {
        messagePanel: HTMLElementType(), //defined in parent
        closeMessagePanelButton: HTMLElementType(),
        messageList: HTMLElementType() 
    };

    bars: {
        [id: string]: ProgressBarComponent
    } = {};

    messageIdx: number = 0;
    lastMessage: MessageComponent = null;

    constructor() {
        super();
    }

    render() {
        return `
            <div id="messagePanelTop">
                <div id="closeMessagePanelButton">${Symbols.cross}</div>
            </div>
            <div id="messageList"></div>
        `;
    }

    setup() {
        this.elements.closeMessagePanelButton.onclick = () => {
            this.toggleElement(this.elements.messagePanel);
        }
    }

    addMessage(title: string, body: string, timeout: number = 0) {
        if (this.lastMessage) {
            this.lastMessage.elements.message.removeAttribute("data-active");
        }

        let message = new MessageComponent(title, body);
        this.lastMessage = message;
        let elem = this.appenToEnd(this.elements.messageList, message.render());
        message.init(elem, timeout);
    }

    updateProgressbar(id: string, value: number, text: string) {
        let progress = this.bars[id];
        console.log(progress, id);
        if (!progress) {
            progress = new ProgressBarComponent(id);
            let elem = this.appenToEnd(this.elements.messageList, progress.render());
            progress.init(elem);
            this.bars[id] = progress;
        }
        progress.update(value, text);
    }

    closeAllMessages() {
        this.elements.messageList.innerHTML = "";
    }
}


//-----------------------------------------------------------------------------------------
class NodeEditorComponent extends StaticHTMLComponent {
    elements = {
        nodes: HTMLElementType(), //from parent component
        nodeArea: HTMLElementType(),
        svgArea: SVGAElementType(),
        functionPanel: HTMLElementType(),
        nodeMenu: HTMLElementType()
    };

    components: {
        functionPanel: FunctionPanelComponent,
        nodeMenu: NodeEditorMenuComponent
    };

    transform = {
        zoom: 1,
        x: 0,
        y: 0,
    };

    center: {
        x: number,
        y: number
    };

    start: {
        x: number,
        y: number
    };

    private mouse = {
        x: 0,
        y: 0
    };

    userIsMovingArea = false;

    constructor() {
        super();
        this.components = {
            functionPanel: new FunctionPanelComponent(),
            nodeMenu: new NodeEditorMenuComponent()
        };
    }

    render() {
        return `
        <div id="nodeArea">
            <svg width="100%" height="100%" id="svgArea"></svg>
        </div>
        <div id="functionPanel">
            ${this.components.functionPanel.render()}
        </div>
        <div id="nodeMenu">
            ${this.components.nodeMenu.render()}
        </div>
        `;
    }

    setup() {
        this.elements.nodes.onmousedown = (ev: MouseEvent) => this.mousedown(ev);
        this.elements.nodes.onmousemove = (ev: MouseEvent) => this.mousemove(ev);
        this.elements.nodes.onmouseup = (ev: MouseEvent) => this.mouseup(ev);
        this.elements.nodes.onwheel = (ev: WheelEvent) => this.wheel(ev);

        this.resize();
    }

    loadFunction(data: EditorFunction, onmousedown: (x: number, y: number) => void) {
        let funcHTML = this.components.functionPanel.loadFunction(data);

        funcHTML.onmousedown = (ev: MouseEvent) => {
            if (ev.button == 0) {
                this.toggleElement(this.elements.functionPanel)
                this.setMouse(ev);
                let pos = this.mousePosition;
                
                onmousedown(pos.x, pos.y);

                ev.preventDefault();
                ev.stopPropagation();
            }
        };

        funcHTML.onmouseup = (ev: MouseEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
        };
    }

    addConnection(conn: Connection) {
        let connection = new ConnectionHTMLContainer(conn);
        this.elements.svgArea.appendChild(connection.elements.line);
        this.elements.svgArea.appendChild(connection.elements.selectLine);
        return connection;
    }

    addNode(node: EditorNode, x: number, y: number) {
        let nodeComp = new NodeComponent(node);
        let nodeHTML = this.appenToEnd(this.elements.nodeArea, nodeComp.render());
        nodeComp.init(nodeHTML, x, y);
        return nodeComp;
    }

    //----------------------------------------
    // callbacks
    //----------------------------------------


    mousedown(ev: MouseEvent) {   
        if (!NodeEditor.instance.isConnectionStaged()) {
            this.userIsMovingArea = true;
            return;
        }

        NodeEditor.instance.cancelStagedConnection();
        ev.stopPropagation();
        ev.preventDefault();
    }


    mousemove(ev: MouseEvent) {
        let dx = ev.clientX - this.mouse.x;
        let dy = ev.clientY - this.mouse.y;
        this.mouse.x = ev.clientX;
        this.mouse.y = ev.clientY;

        if (this.userIsMovingArea) {
            this.transform.x += dx;
            this.transform.y += dy;
            this.applyTransform();
        } else {
            dx = dx / this.transform.zoom;
            dy = dy / this.transform.zoom;
            NodeEditor.instance.moveNodes(dx, dy);
        }
    }


    mouseup(ev: MouseEvent) {
        NodeEditor.instance.deselectAllNodes();
        this.userIsMovingArea = false;
    }

    wheel(ev: WheelEvent) {
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
        const area = this.elements.nodes;
        const rect = area.getBoundingClientRect();
        this.center = { x: area.offsetWidth / 2, y: area.offsetHeight / 2 };
        this.start = { x: rect.left, y: rect.top };
    }


    private applyTransform() {
        this.elements.nodeArea.style.transform = 'translate(' + this.transform.x + 'px, '
            + this.transform.y + 'px) scale('
            + this.transform.zoom + ')';

    }

    private setMouse(ev: MouseEvent) {
        this.mouse.x = ev.clientX;
        this.mouse.y = ev.clientY;
    }

    get mousePosition() {
        let offsetX = (this.mouse.x - this.start.x - this.center.x - this.transform.x) / this.transform.zoom;
        let offsetY = (this.mouse.y - this.start.y - this.center.y - this.transform.y) / this.transform.zoom;
        let x = this.center.x + offsetX;
        let y = this.center.y + offsetY;
        return { x: x, y: y };
    }

    resetTransform() {

    }

    clear() {
        //SVG has to be first
        while (this.elements.nodeArea.children.length > 1) {
            this.elements.nodeArea.removeChild(this.elements.nodeArea.lastElementChild);
        }
    }
}

//-----------------------------------------------------------------------------------------
class ViewerComponent extends StaticHTMLComponent {
    elements = {
        viewerCanvas: HTMLCanvasElementType()
    };

    constructor() {
        super();
    }

    render() {
        return `
            <canvas id="viewerCanvas"></canvas>
        `
    }

    setup() {
        //nothing to do
    }

}

//-----------------------------------------------------------------------------------------
class ApplicationComponent extends StaticHTMLComponent {
    elements = {
        nodes: HTMLElementType(),
        viewer: HTMLElementType(),
        messagePanel: HTMLElementType(),
        applicationMenu: HTMLElementType()
    };

    components: {
        nodeEditor: NodeEditorComponent,
        messagePanel: MessagePanelComponent,
        viewer: ViewerComponent,
        applicationMenu: ApplicationMenuComponent
    };

    constructor() {
        super();

        this.components = {
            nodeEditor: new NodeEditorComponent(),
            messagePanel: new MessagePanelComponent(),
            viewer: new ViewerComponent(),
            applicationMenu: new ApplicationMenuComponent()
        };

    }

    render() {
        return `
        <div id="applicationMenu">
            ${this.components.applicationMenu.render()}
        </div>
        <div id="messagePanel">
            ${this.components.messagePanel.render()}
        </div>
        <div id="nodes">
            ${this.components.nodeEditor.render()}
        </div>
        <div id="viewer">
            ${this.components.viewer.render()}
        </div>
        `
    }

    setup() {
        //nothign to do
    }

    colorScheme = {
        colors: [//[139, 82, 117],
            //[2, 102, 112],
            [159, 237, 215],
            [254, 249, 199],
            [252, 225, 129]],
        gray: [237, 234, 229],
        black: [10, 10, 10]
    };

    createStyleRule(name: string, i: number, length: number) {
        let colorIdx = (i / (length - 1)) * (this.colorScheme.colors.length - 1);
        let colorA = Math.floor(colorIdx);
        let colorB = Math.ceil(colorIdx);
        let t = colorIdx - colorA;

        return `.connector.${name} {
            background: rgb(${this.colorScheme.colors[colorA].map((v, i) => v * (1 - t) + this.colorScheme.colors[colorB][i] * t).join(", ")});
        }`;
    }

    setupStyles(types: string[]) {
        let style = document.getElementById("colorScheme");

        if (!style) {
            style = document.createElement('style');
            document.getElementsByTagName('head')[0].appendChild(style);
        }

        style.innerHTML = `
            ${types.map((t, i) => this.createStyleRule(t, i, types.length)).join("\n\n")}
        `;
    }

    openNodeEditor(){
        this.elements.nodes.style.display = 'block';
        this.elements.viewer.style.display = 'none';
    }

    openViewer() {
        this.elements.nodes.style.display = 'none';
        this.elements.viewer.style.display = 'block';
        Viewer.instance.willAppear();
    }

    clear() {
        this.components.nodeEditor.clear();
    }

    get messages() {
        return this.components.messagePanel;
    }
}
