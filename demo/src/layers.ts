

module LayerModule {
    export class LayerManager {
        gl : GL.Graphics;
        
        tmp: any;

        constructor(gl: GL.Graphics) {
            this.gl = gl;
        }

        addBuidings(modelOBJFile: string, cityJsonFile: string){
            let model = Parser.parseOBJ(modelOBJFile, true);

            if(model)
                this.gl.addCitySegment(model as GL.CityModelInterface);
            else 
                throw 'Building models not loaded';

        }

        addTerrain(modelOBJFile: string) {
            let model = Parser.parseOBJ(modelOBJFile, false);
            this.tmp = model;
            console.log(model);
        }

    }
}