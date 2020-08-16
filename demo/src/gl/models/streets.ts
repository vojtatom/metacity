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
        //since the method can be called async, check if GPU is up to date
        if (!this.program.loaded)
            return;

        //init VAO
        let vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);
        this.addBufferVAO(vao);

        //vertices
        let vertices = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.data.lineVertices, this.gl.STATIC_DRAW);
        this.addBufferVBO(vertices);
        this.program.bindAttrVertex();

        this.gl.bindVertexArray(null);

        this.lineSegments = this.data.lineVertices.length / 2;
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

        //bind texture
        this.gl.bindTexture(this.gl.TEXTURE_2D, scene.textures['height'].id);
        let uniforms: UniformBinder = this.uniformDict(scene);
        uniforms['displacement'] = scene.textures['height'].id;
        uniforms['border_min'] = scene.scaledStats.min;
        uniforms['border_max'] = scene.scaledStats.max;
        uniforms['shift'] = scene.camera.shift[2];
        uniforms['scale'] = GLOBAL_SCALE;


        this.program.bindUniforms(uniforms);

        this.gl.drawArrays(this.gl.LINES, 0, this.lineSegments);
        this.gl.bindVertexArray(null);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }
}