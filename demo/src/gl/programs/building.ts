class BuildingProgram extends ShadowProgram {
    constructor(gl: WebGL2RenderingContext){
        super(gl);
    
        DataManager.files({
            files: [
                Program.DIR + "building-vs.glsl",
                Program.DIR + "building-fs.glsl",
            ],
            success: (files) => {
                this.init(files[0], files[1]);
                this.setup();
            },
            fail: () => {
                throw "Building shader not loaded";
            }
        });
    }

    setup() {
        this.setupAttributes({
            vertex: 'vertex',
            normal: 'normal',
            object: 'object'
        });

        this.commonUniforms();
        this.setupUniforms({
            selected: {
                name: 'selected',
                type: this.GLType.vec4,
            }
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

    bindAttrNormal() {
        this.gl.useProgram(this.program);
        this.bindAttribute({
            attribute: this.attributes.normal,
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