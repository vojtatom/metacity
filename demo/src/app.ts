

module AppModule {

    export class Application {

        constructor()
        {
            let windows = new UI.Window("3D view", [
                    new UI.Canvas(),
                ]);

            let main = document.getElementById("main");
            main.appendChild(windows.render());

            //init gl glibrary
        }

        render() {
            console.log("rendering");

            //render cube
        }
    }
    
}