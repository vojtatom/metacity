class StreetModel extends GLModel {
    data: StreetModelInterface;
    program: StreetProgram;

    lineSegments: number;

    constructor(gl: WebGL2RenderingContext, programs: GLProgramList, model: StreetModelInterface){
        super(gl);

        this.program = programs.street;
        this.data = model;
        this.init();
    }

    init(){
        //since the method can be called async, check is GPU is up to date
        if (!this.program.loaded)
            return;

        //init VAO
        let vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);
        this.addBufferVAO(vao);

        //vertices
        let vertices = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.data.vertices, this.gl.STATIC_DRAW);
        this.addBufferVBO(vertices);
        this.program.bindAttrVertex();

        this.gl.bindVertexArray(null);

        this.lineSegments = this.data.vertices.length / 2;
        this.loaded = true;

        //no more references to contents of OBJ file 
        //should be present anywhere else
        delete this.data;
    }

    render(scene: Scene){
        if (!this.loaded)
        {
            this.init();
            return;
        }

        this.bindBuffersAndTextures();
        let uniforms: UniformBinder = this.uniformDict(scene);
        uniforms['level'] = scene.stats.max[2];

        this.program.bindUniforms(uniforms);

        this.gl.drawArrays(this.gl.LINES, 0, this.lineSegments);
        this.gl.bindVertexArray(null);
    }
}