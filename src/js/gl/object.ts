interface ObjectProgramRenderParams extends RenderParams {
    programName: string,
    program: ObjectProgram,
    first: number,
    count: number
};

class ObjectProgram extends ShadowProgram {

    attributes = {
        vertex: AttribLocation,
        normal: AttribLocation,
        object: AttribLocation
    };

    uniforms = {
        mM: {
            location: UniformLocation,
            type: this.GLType.mat4
        },
        mVP: {
            location: UniformLocation,
            type: this.GLType.mat4
        },
        selected: {
            location: UniformLocation,
            type: this.GLType.vec4,
        },

        //Shadows
        /*mLVP: {
            location: UniformLocation,
            type: this.GLType.mat4
        },
        shadowmap: {
            location: UniformLocation,
            type: this.GLType.int
        },
        texSize: {
            location: UniformLocation,
            type: this.GLType.float
        },
        tolerance: {
            location: UniformLocation,
            type: this.GLType.float
        },*/
        useShadows: {
            location: UniformLocation,
            type: this.GLType.float
        }
    };


    constructor(gl: WebGL2RenderingContext){
        super(gl);
    
        const vs = `#version 300 es
        precision highp float;
        precision highp int;
        
        in vec3 vertex;
        /*in vec4 object;*/
        in vec3 normal;
        
        //matrices
        uniform mat4 mM;
        uniform mat4 mVP;
        /*uniform mat4 mLVP;
        
        uniform vec4 selected;*/
        out vec3 fragcolor;
        /*out vec4 lpos;*/
        
        /**
         * Phong
         */
        vec3 phong(vec3 light, vec3 ver_position, vec3 ver_normal){
            vec3 ret = vec3(0.0);
            
            vec3 L = normalize(-light);
            float NdotL = clamp(dot(normalize(ver_normal), L), 0.0, 1.0);
           
               //ambient
            ret += vec3(0.1);
            
            //diffuse
            ret += vec3(1.0) * NdotL;
            
            return log(vec3(1.0) + ret);
        }
        
        /*vec3 vec3fMod(vec3 a, vec3 b) {
            vec3 higher = vec3(greaterThan(a, b));
            vec3 mult = floor(a / b);
            return a * (1.0f - higher) + (a - b * mult) * higher;
        }*/
        
        void main() {
            //vec3 objColor = object.x * vec3(0.5) + vec3(0.6);
            vec3 objColor = vec3(1.0);
        
        
            /*int marked = 1;
            for(int i = 0; i < 4; ++i)
                marked *= int(floor(selected[i] * 255.0 + 0.5) == floor(object[i] * 255.0 + 0.5));
        
            if (bool(marked))
                objColor = vec3(2.0, 1.5, 1.0);*/   
        
        
            fragcolor = phong(vec3(1, 0.5, 1), vertex, normal) * objColor;
            vec3 shifted = (mM * vec4(vertex, 1.0)).xyz;
            /*lpos = mLVP * vec4(shifted, 1.0);*/
            gl_Position =  mVP * vec4(shifted, 1.0);
        }
        `;

        const fs = `#version 300 es
        precision highp float;
        precision highp int;
        
        in vec3 fragcolor;
        /*in vec4 lpos;*/
        out vec4 color;
        
        
        //shadows
        /*uniform sampler2D shadowmap;
        uniform float texSize;
        uniform float tolerance;
        uniform float useShadows;*/
        
        
        /*float interpolate(vec2 texcoord, float depth) {
          ivec2 low = ivec2(floor(texcoord));
          ivec2 high = ivec2(ceil(texcoord));
          ivec2 lh = ivec2(low.x, high.y);
          ivec2 hl = ivec2(high.x, low.y);
          vec2 factor = texcoord - vec2(low);
        
          float t_low =  float(texelFetch(shadowmap, low, 0)); 
          float t_high = float(texelFetch(shadowmap, high, 0)); 
          float t_lh =   float(texelFetch(shadowmap, lh, 0)); 
          float t_hl =   float(texelFetch(shadowmap, hl, 0)); 
        
          float vis_low =  1.f - float(depth > t_low + tolerance);
          float vis_high = 1.f - float(depth > t_high + tolerance);
          float vis_lh =   1.f - float(depth > t_lh + tolerance);
          float vis_hl =   1.f - float(depth > t_hl + tolerance);
        
          return (vis_low + vis_high + vis_hl + vis_lh) / 4.0;
        }*/
        
        
        /*float shadow(void)
        {
          vec3 vertex_relative_to_light = lpos.xyz / lpos.w;
          vertex_relative_to_light = vertex_relative_to_light * 0.5 + 0.5;
          
          float shadowing = interpolate(vertex_relative_to_light.xy * texSize, vertex_relative_to_light.z);
          return shadowing * 0.3 + 0.7;
        }*/
        
        
        void main()
        {
          vec3 outcolor = fragcolor;
          
          /*if (bool(useShadows))
            outcolor *= shadow();*/
        
          color = vec4(outcolor + vec3(0.2), 1.0);
        }
        `;

        this.init(vs, fs);
        this.setup();
    }

    bindAttrVertex() {
        this.gl.useProgram(this.program);
        this.bindFloat32Attribute({
            attribute: this.attributes.vertex,
            size: 3,
            stride: 3 * Float32Array.BYTES_PER_ELEMENT,
            offset: 0,
        });
        this.gl.useProgram(null);
    }

    bindAttrNormal() {
        this.gl.useProgram(this.program);
        this.bindFloat32Attribute({
            attribute: this.attributes.normal,
            size: 3,
            stride: 3 * Float32Array.BYTES_PER_ELEMENT,
            offset: 0,
        });
        this.gl.useProgram(null);
    }

    bindAttrObject() {
        this.gl.useProgram(this.program);
        this.bindInt32Attribute({
            attribute: this.attributes.object,
            size: 4, // has to be 4
            stride: 1 * Uint32Array.BYTES_PER_ELEMENT,
            offset: 0,
        });
        this.gl.useProgram(null);
    }

    renderParams(firstTriangleIndex: number, countTriangles: number) {
        return {
            programName: "objects",
            program: this,
            first: firstTriangleIndex,
            count: countTriangles
        };
    }

    render(scene: Scene) {
        this.gl.useProgram(this.program);
        this.bindUniforms({
            mM: scene.camera.world,
            mVP: scene.camera.vp,
            selected: new Float32Array([0, 0, 0, 0]),
            useShadows: 0
        });

        for(let obj of this.primitives){
            obj.bindVao();
            let params = obj.programParams("objects") as ObjectProgramRenderParams;
            this.gl.drawArrays(this.gl.TRIANGLES, params.first, params.count);
            obj.unbindVao();
        }
    }

}