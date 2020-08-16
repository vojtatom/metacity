class TerrainModel extends GLModel {
    data: TerrainModelInterface;
    program: TerrainProgram;
    simpleProgram: TriangleProgram;

    triangles: number;

    constructor(gl: WebGL2RenderingContext, programs: GLProgramList, model: TerrainModelInterface){
        super(gl);

        this.program = programs.terrain;
        this.simpleProgram = programs.triangle;
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
        this.simpleProgram.bindAttrVertex();
        
        //normals
        let normals = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normals);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.data.normals, this.gl.STATIC_DRAW);
        this.addBufferVBO(normals);
        this.program.bindAttrNormal();

        this.gl.bindVertexArray(null);

        this.triangles = this.data.vertices.length / 3;
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
        this.gl.bindTexture(this.gl.TEXTURE_2D, scene.light.depth);

        let uniforms: UniformBinder = this.uniformDict(scene);
        uniforms['mLVP'] = scene.light.vp;
        uniforms['shadowmap'] = scene.light.depth;
        uniforms['texSize'] = scene.light.texSize;
        uniforms['tolerance'] = scene.light.tolerance;

        this.program.bindUniforms(uniforms);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.triangles);
        this.gl.bindVertexArray(null);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    renderShadow(scene: Scene){
        if (!this.loaded)
        {
            this.init();
            return;
        }

        this.bindBuffersAndTextures();
        let uniforms = this.uniformDict(scene);
        uniforms["vp"] = scene.light.vp;
        console.log(scene.light.vp);

        this.simpleProgram.bindUniforms(uniforms);
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.triangles);
        this.gl.bindVertexArray(null);
    }
}