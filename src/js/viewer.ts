interface GeneralLayerInterface {
    type: string;
    idToIdx: {[name: number]: {[name: string]: [number, number]}};
    idxToId: {[name: number]: {[name: number]: [number, string]}};
    idxL1: string;
    idxL2: string;
    lod: number[];
    meta: {[name: number]: {[name: string]: any}};
    bbox: BBox;
}


interface ObjectLayerInterface extends GeneralLayerInterface {
    normals: string;
    triangles: string;
}


class Layer {
    private idToIdx: {[name: number]: {[name: string]: [number, number]}};
    private idxToId: {[name: number]: {[name: number]: [number, string]}};
    private lod: number[];
    private meta: {[name: number]: {[name: string]: any}}

    protected gl: GLObject;

    constructor(data: GeneralLayerInterface) {
        this.idToIdx = data.idToIdx;
        this.idxToId = data.idxToId;
        this.lod = data.lod;
        this.meta = data.meta;
        this.gl = new GLObject();
    }

    delete() {
        this.gl.delete();
    }

}


class ObjectLayer extends Layer {
    
    constructor(data: ObjectLayerInterface) {
        super(data);   

        console.log("loading layer");

        this.gl.initVao();
        this.gl.bindVao();
        
        this.gl.initBuffer("vertices");
        let triangles = Parser.toFloat32(data.triangles);
        this.gl.fillBuffer("vertices", triangles);
        this.gl.programs.objects.bindAttrVertex();
        
        this.gl.initBuffer("normals");
        let normals = Parser.toFloat32(data.normals);
        this.gl.fillBuffer("normals", normals);
        this.gl.programs.objects.bindAttrNormal();
        
        this.gl.unbindVao();
        
        this.gl.usesProgram(this.gl.programs.objects.renderParams(0, triangles.length / 3));
        this.gl.updateBBox(data.bbox);
        this.gl.markForRender();

        Viewer.instance.errorCheck();
    }
}




class Viewer {
    private static instanceObject: Viewer;
    graphics: Graphics;

    layers: {[name: string]: Layer} = {};

    active = false;

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }
    
    //Viewer is a singleton
    private constructor() {}

    static get instance() {
        if (!this.instanceObject) {
            this.instanceObject = new this();
        }
        return this.instanceObject;
    }



    init() {
        //TODO refactor UI handeling
        let canvas = document.getElementById("viewerCanvas") as HTMLCanvasElement;
        this.graphics = new Graphics(canvas);
    }

    
    clear() {
        for(let layer in this.layers) {
            this.layers[layer].delete()
        }
        this.layers = {};
    }


    updateLayer(id: string, layer: GeneralLayerInterface) {
        if (id in this.layers)
            this.layers[id].delete();
        
        switch (layer.type) {
            case "objects":
                this.layers[id] = new ObjectLayer(layer as ObjectLayerInterface);
                break;
        
            default:
                break;
        }
    }


    recieved(data: any) {
        if(!(data.recipient == "viewer" && "status" in data))
            return;

        switch (data.status) {
            case "clearViewer":
                this.clear();
                break;
            case "addLayer":
                this.updateLayer(data.layerID, data.layer);
                break;
            default:
                break;
        }
    }


    startRender() {
        let last = 0;
        let loop = (time: number) => {

            if(this.active) {
                this.graphics.renderFrame();
            }
            //console.log(time - last);
            last = time;
    
            if (!this.graphics.error)
                requestAnimationFrame(loop);
        }
    
        this.graphics.resize();
        requestAnimationFrame(loop);
    }

    willAppear() {
        this.graphics.resize();
        this.graphics.renderFrame(true);
        this.activate();
    }

    willDisappear() {
        this.deactivate();
    }

    errorCheck() {
        this.graphics.checkError();
    }

    resize() {
        this.graphics.resize();
    }
}