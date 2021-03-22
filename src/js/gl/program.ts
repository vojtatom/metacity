//--------------------------------------------------------------
// Interfaces
//--------------------------------------------------------------

enum ShaderType {
    vertex,
    fragment,
}

type GLAssignType = WebGL2RenderingContext["uniform1f"] | 
            WebGL2RenderingContext["uniform1i"] | 
            WebGL2RenderingContext["uniform2fv"] |
            WebGL2RenderingContext["uniform3fv"] |
            WebGL2RenderingContext["uniform4fv"] |
            WebGL2RenderingContext["uniformMatrix4fv"];

interface Uniform {
    [name: string] : { 
        name: string,
        type: GLAssignType
    };
};

interface AttributeBinder {
    attribute: number,
    size: number,
    stride: number,
    offset: number,
    divisor?: number,
}

const AttribLocation: number = 0;
const UniformLocation: WebGLUniformLocation = 0;

interface UniformBinder {
    [name: string] : Float32Array | Int32Array | number | WebGLTexture
}


//--------------------------------------------------------------
// Shader Classes
//--------------------------------------------------------------

class Shader {
    gl: WebGL2RenderingContext;

    type: ShaderType;
    code: string;
    shader: WebGLShader;
    
    constructor(gl: WebGL2RenderingContext, code: string, type: ShaderType){
        this.gl = gl;
        this.type = type;
        this.code = code;
        this.createShader();

    }

    createShader() {
        let type;

        if (this.type == ShaderType.vertex)
            type = this.gl.VERTEX_SHADER;
        else 
            type = this.gl.FRAGMENT_SHADER;

        this.shader = this.gl.createShader(type);
        this.gl.shaderSource(this.shader, this.code);
        this.gl.compileShader(this.shader);

        if (!this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS)) {
            console.error('ERROR compiling shader!', this.gl.getShaderInfoLog(this.shader));
            console.error(this.code);
            throw 'ERROR compiling shader!';
        }
    }
}

interface RenderParams {
    programName: string,
    program: Program,
    [name: string]: any
};

class Program {
    
    gl: WebGL2RenderingContext;
    
    state: {
        init: boolean,
        attrs: boolean,
        unifs: boolean
    };

    GLType: {
        float: WebGL2RenderingContext["uniform1f"],
        int:   WebGL2RenderingContext["uniform1i"],
        
        vec2:  WebGL2RenderingContext["uniform2fv"],
        vec3:  WebGL2RenderingContext["uniform3fv"], 
        vec4:  WebGL2RenderingContext["uniform4fv"],
        mat4:  WebGL2RenderingContext["uniformMatrix4fv"],
    }; 
    
    uniforms: {
        [name: string] : {
            location: WebGLUniformLocation,
            type: GLAssignType
        }
    } = {};

    attributes: {
        [name: string]: number
    } = {}; 

    program: WebGLProgram; 

    primitives: GLObject[] = [];

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        this.state = {
            init: false,
            attrs: false,
            unifs: false,
        }

        this.GLType = {
            float: this.gl.uniform1f,
            int: this.gl.uniform1i,
            
            vec2: this.gl.uniform2fv,
            vec3: this.gl.uniform3fv, 
            vec4: this.gl.uniform4fv,
            
            mat4: this.gl.uniformMatrix4fv,
        }
    }


    protected setup() {
        this.setupAttributes();
        this.setupUniforms();
    }

    protected init(vs: string, fs: string) {
        let vss = new Shader(this.gl, vs, ShaderType.vertex);
        let fss = new Shader(this.gl, fs, ShaderType.fragment);

        let program = this.gl.createProgram();
        
        this.gl.attachShader(program, vss.shader);
        this.gl.attachShader(program, fss.shader);
        
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('ERROR linking program!', this.gl.getProgramInfoLog(program));
        }
        
        this.gl.validateProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.VALIDATE_STATUS)) {
            console.error('ERROR validating program!', this.gl.getProgramInfoLog(program));
        }
        
        this.program = program;
    }
    
    protected setupAttributes() {
        for(let key in this.attributes){
            this.attributes[key] = this.gl.getAttribLocation(this.program, key);
        }
    }

    protected setupUniforms() {

        for(let key in this.uniforms){
            this.uniforms[key].location = this.gl.getUniformLocation(this.program, key);
        }  
    }

    protected bindFloat32Attribute(set: AttributeBinder){

        this.gl.enableVertexAttribArray(set.attribute);
        this.gl.vertexAttribPointer(set.attribute, set.size, this.gl.FLOAT, false, set.stride, set.offset);
        if ('divisor' in set){
            this.gl.vertexAttribDivisor(set.attribute, set.divisor);
        }
    }

    protected bindInt32Attribute(set: AttributeBinder){

        this.gl.enableVertexAttribArray(set.attribute);
        this.gl.vertexAttribPointer(set.attribute, set.size, this.gl.UNSIGNED_BYTE, true, set.stride, set.offset);
        if ('divisor' in set){
            this.gl.vertexAttribDivisor(set.attribute, set.divisor);
        }
    }


    protected bindUniforms(options: UniformBinder) {
        for(let key in this.uniforms){
            if (this.uniforms[key].type === this.GLType.mat4){
                this.uniforms[key].type.apply(this.gl, [this.uniforms[key].location, false, options[key]]);
            } else {
                this.uniforms[key].type.apply(this.gl, [this.uniforms[key].location, options[key]]);
            }
        }
    }

    bind() {
        this.gl.useProgram(this.program);
    }

    unbind() {
        this.gl.useProgram(null);
    }

    addGLObject(obj: GLObject) {
        this.primitives.push(obj);
    }

    deleteGLObject(obj: GLObject) {
        let i = 0;
        for(let i = 0; i < this.primitives.length; ++i) {
            if (this.primitives[i].id == obj.id) {
                this.primitives.splice(i, 1);
            }
        }
    }

    render(scene: Scene) {
        throw "Throwing form base class, custom render not implemented.";
    }
}