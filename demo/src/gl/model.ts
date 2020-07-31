

module GLModels {
    
    export class GLModel extends GLBase.GLObject {
        loaded: boolean;

        buffers: {
            vao: WebGLVertexArrayObject,
            ebo: WebGLBuffer,
            vbo: Array<WebGLBuffer>,
        }

        constructor(gl: WebGL2RenderingContext){
            super(gl);
            this.loaded = false;

            this.buffers = {
                vao: undefined,
                ebo: undefined,
                vbo: [],
            }
        }

        //BUFFERS MANAGEMENT
        addBufferVAO(buffer: WebGLVertexArrayObject){
            this.buffers.vao = buffer;
        }

        addBufferVBO(buffer: WebGLBuffer){
            this.buffers.vbo.push(buffer);
        }

        addBufferEBO(buffer: WebGLBuffer){
            this.buffers.ebo = buffer;
        }

        bindBuffersAndTextures(){
            this.gl.bindVertexArray(this.buffers.vao);
    
            for (let buffer of this.buffers.vbo){
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            }
            
            if (this.buffers.ebo !== undefined) {
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.ebo);
            }
    
            /*for (let texture of this.textures){
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            }*/
        }

        uniformDict(scene: GL.Scene){
            return Object.assign({}, {
                view: scene.camera.view,
                proj: scene.camera.projection,
                farplane: scene.camera.farplane,
            });
        }

        render(scene: GL.Scene){

        }

        renderPicking(scene: GL.Scene){

        }
    }

    export class CubeModel extends GLModel {
        data: GL.BoxModelInterface;
        program: GLProgram.BoxProgram;

        constructor(gl: WebGL2RenderingContext, programs: GL.GLProgramList, model: GL.BoxModelInterface){
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


            let vdata = GLGeometry.boxVertices(this.data.min, this.data.max);
            //vertices
            let vertices = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertices);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, vdata, this.gl.STATIC_DRAW);
            this.addBufferVBO(vertices);
            this.program.bindAttrVertex();

            this.gl.bindVertexArray(null);
            this.loaded = true;
        }

        render(scene: GL.Scene){
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

    export class CityModel extends GLModel {
        data: GL.CityModelInterface;
        program: GLProgram.BuildingProgram;
        pickingProgram: GLProgram.PickProgram;

        triangles: number;

        constructor(gl: WebGL2RenderingContext, programs: GL.GLProgramList, model: GL.CityModelInterface){
            super(gl);

            this.program = programs.building;
            this.pickingProgram = programs.pick;
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
            this.pickingProgram.bindAttrVertex();
            
            //normals
            let normals = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normals);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.data.normals, this.gl.STATIC_DRAW);
            this.addBufferVBO(normals);
            this.program.bindAttrNormal();
            
            //objects
            let objects = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objects);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.data.objects, this.gl.STATIC_DRAW);
            this.addBufferVBO(objects);
            this.program.bindAttrObject();
            this.pickingProgram.bindAttrObject();

            this.gl.bindVertexArray(null);

            this.triangles = this.data.vertices.length / 3;
            this.loaded = true;

            //no more references to contents of OBJ file 
            //should be present anywhere else
            delete this.data;
        }

        render(scene: GL.Scene){
            if (!this.loaded)
            {
                this.init();
                return;
            }

            this.bindBuffersAndTextures();
            let uniforms : GLProgram.UniformBinder = this.uniformDict(scene);
            uniforms["selected"] = scene.selectedv4;

            this.program.bindUniforms(uniforms);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, this.triangles);
            this.gl.bindVertexArray(null);
        }

        renderPicking(scene: GL.Scene) {
            if (!this.loaded)
            {
                this.init();
                return;
            }

            this.bindBuffersAndTextures();
            let uniforms = this.uniformDict(scene);
            this.pickingProgram.bindUniforms(uniforms);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, this.triangles);
            this.gl.bindVertexArray(null);
        }
    }


}