let app: Application;

window.onload = function(e: Event) {
    app = new Application();
    //canvas variable is actually parent DIV!!!
    let canvas = document.getElementById("canvas");

    /*canvas.ondragover = (e: Event) => {
        e.preventDefault();
        console.log("dragging");
    }

    canvas.ondragenter = (e: Event) => {
        e.preventDefault();
        console.log("dragging on");
    }

    canvas.ondragleave = (e: Event) => {
        e.preventDefault();
        console.log("dragging off");
    }

    canvas.ondrop = (e) => {
        e.preventDefault();
        let fileList = e.dataTransfer.files;
        console.log(fileList);
        
        for(let f of fileList)
            app.load_file(f);

        let prompt = document.getElementById("prompt");
        prompt.parentElement.removeChild(prompt);
    }*/

    document.onkeydown = function (event: KeyboardEvent) {
        app.interface.onKeyDown(event.keyCode);
        event.stopPropagation();
    };

    document.onkeyup = function (event: KeyboardEvent) {
        app.interface.onKeyUp(event.keyCode);
        event.stopPropagation();
    };

    window.onresize = function(e: UIEvent) {
        app.resize(window.innerWidth, window.innerHeight);
        event.stopPropagation();
    }

    canvas.onmousedown = function(event) {
        app.interface.onMouseDown(event.clientX, event.clientY, event.button);
        event.stopPropagation();
	};

	canvas.onmouseup = function(event) {
        app.interface.onMouseUp(event.clientX, event.clientY);
        event.stopPropagation();
	};

	canvas.onmousemove = function(event) {
        app.interface.onMouseMove(event.clientX, event.clientY);
        event.stopPropagation();
    };

    canvas.onwheel = function(event){
        app.interface.wheel(event.deltaY);
        event.preventDefault();
        event.stopPropagation();
    };

    let last = 0;
    let loop = function(time: number){
		app.render();
        //console.log(time, time - last);
        last = time;
		requestAnimationFrame(loop);
	}

    app.resize(window.innerWidth, window.innerHeight);
    requestAnimationFrame(loop);
    return false;
} 