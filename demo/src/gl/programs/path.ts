class PathProgram extends Program {
    constructor(gl: WebGL2RenderingContext){
        super(gl);
    
        DataManager.files({
            files: [
                Program.DIR + "path-vs.glsl",
                Program.DIR + "path-fs.glsl",
            ],
            success: (files) => {
                this.init(files[0], files[1]);
                this.setup();
            },
            fail: () => {
                throw "Street shader not loaded";
            }
        });
    }

    setup() {
        this.setupAttributes({
            vertex: 'vertex',
            time: 'time'
        });

        this.commonUniforms();
        this.setupUniforms({
            displacement: {
                name: 'displacement',
                type: this.GLType.int
            },
            border_min: {
                name: 'border_min',
                type: this.GLType.vec3
            },
            border_max: {
                name: 'border_max',
                type: this.GLType.vec3
            },
            shift: {
                name: 'shift',
                type: this.GLType.float
            },
            scale: {
                name: 'scale',
                type: this.GLType.float
            },
            world_time: {
                name: 'world_time',
                type: this.GLType.float
            },
            max_time: {
                name: 'max_time',
                type: this.GLType.float
            },
        });
    }

    bindAttrVertex() {
        this.gl.useProgram(this.program);
        this.bindAttribute({
            attribute: this.attributes.vertex,
            size: 2,
            stride: 2 * Float32Array.BYTES_PER_ELEMENT,
            offset: 0,
        });
        this.gl.useProgram(null);
    }

    bindAttrTime() {
        this.gl.useProgram(this.program);
        this.bindAttribute({
            attribute: this.attributes.time,
            size: 1,
            stride: 1 * Float32Array.BYTES_PER_ELEMENT,
            offset: 0,
        });
        this.gl.useProgram(null);
    }
}