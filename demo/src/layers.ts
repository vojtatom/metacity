
class LayerManager {
    gl : Graphics;
    window: UI.Window;
    layers: Layer[];

    constructor(gl: Graphics, window: UI.Window) {
        this.gl = gl;
        this.window = window;
        this.layers = [];
    }


    addLayer(layer: Layer) {
        this.layers.push(layer);
    }

    select(id: number) {
        UI.closeLayerDetial();
        this.layers.forEach(layer => {
            layer.select(id);
        });
    }


}