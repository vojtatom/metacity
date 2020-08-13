interface Streets {
    type: 'geo',
    lineVertices: Float32Array,
    lineObjects: Uint32Array,
    idToObj: {[name: number]: string},
    objToId: {[name: string]: number},
    metadata: {[name: string]: any}
}

interface StreetGraph {
    type: 'graph',
    data: {[node: string]: string[]},
    degrees: {[deg: number]: number}
}

class Streets extends Layer {
    glmodel: StreetModel;
    graph: StreetGraph;

    constructor(gl: Graphics, data: any) {
        super(gl);

        data.lineVertices = Parser.toFloat32(data.lineVertices as string);
        data.lineObjects = Parser.toUint32(data.lineObjects as string);
        console.log(data);

        let models = this.gl.addStreetSegment(data as StreetModelInterface);
        this.glmodel = models.streetModel;
    }

    addStreetGraph(data: StreetGraph) {
        console.log(data.data);
        this.graph = data;

        let len = 1000;
        let count = 1000;
        let offset = 0;
        let vert = new Float32Array(len * count * 4);
        let times = new Float32Array(len * count * 2);

        for(let i = 0; i < count; ++i) {
            offset = Path.randomPath(this.graph.data, 100, vert, times, offset);
            this.gl.scene.setTimeMax((times[(offset / 2) - 1]));
        }

        this.gl.addPath({
            vertices: new Float32Array(vert.slice(0, offset)),
            times: new Float32Array(times.slice(0, offset / 2))
        });
    }
}