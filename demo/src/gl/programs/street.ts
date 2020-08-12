class StreetProgram extends Program {
    constructor(gl: WebGL2RenderingContext){
        super(gl);
    
        DataManager.files({
            files: [
                Program.DIR + "street-vs.glsl",
                Program.DIR + "street-fs.glsl",
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
            vertex: 'vertex'
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
            }
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
}