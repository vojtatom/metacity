

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

    export class Scene extends GLBase.GLObject {
        stats: OBJstats;
        camera: GLCamera.Camera;
        center: Vec3Array;

        constructor(gl: WebGL2RenderingContext) {
            super(gl);

            this.camera = new GLCamera.Camera(this.gl);
            this.center = new Float32Array([0, 0, 0]);

            this.stats = {
                min: [Infinity, Infinity, Infinity],
                max: [-Infinity, -Infinity, -Infinity],
            };
        }

        addModel(stats: OBJstats) {
            this.stats.min[0] = Math.min(this.stats.min[0], stats.min[0]);
            this.stats.min[1] = Math.min(this.stats.min[1], stats.min[1]);
            this.stats.min[2] = Math.min(this.stats.min[2], stats.min[2]);
            this.stats.max[0] = Math.max(this.stats.max[0], stats.max[0]);
            this.stats.max[1] = Math.max(this.stats.max[1], stats.max[1]);
            this.stats.max[2] = Math.max(this.stats.max[2], stats.max[2]);

            let farplane = 0;
            for(let i = 0; i < 3; ++i){
                this.center[i] = (this.stats.min[i] + this.stats.max[i]) / 2;
                farplane = Math.max(farplane, this.stats.max[i] - this.stats.min[i]);
            }

            //make a deep copy
            this.camera.farplane = farplane * 3;
            this.camera.center = Object.assign({}, this.center);
            this.camera.geoCenter = Object.assign({}, this.center);
            this.camera.position = Object.assign({}, this.center);
            this.camera.position[2] += farplane / 2;
        }
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


        scene: Scene;

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

            this.scene = new Scene(this.gl);
        }

        addCitySegment(model: CityModelInterface)
        {
            this.models.city.push(new GLModels.CityModel(this.gl, this.programs.triangle, model));

            this.scene.addModel(model.stats);
            //TODO calc camera positions
            this.loaded = true;
        }

        render() {
            if (!this.loaded)
                return;

            this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
            this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);  
            this.gl.enable(this.gl.DEPTH_TEST); // now repeated call unnecesary, needed for later
            //this.gl.enable(this.gl.BLEND);
            //this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);


            this.gl
            this.programs.triangle.bind();

            for(let c of this.models.city){
                c.render(this.scene);
            }

            this.programs.triangle.unbind();

            this.scene.camera.frame();
        }

        resize(x: number, y: number) {
            this.canvas.width = x;
            this.canvas.height = y;
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
            this.scene.camera.resize(x, y);
        }

    }
}