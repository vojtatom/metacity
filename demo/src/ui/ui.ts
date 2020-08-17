module UI {
    //----------------------------------------------------------------------
    //General UI stuff
    //----------------------------------------------------------------------

    interface DivInterface {
        id?: string;
        html?: string;
        class?: string | Array<string>;
        child?: Element | Array<Element>;
        onclick?: (e: MouseEvent) => void;
        onmouseenter?: (e: MouseEvent) => void;
        onmouseleave?: (e: MouseEvent) => void;
    }

    interface ImgInterface {
        src: string;
        alt: string;
        id?: string;
        class?: string | Array<string>;
    }


    interface SelectInterface {
        values: Array<string | number>;
        default: string | number;
        onchange: (e: Event) => void;
        id?: string;
        class?: string | Array<string>;
    }

    export function div(options?: DivInterface) {
        let e = document.createElement("div");

        if (!options)
            return e;

        if (options.id)
            e.id = options.id;

        if (options.html)
            e.innerHTML = options.html;

        if (options.class) {
            if (Array.isArray(options.class))
                for (let c of options.class)
                    e.classList.add(c);
            else
                e.classList.add(options.class);
        }

        if (options.child) {
            if (Array.isArray(options.child))
                for (let c of options.child)
                    e.appendChild(c);
            else
                e.appendChild(options.child);
        }

        if (options.onclick) {
            e.onclick = options.onclick;
        }

        if (options.onmouseenter && options.onmouseleave)
        {
            e.onmouseenter = options.onmouseenter;
            e.onmouseleave = options.onmouseleave;

        }

        return e;
    }

    export function select(options: SelectInterface)
    {   
        let e = document.createElement("select");

        for(let o of options.values)
        {
            let v = document.createElement("option");
            v.value = o.toString();
            v.innerHTML = o.toString();

            e.appendChild(v);
        }

        if (options.class) {
            if (Array.isArray(options.class))
                for (let c of options.class)
                    e.classList.add(c);
            else
                e.classList.add(options.class);
        }

        e.onchange = options.onchange;

        return e;
    }   

    export function img(options: ImgInterface) {
        let e = document.createElement("img");

        e.src = options.src;
        e.alt = options.alt;

        if (options.id)
            e.id = options.id;

        if (options.class) {
            if (Array.isArray(options.class))
                for (let c of options.class)
                    e.classList.add(c);
            else
                e.classList.add(options.class);
        }
        return e;
    }

    //----------------------------------------------------------------------
    //Architecture of UI
    //----------------------------------------------------------------------

    export class UIElement {
        html: HTMLElement;

        constructor(){

        }

        render() {
            return div();
        }
    }

    export class MenuItem extends UIElement {
        title: string;
        call: () => void;

        constructor(title : string, call : () => void) {
            super();
            this.title = title;
            this.call = call;
        }
    }


    export class Menu extends UIElement {
        title: string;
        items: Array<MenuItem|Menu>;

        constructor(title: string, items: Array<MenuItem|Menu>) {
            super();
            this.title = title;
            this.items = items;
        }
    }


    export class Canvas extends UIElement {
        canvas: HTMLElement;
        html: HTMLElement;

        constructor(){
            super();

        }

        render() {
            
            let canvas = document.createElement("canvas");
            
            let elem = div({
                id: "canvas",
                child: canvas
            });

            this.canvas = canvas;
            this.html = elem;

            return elem;
        }
    }

    export class Label extends UIElement {
        title: string;
        id: string;
        html: HTMLElement;

        constructor(title: string)
        {
            super();
            this.id = "";
            this.title = title;
        }


        render() {
            let elem = div({
                class: "label",
                id: this.id,
                html: this.title,
            });

            this.html = elem;

            return elem;
        }
    }

    export class Panel extends UIElement {
        title: string;
        contents: Array<UIElement>;
        html: HTMLElement;

        constructor(title: string, contents: Array<UIElement>)
        {
            super();
            this.title = title;
            this.contents = contents;
        }

        addLabel(label: UI.Label) {
            this.contents.push(label);
            
            if(this.html) {
                this.html.appendChild(label.render());
            }
        }

        render() {
            let elem = div({
                class: "panel",
            });

            for(let child of this.contents)
            {
                elem.appendChild(child.render());
            }
            
            this.html = elem;

            return elem;
        }
    }

    interface BuildingData {
        type: string,
        attr: { [name: string]: any },
        children?: string[];
        appID: number;
        cjID: string;
    }

    export class BuildingDetailView extends UIElement {
        data: BuildingData;

        constructor(data: BuildingData) {
            super();
            this.data = data;
        }

        render() {
            let attr = [];

            attr.push(
                div({
                    class: 'row',
                    child: [
                        div({ html: "Type" }),
                        div({ html: this.data.type })
                    ]
                }),
                div({
                    class: 'row',
                    child: [
                        div({ html: "Application ID" }),
                        div({ html: this.data.appID.toString() })
                    ]
                }),
                div({
                    class: 'row',
                    child: [
                        div({ html: "CityJSON ID" }),
                        div({ html: this.data.cjID })
                    ]
                })
            );

            for (let key in this.data.attr) {
                attr.push(div({
                    class: 'row',
                    child: [
                        div({ html: key }),
                        div({ html: this.data.attr[key].toString() })
                    ]
                }));
            }


            let elem = div({
                class: 'building-detail',
                child: attr,
            });

            this.html = elem;

            return elem;
        }
    }


    export class Window extends UIElement {
        title: string;
        contents: Array<UIElement>;

        constructor(title: string, contents: Array<UIElement>)
        {
            super();
            this.title = title;
            this.contents = contents;
        }

        addUIElement(elem: UIElement) {
            this.contents.push(elem);

            if (this.html) {
                this.html.appendChild(elem.render());
            }

            return this.contents.length - 1;
        }

        removeUIElement(elem: UIElement, uiID: number) {
            this.contents = this.contents.splice(uiID, 1);

            if (this.html) {
                elem.html.parentElement.removeChild(elem.html);
            }
        }

        render() {
            let elem = div({
                class: "window",
            });

            this.html = elem;

            for(let child of this.contents)
            {
                elem.appendChild(child.render());
            }

            return elem;
        }
    }
    

    //Window rack is a custom class for managing windows
    export class WindowRack extends UIElement {
        contents: Array<Window>;
        active: number;
        windowLabels: Array<HTMLElement>;
        windowArea: HTMLElement;

        constructor(windows: Array<Window>) {
            super();
            this.contents = windows;
            this.active = 0;
            this.windowLabels = [];

        }

        render() {
            let rack = div({
                class: "rack",
            });
            
            let area = div({
                class: "space",
            });

            for(let childID in this.contents)
            {
                let lab = div({
                    onclick: () => { 
                        this.deactivate();
                        area.innerHTML = "";
                        this.activate(Number(childID));
                    },
                    html: this.contents[childID].title,
                });

                this.windowLabels.push(lab);
                rack.appendChild(lab);
            }

            this.windowArea = area;
            this.activate(this.active);

            return div({
                child: [rack, area]
            });
        }
        
        deactivate() {
            this.windowLabels[this.active].classList.remove("active");
        }
        
        activate(id: number) {
            this.active = id;
            this.windowArea.appendChild(this.contents[this.active].render());
            this.windowLabels[this.active].classList.add("active");
        }
    }


    export function resetLoader() {
        let loader = document.getElementById("loader");
        loader.innerHTML = "";
    }

    export function loading(title: string, progress: number) {
        let loader = document.getElementById("loader");

        let prog: HTMLElement, stretch: HTMLElement;
        if (loader.childElementCount == 1) {

            prog = loader.childNodes[0] as HTMLElement;
            stretch = prog.childNodes[0] as HTMLElement;

        } else {
            stretch = div({
                class: "strechy"
            });

            prog = div({
                class: "progress",
                child: stretch
            });    
            loader.appendChild(prog);
        }

        stretch.innerHTML = title;
        stretch.style.width = (progress * 100).toFixed(2) + "%";
    }

    export function closeLayerDetial() {
        let lists = document.getElementsByClassName('layer-list');

        for(let e of lists) {
            e.classList.remove('open');
        }

        let details = document.getElementsByClassName('layer-detail');

        for(let e of details) {
            e.classList.remove('open');
        }
    }

    interface UIMeta {
        [name: string]: any
    }

    export function jsonToHTML(data: UIMeta, layer: SelectableLayer, selectable: boolean) {
        let entries = [];

        for(let e in data) {
            if( typeof(data[e]) === 'string') {
                let value;
                
                if (selectable)
                    value = div({
                        class: ['layer-detail-value', 'string', 'active'],
                        html: data[e],
                        onclick: () => {
                            layer.select(data[e]);
                        }
                    })
                else 
                    value = div({
                        class: ['layer-detail-value', 'string'],
                        html: data[e]
                    })
                
                
                entries.push(div({
                    class: 'layer-detail-entry',
                    child: [
                        div({
                            class: 'layer-detail-title',
                            html: e
                        }),
                        value
                    ]
                }));
            } else if(typeof(data[e]) === 'number') {
                entries.push(div({
                    class: 'layer-detail-entry',
                    child: [
                        div({
                            class: 'layer-detail-title',
                            html: e
                        }),
                        div({
                            class: ['layer-detail-value', 'number'],
                            html: data[e]
                        })
                    ]
                }));
            } else {
                let clickable = (e === 'parents' ||  e == 'children');

                entries.push(div({
                    class: 'layer-detail-entry',
                    child: [
                        div({
                            class: 'layer-detail-title',
                            html: e
                        }),
                        jsonToHTML(data[e], layer, clickable)
                    ]
                }));
            }
        }

        let block = div({
            class: 'layer-detail-block',
            child: entries
        });

        return block;
    }


    function clearAll() {
        document.getElementById("sidebar").innerHTML = "";
        document.getElementById("settings").innerHTML = "";
        document.getElementById("loader").innerHTML = "";
    }

    export function glError() {
        clearAll();

        error("WebGL error", "Your browser does not support WebGL2 or needed WebGL extensions," 
        + " or your GPU does not have the required amount of memory. Try any desktop computer with Google Chrome.");
    }

    export function error(name: string, message: string) {
        let err = div({
            class: 'error',
            child: [
                div({
                    class: 'error-apologise',
                    html: 'We apologise, but there has been an error:'
                }),
                div({
                    class: 'error-title',
                    html: name
                }),
                div({
                    class: 'error-message',
                    html: message
                })
            ]
        });

        let wrap = document.getElementById("error");
        wrap.appendChild(err);

    }


    export function setupSettings(app: Application) {
        let shadow_label = (scene: Scene) => {
            return scene.shadowsEnabled ? 'on' : 'off';
        }

        let shadow_toggle = div({
            class: 'settings-option',
            html: 'shadows ' + shadow_label(app.gl.scene) + ' (experimental)'
        });

        
        shadow_toggle.onclick = () => {
            app.gl.scene.toggleShadows();
            shadow_toggle.innerHTML = 'shadows ' + shadow_label(app.gl.scene) + ' (experimental)';
        };

        let rack = div({
            class: 'settings',
            child: [
                div({
                    html: 'top (E/7)',
                    class: 'settings-option',
                    onclick: () => {
                        app.gl.scene.camera.viewTop();
                    }
                }),
                div({
                    html: 'front (R/1)',
                    class: 'settings-option',
                    onclick: () => {
                        app.gl.scene.camera.viewFront();
                    }
                }),
                div({
                    html: 'side (T/3)',
                    class: 'settings-option',
                    onclick: () => {
                        app.gl.scene.camera.viewSide();
                    }
                }),
                div({
                    html: 'center (W/9)',
                    class: 'settings-option',
                    onclick: () => {
                        app.gl.scene.camera.restoreCenter();
                    }
                }),
                shadow_toggle
            ]
        });


        let s = document.getElementById("settings");
        s.appendChild(rack);
    }
}