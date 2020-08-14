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
        this.gl = new Graphics(canvas);
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

    /*load() {
        let files = this.data;
        this.state = AppState.parsing;

        let that = this;
        new Promise(function(resolve, reject) {
            UI.resetLoader();
            UI.loading("Parsing buildings", 0.1);
            setTimeout(() => resolve(1), 1000);
        }).then(function(){
            return new Promise((resolve, reject) => {
                that.layers.addBuidings(files[0], files[1], "buildings");
                UI.loading("Parsing bridges", 0.3);
                setTimeout(() => resolve(1), 1000);
            }).then(function(){
                return new Promise((resolve, reject) => {
                    that.layers.addBuidings(files[2], files[3], "bridges");
                    UI.loading("Parsing terrain", 0.5);
                    setTimeout(() => resolve(1), 1000);
                }).then(function(){
                    return new Promise((resolve, reject) => {
                        that.layers.addTerrain(files[4]);
                        UI.loading("Parsing streets", 0.75);
                        setTimeout(() => resolve(1), 1000);
                    }).then(function(){
                        return new Promise((resolve, reject) => {
                            that.layers.addStreets(files[5]);
                            UI.resetLoader();
                            that.state = AppState.ready;
                            that.data = null; // delete
                            setTimeout(() => resolve(1), 1000);
                        });
                    });
                });
            });
        });
    }*/

    load() {

        
        let data = JSON.parse(this.data);
        this.state = AppState.parsing;
        console.log(data);

        //terrain loading
        let terrain = new Terrain(this.gl, data.terrain);
        this.layers.addLayer(terrain);

        //load texture
        this.gl.addFloat32Texture("height", data.height as TextureInterface);

        //street loading
        let streets = new Streets(this.gl, data.streets);
        this.layers.addLayer(streets);
        
        //street graph loading
        Path.cropGraph(data.graph.data, this.gl.scene.stats.min, this.gl.scene.stats.max);
        streets.addStreetGraph(data.graph);


        this.state = AppState.ready;
        this.data = null; // ensure delete
        data = null;
    }

    pressed(key: number) {

        if (key == 103){ // numpad 7
            this.gl.scene.camera.viewTop();
        } else if (key == 97) { // numpad 1
            this.gl.scene.camera.viewFront();
        } else if (key == 99) { // numpad 3
            this.gl.scene.camera.viewSide();
        } else if (key == 105) { // numpad 9
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
            this.load();
        
        if (this.state != AppState.ready)
            return;

        if (this.pickPoint.pick) {
            let canvasHeight = this.gl.scene.camera.screenY;
            let selected = this.gl.renderPick(this.pickPoint.x, this.pickPoint.y, canvasHeight);
            this.gl.scene.select(selected);
            //this.layers.showDetail(selected);
            this.pickPoint.pick = false;
        } 
        
        this.gl.render();

        if (this.interface.keys[67]) { // letter c
            this.gl.saveCanvas("screen.png");
            this.interface.keys[67] = false;
        }
    }

    resize(x: number, y: number){
        this.gl.resize(x, y);
    }
}
