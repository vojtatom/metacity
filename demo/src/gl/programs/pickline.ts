class PickLineProgram extends Program {
    constructor(gl: WebGL2RenderingContext){
        super(gl);
    
        DataManager.files({
            files: [
                Program.DIR + "pickline-vs.glsl",
                Program.DIR + "pickline-fs.glsl",
            ],
            success: (files) => {
                this.init(files[0], files[1]);
                this.setup();
            },
            fail: () => {
                throw "Pick line shader not loaded";
            }
        });
    }

    setup() {
        this.setupAttributes({
            vertex: 'vertex',
            startVert: 'startVert',
            endVert: 'endVert',
            object: 'object',
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
            size: 3,
            stride: 3 * Float32Array.BYTES_PER_ELEMENT,
            offset: 0
        });
        this.gl.useProgram(null);
    }

    bindAttrStartVert() {
        this.gl.useProgram(this.program);
        this.bindAttribute({
            attribute: this.attributes.startVert,
            size: 2,
            stride: 4 * Float32Array.BYTES_PER_ELEMENT,
            offset: 0,
            divisor: 1
        });
        this.gl.useProgram(null);
    }

    bindAttrEndVert() {
        this.gl.useProgram(this.program);
        this.bindAttribute({
            attribute: this.attributes.endVert,
            size: 2,
            stride: 4 * Float32Array.BYTES_PER_ELEMENT,
            offset: 2 * Float32Array.BYTES_PER_ELEMENT,
            divisor: 1
        });
        this.gl.useProgram(null);
    }

    bindAttrObject() {
        this.gl.useProgram(this.program);
        this.bindInt32Attribute({
            attribute: this.attributes.object,
            size: 4, // has to be 4
            stride: 2 * Uint32Array.BYTES_PER_ELEMENT,
            offset: 0,
            divisor: 1
        });
        this.gl.useProgram(null);
    }
}