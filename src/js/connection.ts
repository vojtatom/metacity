
class Connection {

    //Input connector
    in: Connector;

    //Output connector
    out: Connector;
    
    pos: {
        x: number,
        y: number
    };

    svg: SVGElement;
    element: SVGElement;
    selecElement: SVGElement;

    constructor(source: Connector, x: number, y: number, svg: SVGElement) {
        this.svg = svg;

        if (source.inout == ConnectorType.input) {
            this.out = null;
            this.in = source
        } else {
            this.out = source;
            this.in = null;
        }

        this.pos = {
            x: x,
            y: y
        };


        this.html();
    }

    static key(outConn: Connector, inConn: Connector){
        return outConn.node.id + outConn.parameter + "---" + inConn.node.id + inConn.parameter;
    }

    get key() {
        return Connection.key(this.out, this.in);
    }

    connect(conn: Connector) {
        //check for inout
        let sourceConn;
        let key;
        if (this.in)
        {
            sourceConn = this.in;
            key = Connection.key(conn, this.in);
            if(conn.inout == ConnectorType.input)
                return false;
        } else {
            sourceConn = this.out;
            key = Connection.key(this.out, conn);
            if (conn.inout == ConnectorType.output)
                return false;
        }

        //check for type
        if (sourceConn.type != conn.type)
            return false;

        //check for existing
        if (key in sourceConn.editor.connections)
            return false;

        if (this.in)
            this.out = conn;
        else 
            this.in = conn;


        //remove all incoming connections
        for(let conn in this.in.connections)
        {
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

        if (this.in && this.out)
        {
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
        this.selecElement.onmousedown = (ev: MouseEvent) => this.mousedown(ev);
        this.selecElement.classList.add("fatline");

        this.svg.appendChild(this.element);
        this.svg.appendChild(this.selecElement);
    }

    mousedown(ev: MouseEvent) {
        if (this.in && this.out)
        {
            if (ev.button == 0)
            {
                //move existing
                let posIn = this.in.pos;
                let posOut = this.out.pos;
        
                let distIn = (posIn.x - ev.clientX) * (posIn.x - ev.clientX) + (posIn.y - ev.clientY) * (posIn.y - ev.clientY);
                let distOut = (posOut.x - ev.clientX) * (posOut.x - ev.clientX) + (posOut.y - ev.clientY) * (posOut.y - ev.clientY);
        
                this.remove();
        
                let source;
                if (distIn < distOut) {
                    this.in = null;
                    source = this.out;
                } else {
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
            } else if (ev.button == 2) {
                this.remove();
            }
    
            ev.preventDefault();
            ev.stopPropagation();
        } 

    }
    
    move(dx: number, dy: number) {
        this.pos.x += dx;
        this.pos.y += dy;


        if (this.in && this.out) {
            //move all
            this.draw();
        } else if (this.in) {
            //move the bottom end
            let inpos = this.in.pos;
            this.redraw(this.pos.x, this.pos.y, inpos.x, inpos.y);

        } else if (this.out) {
            //move the top end

            let outpos = this.out.pos;
            this.redraw(outpos.x, outpos.y, this.pos.x, this.pos.y);
        }
    }

    draw() {
        let inpos = this.in.pos;
        let outpos = this.out.pos;
        this.redraw(outpos.x, outpos.y, inpos.x, inpos.y);
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
        }
    }

    static load(outConn: Connector, inConn: Connector, editor: Editor) {
        let connection = new Connection(outConn, 0, 0, editor.svg);
        connection.connect(inConn);
        connection.draw();
    }
}