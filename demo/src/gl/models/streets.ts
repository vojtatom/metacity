class StreetModel extends GLModel {
    data: StreetModelInterface;
    program: StreetProgram;
    pickProgram: PickLineProgram;

    lineSegments: number;
    segmentSize: number;

    pickVAO: WebGLVertexArrayObject;

    constructor(gl: WebGL2RenderingContext, programs: GLProgramList, model: StreetModelInterface){
        super(gl);

        this.program = programs.street;
        this.pickProgram = programs.pickLine;
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

        //objects
        let objects = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objects);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.data.lineObjects, this.gl.STATIC_DRAW);
        this.addBufferVBO(objects);
        this.program.bindAttrObject();

        this.gl.bindVertexArray(null);
        this.lineSegments = this.data.lineVertices.length / 2;
        
        //PICKING-------------------------------
        this.pickVAO = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.pickVAO);
        
        //objects
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objects);
        this.pickProgram.bindAttrObject();
        
        //start/ends
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertices);
        this.pickProgram.bindAttrStartVert();
        this.pickProgram.bindAttrEndVert();
        
        //instances
        let geometry = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry);
        let geom = glyphVertLine(4);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, geom, this.gl.STATIC_DRAW);
        this.addBufferVBO(geometry);
        this.pickProgram.bindAttrVertex();
        
        this.segmentSize = geom.length / 3;
        
        
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
        uniforms["selected"] = scene.selectedv4;
        uniforms['displacement'] = scene.textures['height'].id;
        uniforms['border_min'] = scene.stats.min;
        uniforms['border_max'] = scene.stats.max;


        this.program.bindUniforms(uniforms);

        this.gl.drawArrays(this.gl.LINES, 0, this.lineSegments);
        this.gl.bindVertexArray(null);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    renderPicking(scene: Scene){
        if (!this.loaded)
        {
            this.init();
            return;
        }

        //this.bindBuffersAndTextures();
        this.gl.bindVertexArray(this.pickVAO);

        //bind texture
        this.gl.bindTexture(this.gl.TEXTURE_2D, scene.textures['height'].id);
        
        let uniforms: UniformBinder = this.uniformDict(scene);
        uniforms['displacement'] = scene.textures['height'].id;
        uniforms['border_min'] = scene.stats.min;
        uniforms['border_max'] = scene.stats.max;

        this.pickProgram.bindUniforms(uniforms);

        this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, this.segmentSize, this.lineSegments / 2);

        //this.gl.drawArrays(this.gl.LINES, 0, this.lineSegments);
        this.gl.bindVertexArray(null);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }
}