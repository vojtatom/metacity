

module GLCamera {

    const MOVE_STEP = 0.0025;
    const ROT_STEP = 0.5;

    export class Camera extends GLBase.GLObject {
        position: Vec3Array;
        up: Vec3Array;
        center: Vec3Array;
        actualPosition: Vec3Array;
        actualUp: Vec3Array;
        actualCenter: Vec3Array;
        normal: Vec3Array;
        scale: number;
        geoCenter: Vec3Array;

        viewMatrix: Float32Array;
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
            this.center = new Float32Array([, 0, 100]);
            this.actualPosition = new Float32Array([0, 0, 0]);
            this.actualUp = new Float32Array([0, 1, 0]);
            this.actualCenter = new Float32Array([, 0, 100]);

            this.viewMatrix = new Float32Array(16);
            this.projectionMatrix = new Float32Array(16);
            this.rotateMatrix = new Float32Array(16);
            this.frontVector = new Float32Array(3);
            this.tmp = new Float32Array(3);
            this.tmp2 = new Float32Array(3);

            this.screenX = 0;
            this.screenY = 0;
            this.scale = 100;
            this.speed = 0.05;
            this.aspect = 0;
            this.sceneChanged = false; 
            this.farplane = 1000000;

                    
            this.positionMomentum = 0;
            this.centerMomentum = 0;
            this.rotMomentum = 0;
            this.scaleMomentum = 0;
        }

        get view() {
            glMatrix.mat4.lookAt(this.viewMatrix, this.actualPosition, this.actualCenter, this.actualUp);
            return this.viewMatrix;
        }

        get projection() {
                return glMatrix.mat4.perspective(this.projectionMatrix, glMatrix.glMatrix.toRadian(45), this.aspect, 0.1, this.farplane);
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

        viewTop(){
            this.position = Object.assign({}, this.center);
            this.position[2] += this.farplane / 2;
            this.up = new Float32Array([0, 1, 0]);
        }

        viewFront(){
            this.position = Object.assign({}, this.center);
            this.position[1] -= this.farplane / 2;
            this.up = new Float32Array([0, 0, 1]);
        }

        viewSide(){
            this.position = Object.assign({}, this.center);
            this.position[0] -= this.farplane / 2;
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
    
            let axes_x = glMatrix.vec3.cross(this.tmp, this.up, this.front);
            let axes_y = this.up;
    
            glMatrix.mat4.fromRotation(this.rotateMatrix, a_x, axes_y);
            glMatrix.mat4.rotate(this.rotateMatrix, this.rotateMatrix, a_y, axes_x);
            glMatrix.vec3.transformMat4(front, front, this.rotateMatrix);
            
            glMatrix.vec3.add(this.position, this.center, glMatrix.vec3.negate(front, front))
            glMatrix.vec3.transformMat4(this.up, this.up, this.rotateMatrix);
        }

        move(direction: number = 1, scale: number = 1) {
            glMatrix.vec3.sub(this.tmp, this.position, this.center);
            glMatrix.vec3.scale(this.tmp, this.tmp, 1 + direction * (MOVE_STEP * scale));
            glMatrix.vec3.add(this.tmp, this.center, this.tmp);
            glMatrix.vec3.copy(this.position, this.tmp);
        }

        frame(){
            glMatrix.vec3.sub(this.tmp, this.position, this.actualPosition);
            this.positionMomentum = Math.min(glMatrix.vec3.length(this.tmp), this.speed * 2.0);
            if (this.positionMomentum > 0.02){
                glMatrix.vec3.scaleAndAdd(this.actualPosition, this.actualPosition, this.tmp, this.positionMomentum);
            } else {
                glMatrix.vec3.copy(this.actualPosition, this.position);
                this.positionMomentum = 0;
            }
            
            this.rotMomentum = Math.min(glMatrix.vec3.angle(this.actualUp, this.up), this.speed * 3.14);
            if (this.rotMomentum > 0.02) {
                let axis = glMatrix.vec3.cross(this.tmp, this.actualUp, this.up);
                glMatrix.mat4.fromRotation(this.rotateMatrix, this.rotMomentum, axis);
                glMatrix.vec3.transformMat4(this.actualUp, this.actualUp, this.rotateMatrix);   
            } else {
                glMatrix.vec3.copy(this.actualUp, this.up);
                this.rotMomentum = 0;
            }
    
            glMatrix.vec3.sub(this.tmp, this.center, this.actualCenter);
            this.centerMomentum = Math.min(glMatrix.vec3.length(this.tmp), this.speed * 2.0);
            if (this.centerMomentum > 0.02){
                glMatrix.vec3.scaleAndAdd(this.actualCenter, this.actualCenter, this.tmp, this.centerMomentum);
            } else {
                glMatrix.vec3.copy(this.actualCenter, this.center);
                this.centerMomentum = 0;
            }
    
            //tmp is now direction of view
            glMatrix.vec3.sub(this.tmp, this.geoCenter, this.actualPosition); 
            //adding dist from position to geometry center and radius of geomtry from the geom center
            //TODO autoset farplane to be optimal
            //this.farplane = vec3.len(this.tmp) + this.geometryRadius;
        }
    }
}