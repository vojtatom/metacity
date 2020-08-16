

class Light extends GLObject {
    dir: Vec3Array;

    projectMatrix: Float32Array;

    camera: Camera;
    
    constructor(gl: WebGL2RenderingContext, cam: Camera) {
        super(gl);
        this.dir = new Float32Array([0, 0, 0]);
        this.projectMatrix = new Float32Array(16);
        this.camera = cam;
    }

    get proj() {
        glMatrix.mat4.ortho(this.projectMatrix, -10, 10, -10, 10, 0.01, this.camera.farplane);
        return this.projectMatrix;
    }

}