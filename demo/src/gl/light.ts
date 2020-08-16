

class Light extends GLObject {
    pos: Vec3Array;

    projectMatrix: Float32Array;
    viewMatrix: Float32Array;

    camera: Camera;

    fb: WebGLFramebuffer;
    depth: WebGLTexture;
    texSize: number;
    tolerance: number;
    
    //the setting is ad-hoc for the bubny example, needs to be imlepemeted properly
    constructor(gl: WebGL2RenderingContext, cam: Camera) {
        super(gl);
        let center = new Float32Array([0, 0, 0]);
        let up = new Float32Array([0, 0, 1]);
        this.pos = new Float32Array([2.5, 1.25, 2.5]);
        this.projectMatrix = new Float32Array(16);
        this.viewMatrix = new Float32Array(16);
        glMatrix.mat4.lookAt(this.viewMatrix, this.pos, center, up);
        this.camera = cam;
        this.texSize = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 8192);
        this.tolerance = 0.0005;
    }

    get vp() {
        glMatrix.mat4.ortho(this.projectMatrix, -5, 5, -5, 5, 0.01, this.camera.farplane / 2);
        glMatrix.mat4.mul(this.projectMatrix, this.projectMatrix, this.viewMatrix);
        return this.projectMatrix;
    }

    createFrameBufferObject(width: number, height: number) {
        let frame_buffer = this.gl.createFramebuffer();

        let color_buffer = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, color_buffer);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0,
            this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        let depth_buffer = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, depth_buffer);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT24, width, height, 0,
            this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, null);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);


        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frame_buffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, color_buffer, 0);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT,  this.gl.TEXTURE_2D, depth_buffer, 0);

        let status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        if (status !== this.gl.FRAMEBUFFER_COMPLETE)
            console.log("The created frame buffer is invalid: " + status.toString());

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.fb = frame_buffer;
        this.depth = depth_buffer;
    }

    createShadowmap(graphics: Graphics) {
        this.createFrameBufferObject(this.texSize, this.texSize);
        this.gl.viewport(0, 0, this.texSize, this.texSize);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,  this.fb);

        graphics.renderShadow();

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,  null);
        graphics.resize(graphics.canvas.width, graphics.canvas.height);
    }



}