function intToVec4Normalized(i: number) {
    let n = new Uint32Array([i]);
    let b = new Uint8Array(n.buffer);
    let f = new Float32Array(b);
    f[0] /= 255;
    f[1] /= 255;
    f[2] /= 255;
    f[3] /= 255;
    return f;
}

class Scene extends GLObject {
    stats: OBJstats;
    camera: Camera;
    center: Vec3Array;
    selected: number;
    selectedv4: Float32Array;

    constructor(gl: WebGL2RenderingContext) {
        super(gl);

        this.camera = new Camera(this.gl);
        this.center = new Float32Array([0, 0, 0]);

        this.stats = {
            min: [Infinity, Infinity, Infinity],
            max: [-Infinity, -Infinity, -Infinity],
        };

        //this.selected = 4294967295;
        this.selected = 1000;
        this.selectedv4 = intToVec4Normalized(this.selected);
        
    }

    select(id: number) {
        this.selected = id;
        this.selectedv4 = intToVec4Normalized(this.selected);
    }

    addModel(stats: OBJstats) {
        this.stats.min[0] = Math.min(this.stats.min[0], stats.min[0]);
        this.stats.min[1] = Math.min(this.stats.min[1], stats.min[1]);
        this.stats.min[2] = Math.min(this.stats.min[2], stats.min[2]);
        this.stats.max[0] = Math.max(this.stats.max[0], stats.max[0]);
        this.stats.max[1] = Math.max(this.stats.max[1], stats.max[1]);
        this.stats.max[2] = Math.max(this.stats.max[2], stats.max[2]);
        this.camera.updateScale(this.stats);
    }
}
