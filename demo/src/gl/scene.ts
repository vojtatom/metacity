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

let TIME_DELTA = 3.0;

class Scene extends GLObject {
    stats: F32OBJstats;
    scaledStats: F32OBJstats;
    camera: Camera;
    light: Light;
    center: Vec3Array;
    selected: number;
    time: number;
    timeMax: number;
    selectedv4: Float32Array;

    textures: {[name: string]: Texture};

    constructor(gl: WebGL2RenderingContext, textures: {[name: string]: Texture}) {
        super(gl);

        this.camera = new Camera(this.gl);
        this.light = new Light(this.gl, this.camera);
        this.center = new Float32Array([0, 0, 0]);

        this.stats = {
            min: new Float32Array([Infinity, Infinity, Infinity]),
            max: new Float32Array([-Infinity, -Infinity, -Infinity]),
        };

        this.scaledStats = {
            min: new Float32Array([Infinity, Infinity, Infinity]),
            max: new Float32Array([-Infinity, -Infinity, -Infinity]),
        };

        //this.selected = 4294967295;
        this.selected = 1000;
        this.selectedv4 = intToVec4Normalized(this.selected);
        
        this.textures = textures;
        this.time = 0;
        this.timeMax = 0;
    }

    select(id: number) {
        this.selected = id;
        this.selectedv4 = intToVec4Normalized(this.selected);
        console.log(this.selected, this.selectedv4);
    }

    addModel(stats: OBJstats) {
        this.stats.min[0] = Math.min(this.stats.min[0], stats.min[0]);
        this.stats.min[1] = Math.min(this.stats.min[1], stats.min[1]);
        this.stats.min[2] = Math.min(this.stats.min[2], stats.min[2]);
        this.stats.max[0] = Math.max(this.stats.max[0], stats.max[0]);
        this.stats.max[1] = Math.max(this.stats.max[1], stats.max[1]);
        this.stats.max[2] = Math.max(this.stats.max[2], stats.max[2]);
        
        this.camera.updateScale(this.stats);

        glMatrix.vec3.copy(this.scaledStats.min, this.stats.min);
        glMatrix.vec3.copy(this.scaledStats.max, this.stats.max);
        this.rescale3D(this.scaledStats.min);
        this.rescale3D(this.scaledStats.max);
    }

    frame() {
        this.camera.frame();
        this.time = (this.time + TIME_DELTA) % this.timeMax;
    }

    setTimeMax(time: number) {
        this.timeMax = Math.max(this.timeMax, time);
    }

    rescale3D(data: Float32Array) {
        rescale3D(data, this.camera.shift, GLOBAL_SCALE);
    }

    rescale2D(data: Float32Array) {
        rescale2D(data, this.camera.shift, GLOBAL_SCALE);
    }
}
