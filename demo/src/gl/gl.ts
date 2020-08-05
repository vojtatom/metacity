

module GL {


    export interface OBJstats {
        min : number[],
        max : number[]
    }
    
    export interface CityModelInterface {
        vertices: Float32Array,
        normals: Float32Array,
        objects: Uint32Array,
        idToObj: { [name: number]: string },
        objToId: { [name: string]: number },
        stats: OBJstats
    }

    export interface TerrainModelInterface {
        vertices: Float32Array,
        normals: Float32Array,
        stats: OBJstats
    }

    export interface StreetModelInterface {
        vertices: Float32Array
    }


    export interface BoxModelInterface {
        min: number[],
        max: number[]
    }

    function intToVec4Normalized(i: number) {
        let n = new Uint32Array([i]);
        let b = new Uint8Array(n.buffer);
        let f = new Float32Array(b);
        f[0] /= 255;
        f[1] /= 255;
        f[2] /= 255;
        f[3] /= 255;
        return f;
    }

    export class Scene extends GLBase.GLObject {
        stats: OBJstats;
        camera: GLCamera.Camera;
        center: Vec3Array;
        selected: number;
        selectedv4: Float32Array;

        constructor(gl: WebGL2RenderingContext) {
            super(gl);

            this.camera = new GLCamera.Camera(this.gl);
            this.center = new Float32Array([0, 0, 0]);

            this.stats = {
                min: [Infinity, Infinity, Infinity],
                max: [-Infinity, -Infinity, -Infinity],
            };

            //this.selected = 4294967295;
            this.selected = 1000;
            this.selectedv4 = intToVec4Normalized(this.selected);
            
        }

        select(id: number) {
            this.selected = id;
            this.selectedv4 = intToVec4Normalized(this.selected);
        }

        addModel(stats: OBJstats) {
            this.stats.min[0] = Math.min(this.stats.min[0], stats.min[0]);
            this.stats.min[1] = Math.min(this.stats.min[1], stats.min[1]);
            this.stats.min[2] = Math.min(this.stats.min[2], stats.min[2]);
            this.stats.max[0] = Math.max(this.stats.max[0], stats.max[0]);
            this.stats.max[1] = Math.max(this.stats.max[1], stats.max[1]);
            this.stats.max[2] = Math.max(this.stats.max[2], stats.max[2]);
            this.camera.updateScale(this.stats);
        }
    }

    export interface GLProgramList {
        building: GLProgram.BuildingProgram,
        terrain: GLProgram.TerrainProgram,
        box: GLProgram.BoxProgram,
        pick: GLProgram.PickProgram,
        street: GLProgram.StreetProgram
    }

    export class Graphics {
        canvas: HTMLCanvasElement;
        gl: WebGL2RenderingContext;

        programs: GLProgramList;

        loaded : boolean;
        models: {
            city: Array<GLModels.CityModel>,
            terrain: Array<GLModels.TerrainModel>,
            box: Array<GLModels.CubeModel>,
            streets: Array<GLModels.StreetModel>
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
                building: new GLProgram.BuildingProgram(this.gl),
                terrain: new GLProgram.TerrainProgram(this.gl),
                box: new GLProgram.BoxProgram(this.gl),
                pick: new GLProgram.PickProgram(this.gl),
                street: new GLProgram.StreetProgram(this.gl)
            };

            this.loaded = false;
            this.models = {
                city: [],
                terrain: [],
                box: [],
                streets: []
            };

            this.scene = new Scene(this.gl);
        }

        addCitySegment(model: CityModelInterface) {
            let glmodel = new GLModels.CityModel(this.gl, this.programs, model)
            this.models.city.push(glmodel);
            let box = new GLModels.CubeModel(this.gl, this.programs, model.stats);
            this.models.box.push(box);
            
            this.scene.addModel(model.stats);
            this.loaded = true;

            return {
                cityModel: glmodel,
                boxModel: box
            };
        }

        addTerainSegment(model: TerrainModelInterface) {
            let glmodel = new GLModels.TerrainModel(this.gl, this.programs, model);
            this.models.terrain.push(glmodel);
            let box = new GLModels.CubeModel(this.gl, this.programs, model.stats);
            this.models.box.push(box);

            this.scene.addModel(model.stats);
            this.loaded = true;

            return {
                terrainModel: glmodel,
                box: box
            };
        }

        addStreetSegment(model: StreetModelInterface) {
            let glmodel = new GLModels.StreetModel(this.gl, this.programs, model);
            this.models.streets.push(glmodel);

            return {
                streetModel: glmodel
            };
        }

        render() {
            if (!this.loaded)
                return;

            this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
            this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);  
            this.gl.enable(this.gl.DEPTH_TEST); // now repeated call unnecesary, needed for later
            //this.gl.enable(this.gl.BLEND);
            //this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);


            //render buildings
            this.programs.building.bind();
            for(let c of this.models.city){
                c.render(this.scene);
            }
            this.programs.building.unbind();

            //render terrain
            this.programs.terrain.bind();
            for(let t of this.models.terrain){
                t.render(this.scene);
            }
            this.programs.terrain.unbind();

            //render streets
            this.programs.street.bind();
            for(let s of this.models.streets){
                s.render(this.scene);
            }
            this.programs.street.unbind();

            //render boxes
            this.programs.box.bind();
            for(let b of this.models.box){
                b.render(this.scene);
            }
            this.programs.box.unbind();


            this.scene.camera.frame();
        }
        
        renderPick(x: number, y: number, height: number) {
            if (!this.loaded)
            return;
            
            this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
            this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);  
            this.gl.enable(this.gl.DEPTH_TEST);
            
            //render buildings
            this.programs.pick.bind();
            for(let c of this.models.city){
                c.renderPicking(this.scene);
            }
            for(let b of this.models.box){
                b.renderPicking(this.scene);
            }
            this.programs.pick.unbind();
            this.scene.camera.frame();

            y = height - y;
            let pixels = new Uint8Array(4); // A single RGBA value
            this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

            let ID = new DataView(pixels.buffer).getUint32(0, true);
            return ID;
        }

        saveCanvas(filename: string){
    
            this.canvas.toBlob((blob) => {
                // Function to download data to a file
                let file = blob;
                if (window.navigator.msSaveOrOpenBlob) // IE10+
                    window.navigator.msSaveOrOpenBlob(file, filename);
                else { // Others
                    console.log(file);
                    let a = document.createElement("a"),
                            url = URL.createObjectURL(file);
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);  
                    }, 0); 
                }
            });
        }

        resize(x: number, y: number) {
            this.canvas.width = x;
            this.canvas.height = y;
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
            this.scene.camera.resize(x, y);
        }

    }
}