


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
        constructor(){
            super();

        }

        render() {
            
            let canvas = document.createElement("canvas");
            
            let elem = div({
                id: "canvas",
                child: canvas
            });
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


        render() {
            let elem = div({
                class: "window",
            });

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
}