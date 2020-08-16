interface TerrainInterface extends TerrainModelInterface {
    type: 'obj',
    vertices: Float32Array,
    normals: Float32Array,
    stats: OBJstats
}

class Terrain extends Layer {
    glmodel: TerrainModel;

    constructor(gl: Graphics, data: any) {
        super(gl);

        //this.panel.addLabel(new UI.Label("terrain"));
        data.vertices = Parser.toFloat32(data.vertices as string);
        data.normals = Parser.toFloat32(data.normals as string);
        data.stats.min = Parser.toFloat32(data.stats.min);
        data.stats.max = Parser.toFloat32(data.stats.max);
        
        //update scene and camera
        this.gl.scene.addModel(data.stats);

        //shift
        this.gl.scene.rescale3D(data.vertices);
        this.gl.scene.rescale3D(data.stats.min);
        this.gl.scene.rescale3D(data.stats.max);

        let models = this.gl.addTerainSegment(data as TerrainModelInterface);
        this.glmodel = models.terrainModel;
    }




}