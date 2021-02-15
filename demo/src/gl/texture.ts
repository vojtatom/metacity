class Texture extends GLObject {
    width: number;
    height: number;

    id: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, data: string|Float32Array, w: number, h: number) {
        super(gl);
    
        if (typeof(data) === 'string')
            data = Parser.toFloat32(data);

        this.id = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.id);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, w, h, 0, gl.RED, gl.FLOAT, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    bind(unif: UniformBinder) {

    }
}