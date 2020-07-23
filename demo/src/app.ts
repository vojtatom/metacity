

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
        }

        constructor(app: Application) {
            this.app = app;
            this.keys = {};
            this.mouse = {
                x: null,
                y: null,
                down: false,
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

        onMouseDown(x: number, y: number) {
            this.mouse.down = true;
            this.mouse.x = x;
            this.mouse.y = y;
        };

        onMouseUp(x: number, y: number) {
            this.mouse.down = false;
        };

        onMouseMove(x: number, y: number) {
            if (!this.mouse.down) {
                return;
            }

            let delta_x = x - this.mouse.x;
            let delta_y = y - this.mouse.y;

            this.mouse.x = x
            this.mouse.y = y;

            this.app.gl.scene.camera.rotate(delta_x, delta_y);
        };

        wheel(delta: number){
            this.app.gl.scene.camera.move(1, delta);
        }
    }

    export class Application {

        loaded : {
            obj: boolean,
            json: boolean
        };

        gl: GL.Graphics;
        city: CityModule.City;

        interface: Interface;

        constructor()
        {
            let windows = new UI.Window("3D view", [ 
                    new UI.Canvas(),
                ]);

            let main = document.getElementById("main");
            main.appendChild(windows.render());

            this.loaded = {
                obj: false,
                json: false
            };

            //take the first canvas you find
            let canvas = document.getElementsByTagName("canvas")[0];
            this.gl = new GL.Graphics(canvas);
            this.interface = new Interface(this);

            this.city = new CityModule.City(this.gl);
        }

        load_file(file: File) {
            const reader = new FileReader();
            let suffix: string | string[] = file.name.split(".");
            suffix = suffix[suffix.length - 1];
            let ftype = FileType.unknown;
    
            if (suffix === "obj")
                ftype = FileType.obj;
            else if (suffix === "json")
                ftype = FileType.json;
    
            reader.addEventListener('load', (event) => {
                this.parse_file(ftype, (event.target.result as string));
            });

            reader.readAsText(file);
        }
        
        parse_file(type: FileType, contents: string)
        {
            if (type === FileType.obj)
            {
                let model = Parser.parseOBJ(contents);
                if (!model)
                    throw "Error parsing OBJ file";
                
                this.loaded.obj = true;
                this.city.addModel(model);
            }
            else if (type === FileType.json)
            {
                let meta = Parser.parseJson(contents);
                if (!meta)
                    throw "Error parsing OBJ file";
                
                this.loaded.json = true;
            }
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
            }
        }

        render() {
            this.gl.render();
        }

        resize(x: number, y: number){
            this.gl.resize(x, y);
        }
    }
    
}