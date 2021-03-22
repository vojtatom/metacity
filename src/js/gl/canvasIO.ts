class IO {
    keys: {
        [mname: string]: boolean
    };
    mouse: {
        x: number;
        y: number;
        down: boolean;
        button: number;
        time: number
    }

    constructor() {
        this.keys = {};
        this.mouse = {
            x: null,
            y: null,
            down: false,
            button: 0,
            time: 0
        };
    }

    onKeyDown(key: string) {
        this.keys[key] = true;
        //this.app.pressed(key);
        console.log(key);
    }

    onKeyUp(key: string){
        this.keys[key] = false;
    }

    onMouseDown(x: number, y: number, button: number) {
        this.mouse.down = true;
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.button = button;
        this.mouse.time = Date.now();
    };
    
    onMouseUp(x: number, y: number) {
        this.mouse.down = false;
        let now = Date.now();
        
        if (now - this.mouse.time < 200 && this.mouse.button == 0)
        {
            //this.app.pick(x, y);
        }
    };

    onMouseMove(x: number, y: number) {
        if (!this.mouse.down) {
            return;
        }

        let delta_x = x - this.mouse.x;
        let delta_y = y - this.mouse.y;

        this.mouse.x = x
        this.mouse.y = y;

        if (this.mouse.button == 1) {
            //wheel
            Viewer.instance.graphics.scene.camera.rotate(delta_x, delta_y);
        } else if (this.mouse.button == 0) {
            //left button
            Viewer.instance.graphics.scene.camera.move(delta_x, delta_y);
        }
    };

    wheel(delta: number){
        Viewer.instance.graphics.scene.camera.zoom(1, delta);
    }
}