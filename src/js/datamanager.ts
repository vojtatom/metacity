class DataManager {
    
    private static instanceObject: DataManager;
    
    rc: (data: object) => void;
    socket: ReconnectingWebSocket;
    callbacks: Array<(data: object) => void>;

    constructor() {
        this.callbacks = [];
    }

    setupInstance(recieveCallback: (data: object) => void)
    {
        this.rc = recieveCallback;
        let socket = new ReconnectingWebSocket('ws://localhost:9003');
        
        socket.onmessage = (event) => {
            let data = JSON.parse(event.data);

            for(let i = 0, len = this.callbacks.length; i < len; ++i){
                this.callbacks[i](data);
            }

            this.callbacks.length = 0;
            this.rc(data);
        };

        socket.onerror = (e) => {
            console.error(e);
        };

        this.socket = socket;
    }

    static get instance() {
        if (!DataManager.instanceObject) {
            DataManager.instanceObject = new DataManager();
        }
        return DataManager.instanceObject;
    }

    send(data: object, callbacks?: (data: object) => void | Array<(data: object) => void>) {  
        if (this.socket.readyState === 1) {
            if(Array.isArray(callbacks))
                for(let c of callbacks)
                    this.callbacks.push(callbacks);
            else if (callbacks)
                this.callbacks.push(callbacks);
            this.socket.send(JSON.stringify(data)); 

        } else {
            setTimeout(() => {
                this.send(data, callbacks);
            }, 1000);
        }
    }
}