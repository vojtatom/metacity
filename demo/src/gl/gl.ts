

module GL {


    export interface OBJstats {
        min : number[],
        max : number[]
    }
    
    export interface CityModelInterface {
        vertices: Float32Array,
        elements: Int32Array,
        stats: OBJstats
    }

    export class Graphics {
        canvas: HTMLCanvasElement;
        gl: WebGL2RenderingContext;

        programs: {
            triangle: GLProgram.TriangleProgram
        };

        loaded : boolean;
        models: {
            city: Array<GLModels.CityModel>,
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

            this.loaded = false;
            this.models = {
                city: [],
            };
        }

        addCitySegment(model: CityModelInterface)
        {
            this.models.city.push(new GLModels.CityModel(this.gl, this.programs.triangle, model));

            //TODO calc camera positions
            this.loaded = true;
        }

        render() {
            if (!this.loaded)
                return;
        }

    }
}