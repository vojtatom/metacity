

module Parser {
    export function toFloat32(data: string){
		let blob = window.atob(data);
        
        let len = blob.length / Float32Array.BYTES_PER_ELEMENT;
        let view = new DataView(new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT));
        let array = new Float32Array(len);

        for (let p = 0; p < len * 4; p = p + 4) {
            view.setUint8(0, blob.charCodeAt(p));
            view.setUint8(1, blob.charCodeAt(p + 1));
            view.setUint8(2, blob.charCodeAt(p + 2));
            view.setUint8(3, blob.charCodeAt(p + 3));
            array[p / 4] = view.getFloat32(0, true);
        }
        view = null;

        blob = null;
		return array;
    }

    export function toUint32(data: string){
		let blob = window.atob(data);
        
        let len = blob.length / Uint32Array.BYTES_PER_ELEMENT;
        let view = new DataView(new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT));
        let array = new Uint32Array(len);

        for (let p = 0; p < len * 4; p = p + 4) {
            view.setUint8(0, blob.charCodeAt(p));
            view.setUint8(1, blob.charCodeAt(p + 1));
            view.setUint8(2, blob.charCodeAt(p + 2));
            view.setUint8(3, blob.charCodeAt(p + 3));
            array[p / 4] = view.getUint32(0, true);
        }
        view = null;

        blob = null;
		return array;
    }
}