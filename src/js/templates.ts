type SvgInHtml = HTMLElement & SVGElement;

class EditorHTMLTemplate {
    parentHTML: HTMLElement;
    functionPanelHTML: HTMLElement;
    nodeAreaHTML: HTMLElement;
    nodeAreaSVG: SvgInHtml;
    actionPanel: HTMLElement;

    stagedConnection: Connection;

    private mouse = {
        x: 0,
        y: 0
    };


    moveActive: (dx: number, dy: number) => void = () => { };
    clearSelectedNodes: () => void = () => { };

    constructor(parent: HTMLElement) {
        const editor = `
        <div id="nodes">
            <div id="nodeArea">
                <div id="functionPanel"></div>
                <svg width="100%" height="100%" id="svgEditor"></svg>
            </div>
        </div>
        <div id="actionPanel"></div>
        `

        this.parentHTML = parent;
        this.parentHTML.innerHTML = editor;
        this.functionPanelHTML = document.getElementById("functionPanel");
        this.nodeAreaHTML = document.getElementById("nodeArea");
        this.nodeAreaSVG = document.getElementById("svgEditor") as SvgInHtml;
        this.actionPanel = document.getElementById("actionPanel");

        this.nodeAreaHTML.onmousedown = (ev: MouseEvent) => this.mousedown(ev);
        this.nodeAreaHTML.onmousemove = (ev: MouseEvent) => this.mousemove(ev);
        this.nodeAreaHTML.onmouseup = (ev: MouseEvent) => this.mouseup(ev);
    }

    addFunctionToPanel(data: EditorFunction, onmousedown: (ev: MouseEvent) => void) {
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
        console.log(funcHTML);
        funcHTML.onmousedown = onmousedown;
        funcHTML.onmouseup = (ev: MouseEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
        }
    }

    //----------------------------------------
    // callbacks
    //----------------------------------------

    private mousedown(ev: MouseEvent) {
        if (!this.stagedConnection)
            return;

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

        this.moveActive(dx, dy);
    }


    private mouseup(ev: MouseEvent) {
        this.clearSelectedNodes();
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
                    <input type="checkbox" id="${value.node.id + value.param}" name="${value.node.id + value.param}" checked="${value.value}">
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
                console.log(input.value);
            }

            input.onmousedown = nothing;
            input.onmousemove = nothing;
        break;
        case 'bool': 
            let checkbox = document.getElementById(value.node.id + value.param) as HTMLInputElement;
            checkbox.onchange = (ev: Event) => {
                value.value = checkbox.checked;
                console.log(checkbox.checked);
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
                console.log(value.value);
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
                            `<div class="connector in ${param.type}" title="${param.parameter}"></div>`).join('')}
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
                            `<div class="connector out ${param.type}" title="${param.parameter}"></div>`).join('')}
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

        let connectionLink = (paramHTML: HTMLCollection, param: Connector[]) => {
            for (let i = 0; i < paramHTML.length; ++i) {
                
                (paramHTML[i] as HTMLElement).onmousedown = (ev: MouseEvent) => {
                    node.addConnection(paramHTML[i] as HTMLElement, param[i], ev.x, ev.y);
                    ev.preventDefault();
                    ev.stopPropagation();
                }

                param[i].connHTML = new ConnectorHTMLTemplate(paramHTML[i] as HTMLElement, this);
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

        }

        this.move = (dx: number, dy: number) => {
            console.log('moving node', dx, dy);
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
    nodeHTML: NodeHTMLTemplate;
    connHTML: HTMLElement;

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
    
    pos = {
        x: 0,
        y: 0
    };

    move: (dx: number, dy: number) => void;

    constructor(connection: Connection, x: number, y: number) {
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
            
                    let distIn = (posIn.x - ev.clientX) * (posIn.x - ev.clientX) + (posIn.y - ev.clientY) * (posIn.y - ev.clientY);
                    let distOut = (posOut.x - ev.clientX) * (posOut.x - ev.clientX) + (posOut.y - ev.clientY) * (posOut.y - ev.clientY);
            
                    connection.deregister();

                    let source;
                    if (distIn < distOut) {
                        connection.in = null;
                        source = connection.out;
                    } else {
                        connection.out = null;
                        source = connection.in;
                    }
            
                    this.pos = {
                        x: ev.clientX,
                        y: ev.clientY
                    };
            
                    NodeEditor.instance.ui.stagedConnection = connection;                   
                    this.move(0, 0);

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

        this.pos.x = x;
        this.pos.y = y;
    
        this.move = (dx: number, dy: number) => {
            this.pos.x += dx;
            this.pos.y += dy;
            let inpos, outpos;

            if (connection.in && connection.out) {
                //move all
                inpos = connection.in.connHTML.pos;
                outpos = connection.out.connHTML.pos;
            } else if (connection.in) {
                //move the bottom end
                inpos = connection.in.connHTML.pos;
                outpos = this.pos;
                this.redraw(this.pos.x, this.pos.y, inpos.x, inpos.y);
            } else if (connection.out) {
                //move the top end
                inpos = this.pos;
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