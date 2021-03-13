class TriangleProgram extends Program {

    attributes = {
        vertex: AttribLocation,
    };

    uniforms = {
        mM: {
            location: UniformLocation,
            type: this.GLType.mat4
        },
        mVP: {
            location: UniformLocation,
            type: this.GLType.mat4
        }
    };


    constructor(gl: WebGL2RenderingContext){
        super(gl);

        const vs = `#version 300 es
        precision highp float;
        precision highp int;

        in vec3 vertex;

        //matrices
        uniform mat4 mM;
        uniform mat4 mVP;

        void main() {
            vec3 shifted = (mM * vec4(vertex, 1.0)).xyz;
            gl_Position = mVP * vec4(shifted, 1.0);
        }
        `;

        const fs = `#version 300 es
        precision highp float;
        precision highp int;

        out vec4 color;

        void main()
        {
            color = vec4(1.0);
        }
        `

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
}