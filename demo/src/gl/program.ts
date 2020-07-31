

module GLProgram {
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


    interface Attribute {
        [name: string] : string;
    };

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

    export interface UniformBinder {
        [name: string] : Float32Array | Int32Array | number
    }

    //--------------------------------------------------------------
    // Shader Classes
    //--------------------------------------------------------------

    class Shader extends GLBase.GLObject {
        type: ShaderType;
        code: string;
        shader: WebGLShader;
        
        constructor(gl: WebGL2RenderingContext, code: string, type: ShaderType){
            super(gl);
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

    class Program extends GLBase.GLObject {
        
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
                assignFunction: GLAssignType
            }
        }

        attributes: {
            [name: string]: number
        }; 

        loaded: boolean;

        vs: Shader;
        fs: Shader;
        program: WebGLProgram; 

        static get DIR()
        {
            return "/src/gl/glsl/";
        }

        constructor(gl: WebGL2RenderingContext) {
            super(gl);

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

            this.uniforms = {};
            this.attributes = {};

            this.loaded = false;
        }

        init(vs: string, fs: string) {
            this.vs = new Shader(this.gl, vs, ShaderType.vertex);
            this.fs = new Shader(this.gl, fs, ShaderType.fragment);

            this.createProgram();
            this.update('init');
        }

        createProgram() {
            let program = this.gl.createProgram();

            this.gl.attachShader(program, this.vs.shader);
            this.gl.attachShader(program, this.fs.shader);

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
        
        setupAttributes(attr: Attribute) {
            this.attributes = {};

            for(let key in attr){
                this.attributes[key] = this.gl.getAttribLocation(this.program, attr[key]);
            }

            this.update('attrs');
        }

        setupUniforms(unif: Uniform) {

            for(let key in unif){
                this.uniforms[key] = {
                    location: this.gl.getUniformLocation(this.program, unif[key].name),
                    assignFunction: unif[key].type,
                } 
            }  
                
            this.update('unifs');
        }

        bindAttribute(set: AttributeBinder){

            this.gl.enableVertexAttribArray(set.attribute);
            this.gl.vertexAttribPointer(set.attribute, set.size, this.gl.FLOAT, false, set.stride, set.offset);
            if ('divisor' in set){
                this.gl.vertexAttribDivisor(set.attribute, set.divisor);
            }
        }

        bindInt32Attribute(set: AttributeBinder){

            this.gl.enableVertexAttribArray(set.attribute);
            this.gl.vertexAttribPointer(set.attribute, set.size, this.gl.UNSIGNED_BYTE, true, set.stride, set.offset);
            if ('divisor' in set){
                this.gl.vertexAttribDivisor(set.attribute, set.divisor);
            }
        }


        bindUniforms(options: UniformBinder) {
            for(let key in this.uniforms){
                if (this.uniforms[key].assignFunction === this.GLType.mat4){
                    this.uniforms[key].assignFunction.apply(this.gl, [this.uniforms[key].location, false, options[key]]);
                } else {
                    this.uniforms[key].assignFunction.apply(this.gl, [this.uniforms[key].location, options[key]]);
                }
            }
        }

        commonUniforms() {
            this.setupUniforms({
                world: {
                    name: 'mWorld',
                    type: this.GLType.mat4,
                },
                view: {
                    name: 'mView',
                    type: this.GLType.mat4,   
                },
                proj: {
                    name: 'mProj',
                    type: this.GLType.mat4,
                },
            });
        }

        bind() {
            this.gl.useProgram(this.program);
        }

        unbind() {
            this.gl.useProgram(null);
        }

        update(key: 'init' | 'attrs' | 'unifs'){
            this.state[key] = true;
            if (this.state.init && this.state.attrs && this.state.unifs)
                this.loaded = true;
        }

    }

    export class PickProgram extends Program {
        constructor(gl: WebGL2RenderingContext){
            super(gl);
        
            DataManager.files({
                files: [
                    Program.DIR + "pick-vs.glsl",
                    Program.DIR + "pick-fs.glsl",
                ],
                success: (files) => {
                    this.init(files[0], files[1]);
                    this.setup();
                },
                fail: () => {
                    throw "Pick shader not loaded";
                }
            });
        }

        setup() {
            this.setupAttributes({
                vertex: 'vertex',
                object: 'object'
            });
    
            this.commonUniforms();
            this.setupUniforms({
                /*size: {
                    name: 'size',
                    type: this.GLType.float,
                }*/
            });
        }

        bindAttrVertex() {
            this.gl.useProgram(this.program);
            this.bindAttribute({
                attribute: this.attributes.vertex,
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
    }

    export class BuildingProgram extends Program {
        constructor(gl: WebGL2RenderingContext){
            super(gl);
        
            DataManager.files({
                files: [
                    Program.DIR + "building-vs.glsl",
                    Program.DIR + "building-fs.glsl",
                ],
                success: (files) => {
                    this.init(files[0], files[1]);
                    this.setup();
                },
                fail: () => {
                    throw "Building shader not loaded";
                }
            });
        }

        setup() {
            this.setupAttributes({
                vertex: 'vertex',
                normal: 'normal',
                object: 'object'
            });
    
            this.commonUniforms();
            this.setupUniforms({
                selected: {
                    name: 'selected',
                    type: this.GLType.vec4,
                }
            });
        }

        bindAttrVertex() {
            this.gl.useProgram(this.program);
            this.bindAttribute({
                attribute: this.attributes.vertex,
                size: 3,
                stride: 3 * Float32Array.BYTES_PER_ELEMENT,
                offset: 0,
            });
            this.gl.useProgram(null);
        }

        bindAttrNormal() {
            this.gl.useProgram(this.program);
            this.bindAttribute({
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
    }

    export class TerrainProgram extends Program {
        constructor(gl: WebGL2RenderingContext){
            super(gl);
        
            DataManager.files({
                files: [
                    Program.DIR + "terrain-vs.glsl",
                    Program.DIR + "terrain-fs.glsl",
                ],
                success: (files) => {
                    this.init(files[0], files[1]);
                    this.setup();
                },
                fail: () => {
                    throw "Terrain shader not loaded";
                }
            });
        }

        setup() {
            this.setupAttributes({
                vertex: 'vertex',
                normal: 'normal',
            });
    
            this.commonUniforms();
            this.setupUniforms({});
        }

        bindAttrVertex() {
            this.gl.useProgram(this.program);
            this.bindAttribute({
                attribute: this.attributes.vertex,
                size: 3,
                stride: 3 * Float32Array.BYTES_PER_ELEMENT,
                offset: 0,
            });
            this.gl.useProgram(null);
        }

        bindAttrNormal() {
            this.gl.useProgram(this.program);
            this.bindAttribute({
                attribute: this.attributes.normal,
                size: 3,
                stride: 3 * Float32Array.BYTES_PER_ELEMENT,
                offset: 0,
            });
            this.gl.useProgram(null);
        }
    }

    export class BoxProgram extends Program {
        constructor(gl: WebGL2RenderingContext){
            super(gl);
        
            DataManager.files({
                files: [
                    Program.DIR + "box-vs.glsl",
                    Program.DIR + "box-fs.glsl",
                ],
                success: (files) => {
                    this.init(files[0], files[1]);
                    this.setup();
                },
                fail: () => {
                    throw "Box shader not loaded";
                }
            });
        }

        setup() {
            this.setupAttributes({
                vertex: 'vertex',
            });
    
            this.commonUniforms();
            this.setupUniforms({});
        }

        bindAttrVertex() {
            this.gl.useProgram(this.program);
            this.bindAttribute({
                attribute: this.attributes.vertex,
                size: 3,
                stride: 3 * Float32Array.BYTES_PER_ELEMENT,
                offset: 0,
            });
            this.gl.useProgram(null);
        }
    }
}