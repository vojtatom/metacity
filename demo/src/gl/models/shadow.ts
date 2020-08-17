class ShadowModel extends GLModel {
    constructor(gl: WebGL2RenderingContext){
        super(gl);
    }

    uniformDict(scene: Scene){
        let uniforms: UniformBinder = super.uniformDict(scene);
        uniforms['mLVP'] = scene.light.vp;
        uniforms['shadowmap'] = scene.light.depth;
        uniforms['texSize'] = scene.light.texSize;
        uniforms['tolerance'] = scene.light.tolerance;
        uniforms['useShadows'] = scene.shadowsEnabled ? 1 : 0;

        return uniforms;
    }
}