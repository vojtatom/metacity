class CubeModel extends GLModel {
    data: BoxModelInterface;
    program: BoxProgram;

    constructor(gl: WebGL2RenderingContext, programs: GLProgramList, model: BoxModelInterface){
        super(gl);

        this.program = programs.box;
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


        let vdata = boxVertices(this.data.min, this.data.max);
        //vertices
        let vertices = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vdata, this.gl.STATIC_DRAW);
        this.addBufferVBO(vertices);
        this.program.bindAttrVertex();

        this.gl.bindVertexArray(null);
        this.loaded = true;
    }

    render(scene: Scene){
        if (!this.loaded)
        {
            this.init();
            return;
        }

        this.bindBuffersAndTextures();
        let uniforms = this.uniformDict(scene);
        this.program.bindUniforms(uniforms);

        this.gl.drawArrays(this.gl.LINES, 0, 24);
        this.gl.bindVertexArray(null);
    }

}