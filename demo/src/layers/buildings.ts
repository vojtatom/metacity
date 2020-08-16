interface Meta {
    type: 'city';
    data: { [name: string]: any };
}

interface BuildingsInterface extends BuildingsModelInterface {
    type: 'obj';
}


class Buildings extends Layer {
    glmodel: BuildingModel;

    constructor(gl: Graphics, data: any, meta: Meta) {
        super(gl);

        //this.panel.addLabel(new UI.Label("terrain"));
        data.vertices = Parser.toFloat32(data.vertices as string);
        data.normals = Parser.toFloat32(data.normals as string);
        data.objects = Parser.toUint32(data.objects as string);
        data.stats.min = Parser.toFloat32(data.stats.min);
        data.stats.max = Parser.toFloat32(data.stats.max);

        let models = this.gl.addCitySegment(data as BuildingsInterface);
        this.glmodel = models.cityModel;
    }




}