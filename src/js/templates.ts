type SvgInHtml = HTMLElement & SVGElement;


let colorScheme = {
    colors: [//[139, 82, 117],
             //[2, 102, 112],
             [159, 237, 215],
             [254, 249, 199],
             [252, 225, 129]],
    gray: [237, 234, 229],
    black: [10, 10, 10]
}

function createStyleRule(name: string, i: number, length: number) {
    let colorIdx = (i / (length - 1)) * (colorScheme.colors.length - 1);
    let colorA = Math.floor(colorIdx);
    let colorB = Math.ceil(colorIdx);
    let t = colorIdx - colorA;

    return `.connector.${name} {
        background: rgb(${colorScheme.colors[colorA].map((v, i) => v * (1 - t) + colorScheme.colors[colorB][i] * t).join(", ")});
    }`;
}

class EditorHTMLTemplate {
    parentHTML: HTMLElement;
    functionPanelHTML: HTMLElement;
    editorAreaHTML: HTMLElement;
    nodeAreaHTML: HTMLElement;
    nodeAreaSVG: SvgInHtml;
    actionPanel: HTMLElement;

    stagedConnection: Connection;

    private mouse = {
        x: 0,
        y: 0
    };

    functionMenu: {
        label: string;
        html: HTMLElement;
    }[] = [];

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

    private moveArea = false;

    moveActive: (dx: number, dy: number) => void = () => { };
    clearSelectedNodes: () => void = () => { };

    get mousePosition() {
        let offsetX = (this.mouse.x - this.start.x - this.center.x - this.transform.x) / this.transform.zoom;
        let offsetY = (this.mouse.y - this.start.y - this.center.y - this.transform.y) / this.transform.zoom;
        let x = this.center.x + offsetX;
        let y = this.center.y + offsetY;
        return {x: x, y: y};
    }

    constructor(parent: HTMLElement) {
        const editor = `
        <div id="nodes">
            <div id="functionPanel">
                <div id="functionSearchBar">
                    <label for="functionSearch">Search</label>
                    <input type="text" id="functionSearch" name="functionSearch" placeholder="Node name or description">
                    <div id="clearFunctionSearch">&#8612;</div>
                </div>
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
        `

        this.parentHTML = parent;
        this.parentHTML.innerHTML = editor;
        this.functionPanelHTML = document.getElementById("functionPanel");
        this.editorAreaHTML = document.getElementById("nodes");
        this.nodeAreaHTML = document.getElementById("nodeArea");
        this.nodeAreaSVG = document.getElementById("svgEditor") as SvgInHtml;
        this.actionPanel = document.getElementById("actionPanel");

        this.editorAreaHTML.onmousedown = (ev: MouseEvent) => this.mousedown(ev);
        this.editorAreaHTML.onmousemove = (ev: MouseEvent) => this.mousemove(ev);
        this.editorAreaHTML.onmouseup = (ev: MouseEvent) => this.mouseup(ev);
        this.editorAreaHTML.onwheel = (ev: WheelEvent) => this.wheel(ev);

        this.setupFunctionSearch();
        this.setupBottomMenu();
        this.resize();
    }

    private toggleFunctionPanel() {
        let nodes = document.getElementById("addNodeButton");
        if(this.functionPanelHTML.style.display == 'none')
        {
            nodes.classList.add('active');
            this.functionPanelHTML.style.display = 'block';
        } else {
            nodes.classList.remove('active');
            this.functionPanelHTML.style.display = 'none';
        }
    }

    addFunctionToPanel(data: EditorFunction, onmousedown: (x: number, y: number) => void) {
        const func = `
        <div class="function">
            <div class="labels">
                <div class="title">${data.title}</div>
                <div class="description">${data.description}</div>
            </div>
        </div>   
        `

        this.functionPanelHTML.insertAdjacentHTML("beforeend", func);
        let funcHTML = this.functionPanelHTML.lastElementChild as HTMLElement;
        funcHTML.onmousedown = (ev: MouseEvent) => {
            if (ev.button == 0) {
                this.toggleFunctionPanel();
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
        }

        this.functionMenu.push({
            label: data.title + ' ' + data.description + ' ' + usesTypes(data).join(' '),
            html: funcHTML
        });
    }

    setupFunctionSearch() {
        let input = document.getElementById("functionSearch") as HTMLInputElement;
        let clear = document.getElementById("clearFunctionSearch");
        

        input.onkeyup = (ev: Event) => {
            let query = input.value;
            if (query == '')
                this.functionMenu.map(v => v.html.style.display = 'block');
            else 
                this.functionMenu.map(v => v.label.includes(query) ? 
                    v.html.style.display = 'block' :
                    v.html.style.display = 'none' );
        }

        clear.onclick = () => {
            input.value = '';
            this.functionMenu.map(v => v.html.style.display = 'block');
        }
    }

    setupBottomMenu() {
        let nodes = document.getElementById("addNodeButton");
        nodes.onclick = (ev: MouseEvent) => this.toggleFunctionPanel();
        this.functionPanelHTML.style.display = 'none';

        let open = document.getElementById("openProjectButton");
        open.onclick = (ev: MouseEvent) => openProject();

        let save = document.getElementById("saveProjectButton");
        save.onclick = (ev: MouseEvent) => saveProject();
    }

    setupStyles(types: string[]) {
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

        //SVG has to be first
        while ( this.nodeAreaHTML.children.length > 1) {
            this.nodeAreaHTML.removeChild( this.nodeAreaHTML.lastElementChild);
        }
    }

    //----------------------------------------
    // callbacks
    //----------------------------------------

    private mousedown(ev: MouseEvent) {   
        
        if (!this.stagedConnection)
        {
            this.moveArea = true;
            return;
        }

        this.nodeAreaSVG.removeChild(this.stagedConnection.connHTML.line);
        this.nodeAreaSVG.removeChild(this.stagedConnection.connHTML.selectLine);
        this.stagedConnection = null;


        ev.stopPropagation();
        ev.preventDefault();
    }


    private mousemove(ev: MouseEvent) {
        let dx = ev.clientX - this.mouse.x;
        let dy = ev.clientY - this.mouse.y;
        this.mouse.x = ev.clientX;
        this.mouse.y = ev.clientY;

        if (this.moveArea) {
            this.transform.x += dx;
            this.transform.y += dy;
            this.applyTransform();
        } else {
            dx = dx / this.transform.zoom;
            dy = dy / this.transform.zoom;
            this.moveActive(dx, dy);
        }
    }

    private setMouse(ev: MouseEvent) {
        this.mouse.x = ev.clientX;
        this.mouse.y = ev.clientY;
    }

    private mouseup(ev: MouseEvent) {
        this.clearSelectedNodes();
        this.moveArea = false;
    }


    private wheel(ev: WheelEvent){
        let delta = -ev.deltaY / 1000;
        delta = this.transform.zoom + delta > 0.1 ? delta : 0;
        let old_zoom = this.transform.zoom;
        this.transform.zoom = this.transform.zoom + delta;
        this.transform.x = this.transform.x * (this.transform.zoom / old_zoom);
        this.transform.y = this.transform.y * (this.transform.zoom / old_zoom);
        this.applyTransform();
        ev.preventDefault();
    }

    resize(){
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

function valueHTMLTitle(value: NodeValue) {
    switch (value.type) {
        case 'string':              
            return `
                <label for="${value.node.id + value.param}"><span class="title string">${value.param}</span></label>
            `
        case 'file':    
            return `
                <label for="${value.node.id + value.param}"><span class="title file">${value.param}</span></label>
            `
        case 'number':    
            return `
                <label for="${value.node.id + value.param}"><span class="title number">${value.param}</span></label>
            `
        case 'color':    
            return `
            <div class="value color">

            </div>
            `
        case 'bool':    
            return `
                <label for="${value.node.id + value.param}"><span class="title bool">${value.param}</span></label>
            `
        case 'vec3':    
            return `
                <label for="${value.node.id + value.param}"><span class="title vec3">${value.param}</span></label>
            `
        default:
            break;
    }
}

function valueHTMLValue(value: NodeValue) {
    switch (value.type) {
        case 'string':              
            return `
            <div class="value string">
                <input type="text" id="${value.node.id + value.param}" name="${value.node.id + value.param}" value="${value.value}">
            </div>
            `
        case 'file':    
            return `
            <div class="value file">
                    <input type="button" id="${value.node.id + value.param}" name="${value.node.id + value.param}", value="${value.value}">
            </div>
            `
        case 'number':    
            return `
            <div class="value number">
                    <input type="number" id="${value.node.id + value.param}" name="${value.node.id + value.param}" value="${value.value}">
            </div>
            `
        case 'color':    
            return `
            <div class="value color">

            </div>
            `
        case 'bool':    
            return `
            <div class="value bool">
                <label for="${value.node.id + value.param}">
                    <input type="checkbox" id="${value.node.id + value.param}" name="${value.node.id + value.param}" ${ value.value ? 'Checked' : ''}>
                    <span class="checkmark"></span>
                </label>
            </div>
            `
        case 'vec3':    
            return `
            <div class="value vec3">
                    <input type="number" id="${value.node.id + value.param + 'x'}" name="${value.node.id + value.param}" value="${(value.value as number[])[0]}">
                    <input type="number" id="${value.node.id + value.param + 'y'}" name="${value.node.id + value.param}" value="${(value.value as number[])[1]}">
                    <input type="number" id="${value.node.id + value.param + 'z'}" name="${value.node.id + value.param}" value="${(value.value as number[])[2]}">
            </div>
            `
        default:
            break;
    }
}

function nothing(ev: Event) {
    //ev.preventDefault();
    ev.stopPropagation();
}

function setupValueCallbacks(value: NodeValue) {

    switch (value.type) {
        case 'string':              
        case 'number':  
            let input = document.getElementById(value.node.id + value.param) as HTMLInputElement;
            input.onkeyup = (ev: Event) => {
                value.value = input.value;
            }

            input.onmousedown = nothing;
            input.onmousemove = nothing;
        break;
        case 'bool': 
            let checkbox = document.getElementById(value.node.id + value.param) as HTMLInputElement;
            checkbox.onchange = (ev: Event) => {
                value.value = checkbox.checked;
            }

            checkbox.onmousedown = nothing;
            checkbox.onmousemove = nothing;
        case 'color':  
            let color = document.getElementById(value.node.id + value.param) as HTMLElement;

            /*element.onchange = (ev: Event) => {
                value.value = element.value;
                console.log(element.value);
            }*/
        break;
        case 'file':    
            let file = document.getElementById(value.node.id + value.param) as HTMLInputElement;
            file.onclick = (ev: Event) => {
                let options = {
                    defaultPath: value.value
                }
            
                dialog.showOpenDialog(options).then( (result: any) => {
                    let filename = result.filePaths[0];
                    
                    if (filename === undefined) {
                        //user didnt choose
                        return;
                    }
                    
                    file.value = filename;
                    value.value = filename;
                    }).catch((err: any) => {
                    alert(err)
                    });
            }
        break;
        case 'vec3':   
            let vec3x = document.getElementById(value.node.id + value.param + 'x') as HTMLInputElement;
            let vec3y = document.getElementById(value.node.id + value.param + 'y') as HTMLInputElement;
            let vec3z = document.getElementById(value.node.id + value.param + 'z') as HTMLInputElement;

            let callback = (ev: Event) => {
                value.value = [parseFloat(vec3x.value), parseFloat(vec3y.value), parseFloat(vec3z.value)];
            }

            [vec3x, vec3y, vec3z].map(elem => {
                elem.onkeydown = callback;
                elem.onmousedown = nothing;
                elem.onmousemove = nothing;
            });

        default:
            break;
    }
}

class NodeHTMLTemplate {
    nodeHTML: HTMLElement;
    pos = {
        x: 0,
        y: 0
    };

    move: (dx: number, dy: number) => void;

    constructor(node: EditorNode, x: number, y: number) {
        const nodeHTML = `
            <div class="node" id="${node.id}">
                <div class="title">${node.title}</div>
                <div class="contents">
                    <div class="connectors">
                        ${node.inParams.map(param =>
                            `<div class="connector in ${param.type}" title="${param.parameter} [${param.type}]"></div>`).join('')}
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
                        ${node.outParams.map(param =>
                            `<div class="connector out ${param.type}" title="${param.parameter} [${param.type}]"></div>`).join('')}
                    </div>
                </div>   
            </div>   
            `

            
        let area = NodeEditor.instance.ui.nodeAreaHTML;
        area.insertAdjacentHTML("beforeend", nodeHTML);
        this.nodeHTML = area.lastElementChild as HTMLElement;
        node.values.map(value => setupValueCallbacks(value));
            
        this.pos.x = x;
        this.pos.y = y;
        
        let inParamHTMLs = this.nodeHTML.lastElementChild.firstElementChild.children;
        let outParamHTMLs = this.nodeHTML.lastElementChild.lastElementChild.children;

        let connectionLink = (connectorHTML: HTMLCollection, param: Connector[]) => {
            for (let i = 0; i < connectorHTML.length; ++i) {  
                param[i].connHTML = new ConnectorHTMLTemplate(connectorHTML[i] as HTMLElement, this);
                
                //click event on connector
                (connectorHTML[i] as HTMLElement).onmousedown = (ev: MouseEvent) => {
                    node.addConnection(connectorHTML[i] as HTMLElement, param[i], ev.x, ev.y);
                    ev.preventDefault();
                    ev.stopPropagation();
                }
            }
        }

        connectionLink(inParamHTMLs, node.inParams);
        connectionLink(outParamHTMLs, node.outParams);

        this.nodeHTML.onmousedown = (ev: MouseEvent) => {
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

        this.move = (dx: number, dy: number) => {
            this.pos.x += dx;
            this.pos.y += dy;
            this.applyTransform();
    
            for(let param of node.inParams)
                param.drawConnections();
            
            for(let param of node.outParams)
                param.drawConnections();
        }

        this.applyTransform();
    }


    applyTransform() {
        this.nodeHTML.style.transform = 'translate(' + this.pos.x + 'px, ' + this.pos.y + 'px)';
    }

    remove() {
        NodeEditor.instance.ui.nodeAreaHTML.removeChild(this.nodeHTML);
    }

}


class ConnectorHTMLTemplate {
    connHTML: HTMLElement;
    nodeHTML: NodeHTMLTemplate;

    constructor(elem: HTMLElement, nodeHTML: NodeHTMLTemplate) {
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
    line: SVGPathElement;
    selectLine: SVGPathElement;

    move: () => void;

    constructor(connection: Connection) {
        this.line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.line.classList.add("connection");
        
        this.selectLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.selectLine.onmousedown = (ev: MouseEvent) => {
            if (connection.in && connection.out)
            {
                if (ev.button == 0)
                {
                    //move existing
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
                    } else {
                        connection.out = null;
                        source = connection.in;
                    }
            
                    NodeEditor.instance.ui.stagedConnection = connection;                   
                    this.move();

                } else if (ev.button == 2) {
                    connection.remove();
                }
        
                ev.preventDefault();
                ev.stopPropagation();
            } 
        };


        this.selectLine.classList.add("fatline");
        
        NodeEditor.instance.ui.nodeAreaSVG.appendChild(this.line);
        NodeEditor.instance.ui.nodeAreaSVG.appendChild(this.selectLine);
    
        this.move = () => {
            let inpos, outpos;
            let pos = NodeEditor.instance.ui.mousePosition;

            if (connection.in && connection.out) {
                //move all
                inpos = connection.in.connHTML.pos;
                outpos = connection.out.connHTML.pos;
            } else if (connection.in) {
                //move the bottom end
                inpos = connection.in.connHTML.pos;
                outpos = pos;
                this.redraw(pos.x, pos.y, inpos.x, inpos.y);
            } else if (connection.out) {
                //move the top end
                inpos = pos;
                outpos = connection.out.connHTML.pos;
            }

            this.redraw(outpos.x, outpos.y, inpos.x, inpos.y);
        }
    }

    redraw(inx: number, iny: number, outx: number, outy: number) {
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
}