

module LayerModule {
    export class LayerManager {
        gl : GL.Graphics;
        tmp: any;
        window: UI.Window;
        panel: UI.Panel;

        CJmetadata: { [name: string] : any }[];
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
            this.CJmetadata = [];
            this.detail = {
                ui: undefined,
                uiID: undefined
            };
        }

        addBuidings(modelOBJFile: string, cityJsonFile: string, title: string){
            //this.panel.addLabel(new UI.Label(title));
            
            let model = Parser.parseOBJ(modelOBJFile, true);
            let meta = Parser.parseJson(cityJsonFile);

            this.CJmetadata.push(meta);

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

        addStreets(streets: string) {
            let model = Parser.parseGeoJson(streets, 2);
            
            if (model)
                this.gl.addStreetSegment(model as GL.StreetModelInterface);
            else
                throw 'Street models not loaded';
        }

        showDetail(id: number) {
            let obj = this.idToObj[id];
            let data: any[] = [];

            for (let pack of this.CJmetadata) {
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