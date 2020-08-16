

class Graphics {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;

    programs: GLProgramList;

    loaded : boolean;
    models: {
        city: Array<BuildingModel>,
        terrain: Array<TerrainModel>,
        box: Array<CubeModel>,
        streets: Array<StreetModel>,
        paths: Array<PathModel>
    };

    textures: { [name: string]: Texture };

    scene: Scene;

    shadowsReady: boolean;

    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;

        console.log('Getting webgl 2 context');
        this.gl = this.canvas.getContext('webgl2');
        
        if (!this.gl) {
            console.error('WebGL 2 not supported, please use a different browser.');
            throw 'WebGL 2 not supported, please use a different browser.';
        }

        /*let ext = this.gl.getExtension('OES_element_index_uint');
        if (!ext)
            throw 'UINT element unavailable';*/
        
        let ext = this.gl.getExtension('OES_texture_float_linear');
        if (!ext)
            throw 'Linear filter unavailable';

        ext = this.gl.getExtension('EXT_color_buffer_float');
        if (!ext)
            throw 'Color float texture unavailable';

        //init GPU programs
        this.programs = {
            building: new BuildingProgram(this.gl),
            terrain: new TerrainProgram(this.gl),
            box: new BoxProgram(this.gl),
            pick: new PickProgram(this.gl),
            pickLine: new PickLineProgram(this.gl),
            street: new StreetProgram(this.gl),
            path: new PathProgram(this.gl),
            triangle: new TriangleProgram(this.gl)
        };

        this.loaded = false;
        this.models = {
            city: [],
            terrain: [],
            box: [],
            streets: [],
            paths: []
        };

        this.textures = {};

        this.scene = new Scene(this.gl, this.textures);
        this.shadowsReady = false;
    }

    addCitySegment(model: BuildingsModelInterface) {
        let glmodel = new BuildingModel(this.gl, this.programs, model)
        this.models.city.push(glmodel);
        let box = new CubeModel(this.gl, this.programs, model.stats);
        this.models.box.push(box);
        
        //this.scene.addModel(model.stats);
        this.loaded = true;

        return {
            cityModel: glmodel,
            boxModel: box
        };
    }

    addTerainSegment(model: TerrainModelInterface) {
        let glmodel = new TerrainModel(this.gl, this.programs, model);
        this.models.terrain.push(glmodel);
        let box = new CubeModel(this.gl, this.programs, model.stats);
        this.models.box.push(box);
        this.loaded = true;

        return {
            terrainModel: glmodel,
            box: box
        };
    }

    addStreetSegment(model: StreetModelInterface) {
        let glmodel = new StreetModel(this.gl, this.programs, model);
        this.models.streets.push(glmodel);

        return {
            streetModel: glmodel
        };
    }

    addPath(model: PathModelInterface) {
        let glmodel = new PathModel(this.gl, this.programs, model);
        this.models.paths.push(glmodel);

        return {
            pathModel: glmodel
        };
    }

    addFloat32Texture(title: string, data: TextureInterface) {
        this.textures[title] = new Texture(this.gl, data.data, data.width, data.height);
    }

    render() {
        if (!this.loaded)
            return;

        if (!this.shadowsReady) {
            this.scene.light.createShadowmap(this);
            this.shadowsReady = true;
        }
            
        this.gl.depthMask(true);      
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);  
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.BLEND); 
        
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
        
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
        this.gl.depthMask(false);      
        
        //render streets
        this.programs.street.bind();
        for(let s of this.models.streets){
            s.render(this.scene);
        }
        this.programs.street.unbind();
        
        
        //render paths
        this.programs.path.bind();
        for(let p of this.models.paths){
            p.render(this.scene);
        }
        this.programs.path.unbind();

        //render boxes
        this.programs.box.bind();
        for(let b of this.models.box){
            b.render(this.scene);
        }
        this.programs.box.unbind();

        this.scene.frame();
    }

    renderShadow() {
        if (!this.loaded)
            throw 'Shadow map is not initalized';

        this.gl.depthMask(true);      
        this.gl.clearColor(Infinity, Infinity, Infinity, Infinity);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);  
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.BLEND); 
        
        //render shadow casters
        this.programs.triangle.bind();
        for(let c of this.models.city){
            c.renderShadow(this.scene);
        }
        for(let t of this.models.terrain){
            t.renderShadow(this.scene);
        }
        this.programs.triangle.unbind();         
    }
    
    renderPick(x: number, y: number, height: number) {
        if (!this.loaded)
        return;
        
        this.gl.depthMask(true); 
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);  
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.BLEND); 
        
        //render buildings
        this.programs.pick.bind();
        for(let c of this.models.city){
            c.renderPicking(this.scene);
        }
        this.programs.pick.unbind();

        //render streets
        this.programs.pickLine.bind();
        for(let s of this.models.streets){
            s.renderPicking(this.scene);
        }
        this.programs.pickLine.unbind();


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