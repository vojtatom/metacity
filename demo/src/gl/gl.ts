

module GL {
    export interface CityModelInterface {
        vertices: Float32Array,
        elements: Int32Array
    }

    export class Graphics {
        canvas: HTMLCanvasElement;
        gl: WebGL2RenderingContext;

        programs: {
            triangle: GLProgram.TriangleProgram
        };

        constructor(canvas: HTMLCanvasElement){
            this.canvas = canvas;

            console.log('Getting webgl 2 context');
            this.gl = this.canvas.getContext('webgl2');
            
            if (!this.gl) {
                console.error('WebGL 2 not supported, please use a different browser.');
                throw 'WebGL 2 not supported, please use a different browser.';
            }

            let ext = this.gl.getExtension('OES_element_index_uint');

            //init GPU programs
            this.programs = {
                triangle: new GLProgram.TriangleProgram(this.gl)
            };
        }

        addCitySegment(model: CityModelInterface)
        {
            
        }

    }
}