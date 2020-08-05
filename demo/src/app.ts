

module AppModule {

    enum FileType {
        obj,
        json,
        unknown
    }

    class Interface {
        app: Application;
        keys: {
            [mname: string]: boolean
        };
        mouse: {
            x: number;
            y: number;
            down: boolean;
            button: number;
            time: number
        }

        constructor(app: Application) {
            this.app = app;
            this.keys = {};
            this.mouse = {
                x: null,
                y: null,
                down: false,
                button: 0,
                time: 0
            };
        }

        onKeyDown(key: number) {
            this.keys[key] = true;
            this.app.pressed(key);
            console.log(key);
        }

        onKeyUp(key: number){
            this.keys[key] = false;
        }

        onMouseDown(x: number, y: number, button: number) {
            this.mouse.down = true;
            this.mouse.x = x;
            this.mouse.y = y;
            this.mouse.button = button;
            this.mouse.time = Date.now();
        };

        onMouseUp(x: number, y: number) {
            this.mouse.down = false;
            let now = Date.now();
            
            if (now - this.mouse.time < 300 && this.mouse.button == 0)
            {
                this.app.pick(x, y);
            }
        };

        onMouseMove(x: number, y: number) {
            if (!this.mouse.down) {
                return;
            }

            let delta_x = x - this.mouse.x;
            let delta_y = y - this.mouse.y;

            this.mouse.x = x
            this.mouse.y = y;

            if (this.mouse.button == 0) {
                //left button
                this.app.gl.scene.camera.rotate(delta_x, delta_y);
            } else if (this.mouse.button == 1) {
                //wheel
                this.app.gl.scene.camera.move(delta_x, delta_y);
            }
        };

        wheel(delta: number){
            this.app.gl.scene.camera.zoom(1, delta);
        }
    }

    enum AppState {
        loading,
        loaded,
        parsing,
        ready
    }

    export class Application {

        gl: GL.Graphics;
        layers: LayerModule.LayerManager;

        interface: Interface;

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
            this.gl = new GL.Graphics(canvas);
            this.interface = new Interface(this);
            
            this.layers = new LayerModule.LayerManager(this.gl, windows);
            

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
                files: ["./assets/bubny/bubny_bud.obj",
                        "./assets/bubny/bubny_bud_min.json",
                        "./assets/bubny/bubny_most_filtered.obj",
                        "./assets/bubny/bubny_most.json",
                        "./assets/bubny/bubny_ter.obj",
                        "./assets/bubny/TSK_ulice_min.json"],
                success: (files) => {
                    this.data = files;
                    this.state = AppState.loaded;
                },
                fail: () => { console.error("error loading assets"); }
            });


            //------------------------------------------------
        }

        load() {
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
        }

        pressed(key: number) {
            //TODO instant reactions to keypresses

            //topview: numpad 7
            if (key == 103){
                this.gl.scene.camera.viewTop();
            } else if (key == 97) {
                this.gl.scene.camera.viewFront();
            } else if (key == 99) {
                this.gl.scene.camera.viewSide();
            } else if (key == 105) {
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
                this.layers.showDetail(selected);
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
    
}