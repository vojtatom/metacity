

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
    }

    export class CityModel extends GLModel {
        data: GL.CityModelInterface;
        program: GLProgram.TriangleProgram;

        triangles: number;

        constructor(gl: WebGL2RenderingContext, program: GLProgram.TriangleProgram, model: GL.CityModelInterface){
            super(gl);

            this.program = program;
            this.data = model;
            this.init();
        }

        init(){
            //since the method can be called async, check is GPU is up to date
            if (!this.program.loaded)
                return false;

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

            //elements
            let ebo = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ebo);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.data.elements, this.gl.STATIC_DRAW);
            this.addBufferEBO(ebo);

            this.gl.bindVertexArray(null);

            this.triangles = this.data.elements.length / 3;
            this.loaded = true;

            //no more references to contents of OBJ file 
            //should be present anywhere else
            delete this.data;
            console.log("loaded into GPU");
            console.log(this.gl.getError());

            return true;
        }

        render(){
            if (!this.loaded || this.init())
                return;

            
        }
    }


}