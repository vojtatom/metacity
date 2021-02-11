type SvgInHtml = HTMLElement & SVGElement;

class EditorHTMLTemplate {
    parentHTML: HTMLElement;
    functionPanelHTML: HTMLElement;
    nodeAreaHTML: HTMLElement;
    nodeAreaSVG: SvgInHtml;
    nodePanelHTML: HTMLElement;
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
                <div id="nodePanel"></div>
            </div>
        </div>
        <div id="actionPanel"></div>
        `

        this.parentHTML = parent;
        this.parentHTML.innerHTML = editor;
        this.functionPanelHTML = document.getElementById("functionPanel");
        this.nodeAreaHTML = document.getElementById("nodeArea");
        this.nodeAreaSVG = document.getElementById("svgEditor") as SvgInHtml;
        this.nodePanelHTML = document.getElementById("nodePanel");
        this.actionPanel = document.getElementById("actionPanel");

        this.nodeAreaHTML.onmousedown = (ev: MouseEvent) => this.mousedown(ev);
        this.nodeAreaHTML.onmousemove = (ev: MouseEvent) => this.mousemove(ev);
        this.nodeAreaHTML.onmouseup = (ev: MouseEvent) => this.mouseup(ev);
    }

    addFunctionToPanel(data: EditorFunction, onmousedown: (ev: MouseEvent) => void) {
        const func = `
        <div class="function">
            <div class="icon"></div>
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
                <div class="params">
                    <div class="connectors">
                        ${node.inParams.map(param =>
            `<div class="connector in" title="${param.parameter}"></div>`).join('')}
                    </div>
                    <div class="connectors">
                        ${node.outParams.map(param =>
                `<div class="connector out" title="${param.parameter}"></div>`).join('')}
                    </div>
                </div>
            </div>   
            `

        let area = NodeEditor.instance.ui.nodeAreaHTML;
        area.insertAdjacentHTML("beforeend", nodeHTML);
        this.nodeHTML = area.lastElementChild as HTMLElement;

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
            }
        }

        connectionLink(inParamHTMLs, node.inParams);
        connectionLink(outParamHTMLs, node.outParams);

        this.nodeHTML.onmousedown = () => {
            NodeEditor.instance.selectNode(this.nodeHTML.id);
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

}

class ConnectionHTMLTemplate {
    line: SVGPathElement;
    selectLine: SVGPathElement;
    
    pos = {
        x: 0,
        y: 0
    };

    move: (dx: number, dy: number) => void;

    constructor(conn: Connection, x: number, y: number) {
        this.line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.line.classList.add("connection");
        
        this.selectLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.selectLine.onmousedown = (ev: MouseEvent) => {
            if (conn.in && conn.out)
            {
                if (ev.button == 0)
                {
                    //move existing
                    let posIn = conn.in.pos;
                    let posOut = conn.out.pos;
            
                    let distIn = (posIn.x - ev.clientX) * (posIn.x - ev.clientX) + (posIn.y - ev.clientY) * (posIn.y - ev.clientY);
                    let distOut = (posOut.x - ev.clientX) * (posOut.x - ev.clientX) + (posOut.y - ev.clientY) * (posOut.y - ev.clientY);
            
                    conn.remove();

                    let source;
                    if (distIn < distOut) {
                        conn.in = null;
                        source = conn.out;
                    } else {
                        conn.out = null;
                        source = conn.in;
                    }
            
                    this.pos = {
                        x: ev.clientX,
                        y: ev.clientY
                    };
            
                    NodeEditor.instance.ui.stagedConnection = conn;                   
                    this.move(0, 0);

                } else if (ev.button == 2) {
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
    
        this.move = (dx: number, dy: number) => {
            this.pos.x += dx;
            this.pos.y += dy;
            let inpos, outpos;

            if (conn.in && conn.out) {
                //move all
                inpos = conn.in.pos;
                outpos = conn.out.pos;
            } else if (conn.in) {
                //move the bottom end
                inpos = conn.in.pos;
                outpos = this.pos;
                this.redraw(this.pos.x, this.pos.y, inpos.x, inpos.y);
            } else if (conn.out) {
                //move the top end
                inpos = this.pos;
                outpos = conn.out.pos;
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
}