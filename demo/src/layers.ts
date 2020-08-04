

module LayerModule {
    export class LayerManager {
        gl : GL.Graphics;
        tmp: any;
        window: UI.Window;
        panel: UI.Panel;

        objects: { [name: string] : any }[];
        idToObj: { [name: number] : string };
        objToId: { [name: string] : number };

        detail: {
            ui?: UI.UIElement,
            uiID?: number,
        };

        constructor(gl: GL.Graphics, window: UI.Window) {
            this.gl = gl;
            this.window = window;
            //this.panel = new UI.Panel("Layers", []);

            this.idToObj = {};
            this.objToId = {};
            this.objects = [];
            this.detail = {
                ui: undefined,
                uiID: undefined
            };
        }

        addBuidings(modelOBJFile: string, cityJsonFile: string, title: string){
            //this.panel.addLabel(new UI.Label(title));
            
            let model = Parser.parseOBJ(modelOBJFile, true);
            this.objects.push(Parser.parseJson(cityJsonFile));

            Object.assign(this.objToId, model.objToId);
            Object.assign(this.idToObj, model.idToObj);

            if(model)
                this.gl.addCitySegment(model as GL.CityModelInterface);
            else 
                throw 'Building models not loaded';
            
        }
        
        addTerrain(modelOBJFile: string) {
            //this.panel.addLabel(new UI.Label("terrain"));

            let model = Parser.parseOBJ(modelOBJFile, false);

            if (model)
                this.gl.addTerainSegment(model as GL.TerrainModelInterface);
            else
                throw 'Terrain models not loaded';
        }

        showDetail(id: number) {
            let obj = this.idToObj[id];
            let data: any[] = [];

            for (let pack of this.objects) {
                if (obj in pack["CityObjects"])
                    data.push(pack["CityObjects"][obj]);
            }

            //always pck the first?
            let bdata = data[0];

            if (this.detail.ui !== undefined) {
                this.window.removeUIElement(this.detail.ui, this.detail.uiID);
                this.detail.ui = undefined;
            }

            if (!bdata)
                return;

            let buildData = {
                type: bdata["type"],
                appID: id,
                cjID: this.idToObj[id],
                attr: {}
            };

            if ('attributes' in bdata)
                Object.assign(buildData.attr, bdata['attributes']);
            
            let detail = new UI.BuildingDetailView(buildData);
            this.detail.ui = detail;
            this.detail.uiID = this.window.addUIElement(detail);

        }

    }
}