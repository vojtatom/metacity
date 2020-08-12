class TerrainProgram extends Program {
    constructor(gl: WebGL2RenderingContext){
        super(gl);
    
        DataManager.files({
            files: [
                Program.DIR + "terrain-vs.glsl",
                Program.DIR + "terrain-fs.glsl",
            ],
            success: (files) => {
                this.init(files[0], files[1]);
                this.setup();
            },
            fail: () => {
                throw "Terrain shader not loaded";
            }
        });
    }

    setup() {
        this.setupAttributes({
            vertex: 'vertex',
            normal: 'normal',
        });

        this.commonUniforms();
        this.setupUniforms({});
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
}