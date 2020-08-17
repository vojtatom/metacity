class ShadowProgram extends Program {
    
    constructor(gl: WebGL2RenderingContext){
        super(gl);
    }

    commonUniforms() {
        super.commonUniforms();
        this.setupUniforms({
            mLVP: {
                name: 'mLVP',
                type: this.GLType.mat4
            },
            shadowmap: {
                name: 'shadowmap',
                type: this.GLType.int
            },
            texSize: {
                name: 'texSize',
                type: this.GLType.float
            },
            tolerance: {
                name: 'tolerance',
                type: this.GLType.float
            },
            useShadows: {
                name: 'useShadows',
                type: this.GLType.float
            }
        });
    }
}