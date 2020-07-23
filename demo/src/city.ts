

module CityModule {
    export class City {
        gl : GL.Graphics;

        constructor(gl: GL.Graphics) {
            this.gl = gl;
        }

        addModel(model: GL.CityModelInterface){
            this.gl.addCitySegment(model);
        }

    }
}