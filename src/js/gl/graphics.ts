
module Parser {
    export function toFloat32(data: string){
		let blob = window.atob(data);
        
        let len = blob.length / Float32Array.BYTES_PER_ELEMENT;
        let view = new DataView(new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT));
        let array = new Float32Array(len);

        for (let p = 0; p < len * 4; p = p + 4) {
            view.setUint8(0, blob.charCodeAt(p));
            view.setUint8(1, blob.charCodeAt(p + 1));
            view.setUint8(2, blob.charCodeAt(p + 2));
            view.setUint8(3, blob.charCodeAt(p + 3));
            array[p / 4] = view.getFloat32(0, true);
        }
        view = null;

        blob = null;
		return array;
    }

    export function toUint32(data: string){
		let blob = window.atob(data);
        
        let len = blob.length / Uint32Array.BYTES_PER_ELEMENT;
        let view = new DataView(new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT));
        let array = new Uint32Array(len);

        for (let p = 0; p < len * 4; p = p + 4) {
            view.setUint8(0, blob.charCodeAt(p));
            view.setUint8(1, blob.charCodeAt(p + 1));
            view.setUint8(2, blob.charCodeAt(p + 2));
            view.setUint8(3, blob.charCodeAt(p + 3));
            array[p / 4] = view.getUint32(0, true);
        }
        view = null;

        blob = null;
		return array;
    }
}


class Scene {
    camera: Camera;

    constructor() {
        this.camera = new Camera();
    }


}

class Graphics {
    sizeReference: HTMLElement;
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;

    programs: {
        triangles: TriangleProgram;
        objects: ObjectProgram;
    };

    entities: {
        triangles: GLObject[],
        objects: GLObject[],
    };
    
    scene: Scene;
    error: boolean;

    interface: IO = new IO();

    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
        this.sizeReference = canvas.parentElement;

        console.log('Getting webgl 2 context');
        this.gl = this.canvas.getContext('webgl2');
        
        if (!this.gl) {
            console.error('WebGL 2 not supported, please use a different browser.');
            throw 'WebGL 2 not supported, please use a different browser.';
        }
        
        let ext = this.gl.getExtension('OES_texture_float_linear');
        if (!ext)
            throw 'Linear filter unavailable';

        ext = this.gl.getExtension('EXT_color_buffer_float');
        if (!ext)
            throw 'Color float texture unavailable';

        //init GPU programs
        this.programs = {
            triangles: new TriangleProgram(this.gl),
            objects: new ObjectProgram(this.gl),
        };

        this.scene = new Scene();
        this.error = false;


        canvas.onmousedown = (event) => {
            this.interface.onMouseDown(event.clientX, event.clientY, event.button);
            event.stopPropagation();
        };
    
        canvas.onmouseup = (event) => {
            this.interface.onMouseUp(event.clientX, event.clientY);
            event.stopPropagation();
        };
    
        canvas.onmousemove = (event) => {
            this.interface.onMouseMove(event.clientX, event.clientY);
            event.stopPropagation();
        };
    
        canvas.onwheel = (event) => {
            this.interface.wheel(event.deltaY);
            event.preventDefault();
            event.stopPropagation();
        };
    }

    renderFrame(userRedraw: boolean = false) {
        if (this.scene.camera.needsRedraw || userRedraw)
        {
            this.gl.depthMask(true);      
            this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
            this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);  
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.disable(this.gl.BLEND); 

            this.programs.objects.render(this.scene);
        }   
        
        this.scene.camera.frame();
    }

    resize() {
        let dims = this.sizeReference.getBoundingClientRect();
        this.canvas.width = dims.width;
        this.canvas.height = dims.height;
        console.log(dims.width, dims.height);
        this.gl.viewport(0, 0, dims.width, dims.height);
        this.scene.camera.resize(dims.width, dims.height);
    }

    checkError() {
        let error = this.gl.getError();

        if (error != 0)
            console.log(error);
    }
}


interface Indexable<T> {
    [ids: number]: T
}


interface BBox {
    min : Indexable<number>,
    max : Indexable<number>
}

class GLObject {
    protected gl: WebGL2RenderingContext; 
    protected vao: WebGLVertexArrayObject;
    protected ebo: WebGLBuffer;
    protected vbo: {[name: string]: WebGLBuffer} = {};
    protected usedPrograms: {[program: string]: RenderParams} = {};

    get programs() {
        return Viewer.instance.graphics.programs;
    }

    constructor() {
        this.gl = Viewer.instance.graphics.gl;
    }

    initVao() {
        let vao = this.gl.createVertexArray();
        this.vao = vao;
    }
    
    bindVao() {
        this.gl.bindVertexArray(this.vao);
    }

    unbindVao() {
        this.gl.bindVertexArray(null);
    }

    initBuffer(name: string) {
        let buffer = this.gl.createBuffer();
        this.vbo[name] = buffer;
    }

    fillBuffer(name: string, data: Float32Array) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo[name]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }

    usesProgram(params: RenderParams) {
        this.usedPrograms[params.programName] = params;
    }

    markForRender() {
        for(let program in this.usedPrograms) {
            this.usedPrograms[program].program.addGLObject(this);
        }
    }

    updateBBox(bbox: BBox) {
        Viewer.instance.graphics.scene.camera.updateScale(bbox);
    }

    programParams(programTitle: string) {
        return this.usedPrograms[programTitle];
    }
}