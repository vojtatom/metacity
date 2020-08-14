



const ZOOM_STEP = 0.0025;
const ROT_STEP = 0.5;

const GLOBAL_SCALE = 0.001;

class Camera extends GLObject {
    position: Vec3Array;
    up: Vec3Array;
    center: Vec3Array;
    geometryCenter: Vec3Array;
    actualPosition: Vec3Array;
    actualUp: Vec3Array;
    actualCenter: Vec3Array;
    normal: Vec3Array;
    scale: number;
    defaultCenter: Vec3Array;

    viewMatrix: Float32Array;
    worldMatrix: Float32Array;
    projectionMatrix: Float32Array;
    rotateMatrix: Float32Array;
    frontVector: Float32Array;
    tmp: Float32Array;
    tmp2: Float32Array;

    screenX: number;
    screenY: number;
    aspect: number;
    sceneChanged: boolean;
    speed: number;

    farplane: number;

    positionMomentum : number;
    centerMomentum : number;
    rotMomentum : number;
    scaleMomentum : number;
    
    constructor(gl: WebGL2RenderingContext){
        super(gl);
        this.position = new Float32Array([0, 0, 0]);
        this.up = new Float32Array([0, 1, 0]);
        this.geometryCenter = new Float32Array([0, 0, 0]);
        this.center = new Float32Array([0, 0, 100]);
        this.actualPosition = new Float32Array([0, 0, 0]);
        this.actualUp = new Float32Array([0, 1, 0]);
        this.actualCenter = new Float32Array([, 0, 100]);

        this.viewMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);
        this.rotateMatrix = new Float32Array(16);
        this.frontVector = new Float32Array(3);
        this.tmp = new Float32Array(3);
        this.tmp2 = new Float32Array(3);

        this.worldMatrix = glMatrix.mat4.create();

        this.screenX = 0;
        this.screenY = 0;
        this.scale = 100;
        this.speed = 0.05;
        this.aspect = 0;
        this.sceneChanged = false; 
        this.farplane = 1000000;

                
        this.positionMomentum = 1;
        this.centerMomentum = 1;
        this.rotMomentum = 1;
        this.scaleMomentum = 1;
    }

    get view() {
        glMatrix.mat4.lookAt(this.viewMatrix, this.actualPosition, this.actualCenter, this.actualUp);
        return this.viewMatrix;
    }

    get projection() {
        return glMatrix.mat4.perspective(this.projectionMatrix, glMatrix.glMatrix.toRadian(45), this.aspect, 0.01, this.farplane);
    }

    get world() {
        return this.worldMatrix;
    }

    get front() {
        glMatrix.vec3.sub(this.frontVector, this.center, this.position);
        return glMatrix.vec3.normalize(this.frontVector, this.frontVector);
    }

    get screenDim() {
        return vec2.fromValues(this.screenX, this.screenY);
    }

    get pos() {
        return this.position; 
    } 

    restoreCenter(){
        this.center = Object.assign({}, this.defaultCenter);
    }

    viewTop(){
        let dist = glMatrix.vec3.dist(this.center, this.position);
        this.position = Object.assign({}, this.center);
        this.position[2] += dist;
        this.up = new Float32Array([0, 1, 0]);
    }
    
    viewFront(){
        let dist = glMatrix.vec3.dist(this.center, this.position);
        this.position = Object.assign({}, this.center);
        this.position[1] -= dist;
        this.up = new Float32Array([0, 0, 1]);
    }
    
    viewSide(){
        let dist = glMatrix.vec3.dist(this.center, this.position);
        this.position = Object.assign({}, this.center);
        this.position[0] -= dist;//this.farplane / 2;
        this.up = new Float32Array([0, 0, 1]);
    }

    resize(x: number, y: number){
        this.screenX = x;
        this.screenY = y;
        this.aspect = x / y;
        this.sceneChanged = true;
    }

    rotate(x: number, y: number) {
        let a_x = glMatrix.glMatrix.toRadian(-x) * ROT_STEP;
        let a_y = glMatrix.glMatrix.toRadian(y) * ROT_STEP;
        let front = glMatrix.vec3.sub(glMatrix.vec3.create(), this.center, this.position);

        let axes_x = glMatrix.vec3.cross(this.tmp, this.up, front);
        let axes_y = this.up;

        glMatrix.mat4.fromRotation(this.rotateMatrix, a_x, axes_y);
        glMatrix.mat4.rotate(this.rotateMatrix, this.rotateMatrix, a_y, axes_x);
        glMatrix.vec3.transformMat4(front, front, this.rotateMatrix);
        
        glMatrix.vec3.add(this.position, this.center, glMatrix.vec3.negate(front, front))
        glMatrix.vec3.transformMat4(this.up, this.up, this.rotateMatrix);
    }

    zoom(direction: number = 1, scale: number = 1) {
        glMatrix.vec3.sub(this.tmp, this.position, this.center);
        glMatrix.vec3.scale(this.tmp, this.tmp, 1 + direction * (ZOOM_STEP * scale));
        glMatrix.vec3.add(this.tmp, this.center, this.tmp);
        glMatrix.vec3.copy(this.position, this.tmp);
    }

    move(x: number, y: number) {
        let front = glMatrix.vec3.sub(glMatrix.vec3.create(), this.center, this.position);
        //let dist = glMatrix.vec3.len(front);
        let axes_x = glMatrix.vec3.normalize(this.tmp, glMatrix.vec3.cross(this.tmp, this.up, front));
        let axes_y = glMatrix.vec3.normalize(this.tmp2, glMatrix.vec3.copy(this.tmp2, this.up));  
        
        glMatrix.vec3.scale(axes_x, axes_x, x * GLOBAL_SCALE);
        glMatrix.vec3.scale(axes_y, axes_y, y * GLOBAL_SCALE);
        glMatrix.vec3.add(this.position, this.position, axes_x);
        glMatrix.vec3.add(this.position, this.position, axes_y);
        glMatrix.vec3.add(this.center, this.center, axes_x);
        glMatrix.vec3.add(this.center, this.center, axes_y);

    }

    frame(){
        const limit = 0.01 * GLOBAL_SCALE;

        glMatrix.vec3.sub(this.tmp, this.position, this.actualPosition);
        this.positionMomentum = glMatrix.vec3.length(this.tmp);
        if (this.positionMomentum > limit){
            glMatrix.vec3.scaleAndAdd(this.actualPosition, this.actualPosition, this.tmp, this.speed * 4);
        } else {
            glMatrix.vec3.copy(this.actualPosition, this.position);
            this.positionMomentum = 0;
        }
        
        this.rotMomentum = Math.min(glMatrix.vec3.angle(this.actualUp, this.up), this.speed * 3.14);
        if (this.rotMomentum > limit) {
            let axis = glMatrix.vec3.cross(this.tmp, this.actualUp, this.up);
            glMatrix.mat4.fromRotation(this.rotateMatrix, this.rotMomentum, axis);
            glMatrix.vec3.transformMat4(this.actualUp, this.actualUp, this.rotateMatrix);   
        } else {
            glMatrix.vec3.copy(this.actualUp, this.up);
            this.rotMomentum = 0;
        }

        glMatrix.vec3.sub(this.tmp, this.center, this.actualCenter);
        this.centerMomentum = glMatrix.vec3.length(this.tmp);
        if (this.centerMomentum > limit){
            glMatrix.vec3.scaleAndAdd(this.actualCenter, this.actualCenter, this.tmp, this.speed * 4);
        } else {
            glMatrix.vec3.copy(this.actualCenter, this.center);
            this.centerMomentum = 0;
        }

        //tmp is now direction of view
        //glMatrix.vec3.sub(this.tmp, this.defaultCenter, this.actualPosition); 
        //adding dist from position to geometry center and radius of geomtry from the geom center
        //TODO autoset farplane to be optimal
        //this.farplane = vec3.len(this.tmp) + this.geometryRadius;
    }

    updateScale(stats: OBJstats) {
        let farplane = 0;
        for(let i = 0; i < 3; ++i){
            this.geometryCenter[i] = (stats.min[i] + stats.max[i]) / 2;
            farplane = Math.max(farplane, (stats.max[i] - stats.min[i]) * GLOBAL_SCALE);
        }
        
        //make a deep copy
        this.center = glMatrix.vec3.fromValues(0, 0, 0);
        this.farplane = farplane * 2;
        this.defaultCenter = Object.assign({}, this.center);
        this.position = Object.assign({}, this.center);
        this.position[2] += farplane / 2;
        
        glMatrix.mat4.identity(this.worldMatrix);
        glMatrix.mat4.scale(this.worldMatrix, this.worldMatrix, 
            glMatrix.vec3.fromValues(GLOBAL_SCALE, GLOBAL_SCALE, GLOBAL_SCALE));
        glMatrix.mat4.translate(this.worldMatrix, this.worldMatrix, glMatrix.vec3.negate(this.tmp, this.geometryCenter));
    }

    get needsRedraw() {
        return this.centerMomentum || this.rotMomentum || this.positionMomentum;
    }
}