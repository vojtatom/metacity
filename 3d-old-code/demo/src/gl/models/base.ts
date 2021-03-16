class GLModel extends GLObject {
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

        /*for (let buffer of this.buffers.vbo){
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        }
        
        if (this.buffers.ebo !== undefined) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.ebo);
        }*/

        /*for (let texture of this.textures){
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        }*/
    }

    uniformDict(scene: Scene){
        return Object.assign({}, {
            /*world: scene.camera.world,
            view: scene.camera.view,
            proj: scene.camera.projection,*/
            world: scene.camera.world,
            vp: scene.camera.vp,
            farplane: scene.camera.farplane,
        }) as UniformBinder;
    }

    render(scene: Scene){

    }

    renderPicking(scene: Scene){

    }

    renderShadow(scene: Scene){

    }
}