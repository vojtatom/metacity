interface Streets {
    type: 'geo',
    lineVertices: Float32Array,
    lineObjects: Uint32Array,
    idToObj: {[name: number]: string},
    objToId: {[name: string]: number},
    metadata: {[name: string]: any}
}

class Streets extends Layer {
    glmodel: StreetModel;

    constructor(gl: Graphics, data: any) {
        super(gl);

        data.lineVertices = Parser.toFloat32(data.lineVertices as string);
        data.lineObjects = Parser.toUint32(data.lineObjects as string);
        console.log(data);

        let models = this.gl.addStreetSegment(data as StreetModelInterface);
        this.glmodel = models.streetModel;
    }
}