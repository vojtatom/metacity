

let app = new AppModule.Application();
let dropArea = document.getElementById("canvas");
//app.render();

dropArea.ondragover = (e: Event) => {
    e.preventDefault();
    console.log("dragging");
}

dropArea.ondragenter = (e: Event) => {
    e.preventDefault();
    console.log("dragging on");
}

dropArea.ondragleave = (e: Event) => {
    e.preventDefault();
    console.log("dragging off");
}

dropArea.ondrop = (e) => {
    e.preventDefault();
    let fileList = e.dataTransfer.files;
    console.log(fileList);
    
    for(let f of fileList)
        app.load_file(f);
}

