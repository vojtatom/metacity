
class EditorNode {
    pos: {
        x: number,
        y: number
    };

    inParams: Connector[];
    outParams: Connector[];
    
    title: string;
    id: string;

    element: HTMLElement;
    selected: boolean;

    editor: Editor;

    static idCounter = 0;

    constructor(title: string, x: number, y: number, inParams: ConnectorInterface[], outParams: ConnectorInterface[], editor: Editor, id?: string) {
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

        //register
        this.editor.registerNode(this);
    }

    html() {
        //base element
        this.element = document.createElement("div");
        this.element.id = this.id;
        this.element.classList.add("node");

        //title
        let title = document.createElement("div");
        title.innerHTML = this.title;
        title.classList.add("title");
        title.title = this.id;

        //connectors
        let inputParam = this.paramsConatiner(this.inParams);
        let outputParam = this.paramsConatiner(this.outParams);
        let params = document.createElement("div");
        params.classList.add("params");

        //assemble
        this.element.appendChild(title);
        params.appendChild(inputParam);
        params.appendChild(outputParam);
        this.element.appendChild(params);

        //offset
        this.applyTransform();

        //callbacks
        this.element.onmousedown = (ev: MouseEvent) => this.mousedown(ev);
    }

    paramsConatiner(params: Connector[]) {
        let container = document.createElement("div");
        container.classList.add("connectors");
        container.style.height = Connector.connectorSize  + "px";

        for(let param of params) {
            container.appendChild(param.html());
        }

        return container;
    }

    mousedown(ev: MouseEvent) {
        if (ev.button == 0)
        {
            if (this.selected)
                this.deselect();
            else 
                this.select();
        } else if (ev.button == 2) {
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

    move(dx: number, dy: number) {
        this.pos.x += dx;
        this.pos.y += dy;
        this.applyTransform();

        for(let param of this.inParams)
            param.drawConnenctions();
        
        for(let param of this.outParams)
            param.drawConnenctions();
    }

    remove() {  
        for(let param of this.inParams)
            param.removeAllConnections();
        
        for(let param of this.outParams)
            param.removeAllConnections();

        this.editor.deregisterNode(this);
    }

    applyTransform() {
        this.element.style.transform = 'translate(' + this.pos.x + 'px, ' + this.pos.y + 'px)';
    }

    get serialized() {
        let inPars = [];

        for(let param of this.inParams)
            inPars.push(param.serialized);
    
        let outPars = [];

        for(let param of this.outParams)
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
        }
    }

    getConnector(inout: ConnectorType, param: string) {
        let connectors = inout == ConnectorType.input ? this.inParams : this.outParams;

        for(let conn of connectors)
            if (conn.parameter == param)
                return conn;
    }

    static load(data: any, editor: Editor) {
        let node = new EditorNode(data.title, data.pos.x, data.pos.y, data.inParameters, data.outParameters, editor, data.id);
        
        let id = data.id;
        let num = Number(id.slice(4));
        EditorNode.idCounter = Math.max(EditorNode.idCounter, num + 1);
            
        return node;
    }
}