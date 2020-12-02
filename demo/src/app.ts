enum AppState {
    loading,
    loaded,
    parsing,
    ready
}

class Application {

    gl: Graphics;
    layers: LayerManager;

    interface: IO;

    pickPoint: {
        pick: boolean,
        x: number,
        y: number
    };

    data: any;
    state: AppState;

    constructor()
    {
        let windows = new UI.Window("3D view", [     
            new UI.Canvas(),
            ]);

        let main = document.getElementById("main");
        main.appendChild(windows.render());

        //take the first canvas you find
        let canvas = document.getElementsByTagName("canvas")[0];

        try {
            this.gl = new Graphics(canvas);
        } catch (error) {
            UI.glError();
            throw error;
        }
        
        
        this.interface = new IO(this);
        
        this.layers = new LayerManager(this.gl, windows);
        

        this.pickPoint = {
            pick: false,
            x: 0,
            y: 0
        };

        //------------------------------------------------
        // FOR DEMO PURPOUSES ONLY
        //------------------------------------------------
        this.state = AppState.loading;
        DataManager.files({
            files: ["./assets/bubny/bubny.json"],
            success: (files) => {
                this.data = files;
                this.state = AppState.loaded;
            },
            fail: () => { console.error("error loading assets"); }
        });


        //------------------------------------------------
    }

    load() {
        let data = JSON.parse(this.data);
        this.state = AppState.parsing;
        let that = this;
        let streets: Streets;

        UI.resetLoader();
        UI.loading("Loading terrain", 0.1);
        new Promise(function(resolve, reject) {
        
            //terrain loading
            let terrain = new Terrain(that.gl, data.terrain);
            that.layers.addLayer(terrain);

            UI.loading("Loading buildings", 0.3);
            
            setTimeout(() => resolve(1), 1000);
        
        }).then(function(){
            return new Promise((resolve, reject) => {
             
                //buildings loading
                let bridges = new Buildings(that.gl, data.bridges, data.bridges_meta, "bridges");
                that.layers.addLayer(bridges);
                
                let buildings = new Buildings(that.gl, data.buildings, data.buildings_meta, "buildings");
                that.layers.addLayer(buildings);
                
                UI.loading("Loading height map", 0.5);
                
                setTimeout(() => resolve(1), 1000);
            }
            ).then(function(){
                return new Promise((resolve, reject) => {
                   
                    //load texture
                    that.gl.addFloat32Texture("height", data.height as TextureInterface);
                    UI.loading("Loading streets", 0.7);
                    
                    setTimeout(() => resolve(1), 1000);
                    
                }).then(function(){
                    return new Promise((resolve, reject) => {
                        
                        //street loading
                        streets = new Streets(that.gl, data.streets, "streets");
                        that.layers.addLayer(streets);
                        
                        setTimeout(() => resolve(1), 1000);
                        
                    }).then(function(){
                        return new Promise((resolve, reject) => {
                            UI.loading("Loading street graph", 0.9);
                            
                            //street graph loading
                            Path.cropGraph(data.graph.data, that.gl.scene.stats.min, that.gl.scene.stats.max);
                            streets.addStreetGraph(data.graph);
                            
                            
                            UI.setupSettings(that);
                            UI.resetLoader();
                            that.state = AppState.ready;
                            that.data = null; // delete
                            
                            setTimeout(() => resolve(1), 1000);
                        });
                    });
                });
            });
        });
    }

    /*load() {  
        let data = JSON.parse(this.data);
        this.state = AppState.parsing;

        //terrain loading
        let terrain = new Terrain(this.gl, data.terrain);
        this.layers.addLayer(terrain);

        //buildings loading
        let bridges = new Buildings(this.gl, data.bridges, data.bridges_meta, "bridges");
        this.layers.addLayer(bridges);

        let buildings = new Buildings(this.gl, data.buildings, data.buildings_meta, "buildings");
        this.layers.addLayer(buildings);

        //load texture
        this.gl.addFloat32Texture("height", data.height as TextureInterface);

        //street loading
        let streets = new Streets(this.gl, data.streets, "streets");
        this.layers.addLayer(streets);
        
        //street graph loading
        Path.cropGraph(data.graph.data, this.gl.scene.stats.min, this.gl.scene.stats.max);
        streets.addStreetGraph(data.graph);


        UI.setupSettings(this);
        this.state = AppState.ready;
        this.data = null; // ensure delete
        data = null;
    }*/

    pressed(key: number) {

        if (key == 103 || key == 69){ // numpad 7
            this.gl.scene.camera.viewTop();
        } else if (key == 97 || key == 82) { // numpad 1
            this.gl.scene.camera.viewFront();
        } else if (key == 99 || key == 84) { // numpad 3
            this.gl.scene.camera.viewSide();
        } else if (key == 105 || key == 87) { // numpad 9
            this.gl.scene.camera.restoreCenter();
        } 
    }

    pick(x: number, y: number) {
        this.pickPoint.x = x;
        this.pickPoint.y = y;
        this.pickPoint.pick = true;
    }

    render() {
        if (this.state == AppState.loaded)
        {
            try {
                this.load();
            } catch(error) {
                this.gl.error = true;
                UI.glError();
                throw error;
            }
        }
        
        if (this.state != AppState.ready)
            return;



        if (this.pickPoint.pick) {
            let canvasHeight = this.gl.scene.camera.screenY;
            let selected = this.gl.renderPick(this.pickPoint.x, this.pickPoint.y, canvasHeight);
            
            this.gl.scene.select(selected);
            this.layers.select(selected);
            this.pickPoint.pick = false;
        } 
        
        let x, y;
        if (this.interface.keys[67]) {
            x = this.gl.canvas.width;
            y = this.gl.canvas.height;
            this.resize(4096, 4096);
        }
        


        this.gl.render();
        //this.gl.renderShadow();

        if (this.interface.keys[67]) { // letter c
            this.gl.saveCanvas("screen.png");
            this.resize(x, y);
            this.interface.keys[67] = false;
        }
    }

    resize(x: number, y: number){
        this.gl.resize(x, y);
    }
}
