let dropArea = document.getElementById("file");
let fileIcon = document.getElementById("file-icon");
let fileStatus = document.getElementById("file-status");


let app = new AppModule.Application();
app.render();

/*dropArea.ondragover = (e) => {
    e.preventDefault();
    console.log("dragging");
}

dropArea.ondragenter = (e) => {
    e.preventDefault();
    console.log("dragging on");
    fileIcon.classList.add("active");
}

dropArea.ondragleave = (e) => {
    e.preventDefault();
    console.log("dragging off");
    fileIcon.classList.remove("active");
}

dropArea.ondrop = (e) => {
    e.preventDefault();
    let file = e.dataTransfer.files[0];
    let path = (file as any).path;
    console.log(path);
    app.load_file(path);

    fileStatus.innerHTML = "Processing dataset";

    fileIcon.classList.add("processing");

}*/

