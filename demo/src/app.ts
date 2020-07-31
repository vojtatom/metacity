

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

    export class Application {

        gl: GL.Graphics;
        layers: LayerModule.LayerManager;

        interface: Interface;

        pickPoint: {
            pick: boolean,
            x: number,
            y: number
        };

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

            this.layers = new LayerModule.LayerManager(this.gl);

            this.pickPoint = {
                pick: false,
                x: 0,
                y: 0
            };

            //------------------------------------------------
            // FOR DEMO PURPOUSES ONLY
            //------------------------------------------------
            DataManager.files({
                files: ["./assets/bubny/bubny_bud.obj",
                        "./assets/bubny/bubny_bud.json",
                        "./assets/bubny/bubny_most.obj",
                        "./assets/bubny/bubny_most.json",
                        "./assets/bubny/bubny_ter.obj"],
                success: (files) => {
                    this.layers.addBuidings(files[0], files[1]);
                    this.layers.addBuidings(files[2], files[3]);
                    this.layers.addTerrain(files[4]);


                    //this.parse_file(FileType.obj, files[0]);
                    //this.parse_file(FileType.obj, files[2]);
                    //this.parse_file(FileType.json, files[1]);
                    
                },
                fail: () => { console.error("error loading assets"); }
            })
            //------------------------------------------------
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
            if (this.pickPoint.pick) {
                let canvasHeight = this.gl.scene.camera.screenY;
                let selected = this.gl.renderPick(this.pickPoint.x, this.pickPoint.y, canvasHeight);
                this.gl.scene.select(selected);
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