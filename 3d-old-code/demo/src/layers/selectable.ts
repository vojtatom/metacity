interface Meta {
    type: string;
    data: { [name: string]: any };
}


class SelectableLayer extends Layer {
    idToObj: { [name: number]: string };
    objToId: { [name: string]: number };
    detail: HTMLElement;

    meta: Meta;
    title: string;
    


    constructor(gl: Graphics,  data: any, meta: Meta, title: string) {
        super(gl);

        this.idToObj = data.idToObj;
        this.objToId = data.objToId;

        this.meta = meta;
        this.title = title;

        this.createUI();
    }

    displayDetail(obj: string) {
        UI.closeLayerDetial();
    
        let struct = UI.jsonToHTML(this.meta.data[obj], this, false);
        this.detail.innerHTML = "";

        this.detail.appendChild(struct);
        this.detail.classList.add('open');

        console.log(this.meta.data[obj]);
    }

    createUI() {
        let panel = document.getElementById("sidebar");
        let children = [];

        let detail = UI.div({
            class: 'layer-detail'
        });

        this.detail = detail;

        for(let entry in this.meta.data) {
            if (entry in this.objToId) {
                children.push(UI.div({
                    class: ['layer-entry', 'active'],
                    id: entry,
                    html: entry,
                    onclick: () => {
                        this.displayDetail(entry);
                    }
                }))
            }

        }

        let list = UI.div({
            class: 'layer-list',
            child: children
        });

        let title = UI.div({
            class: 'layer-title',
            html: this.title,
            onclick: () => {
                let close = list.classList.contains('open');

                UI.closeLayerDetial();

                if (close)
                    return;

                list.classList.add('open');
            }
        })

        let layer = UI.div({
            class: 'layer',
            child: [
                title,
                list,
                detail
            ]
        })

        panel.appendChild(layer);

    }

    select(id: number|string) {
        if (typeof(id) === 'string') {
            if (id in this.objToId){
                this.displayDetail(id);
                this.gl.scene.select(this.objToId[id]);
            }
        } else if (typeof(id) === 'number') {
            if (id in this.idToObj){
                this.displayDetail(this.idToObj[id]);
                this.gl.scene.select(id);
            }
        } 
    }


}