

module AppModule {

    enum FileType {
        obj,
        json,
        unknown
    }

    export class Application {

        loaded : {
            obj: boolean,
            json: boolean
        };

        gl: GL.Graphics;

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
                
                console.log(model);

                this.loaded.obj = true;
            }
            else if (type === FileType.json)
            {
                let meta = Parser.parseJson(contents);
                if (!meta)
                    throw "Error parsing OBJ file";
                
                this.loaded.json = true;
            }
            
            //TODO both loaded
            if (this.loaded.obj)
            {

            }
        }

        initCityModel(model: GL.CityModelInterface) {
            
        }

        render() {
            console.log("rendering");
        }
    }
    
}