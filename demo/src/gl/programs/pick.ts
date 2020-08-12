class PickProgram extends Program {
    constructor(gl: WebGL2RenderingContext){
        super(gl);
    
        DataManager.files({
            files: [
                Program.DIR + "pick-vs.glsl",
                Program.DIR + "pick-fs.glsl",
            ],
            success: (files) => {
                this.init(files[0], files[1]);
                this.setup();
            },
            fail: () => {
                throw "Pick shader not loaded";
            }
        });
    }

    setup() {
        this.setupAttributes({
            vertex: 'vertex',
            object: 'object'
        });

        this.commonUniforms();
        this.setupUniforms({
            /*size: {
                name: 'size',
                type: this.GLType.float,
            }*/
        });
    }

    bindAttrVertex() {
        this.gl.useProgram(this.program);
        this.bindAttribute({
            attribute: this.attributes.vertex,
            size: 3,
            stride: 3 * Float32Array.BYTES_PER_ELEMENT,
            offset: 0,
        });
        this.gl.useProgram(null);
    }

    bindAttrObject() {
        this.gl.useProgram(this.program);
        this.bindInt32Attribute({
            attribute: this.attributes.object,
            size: 4, // has to be 4
            stride: 1 * Uint32Array.BYTES_PER_ELEMENT,
            offset: 0,
        });
        this.gl.useProgram(null);
    }
}