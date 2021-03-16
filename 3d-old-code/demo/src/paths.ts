

module Path {

    function randomProperty(obj: {[node: string]: string[]}) {
        let keys = Object.keys(obj);
        return keys[ keys.length * Math.random() << 0];
    };

    
    function randomElement(array: string[], exclude?: string) {
        if ((array.length == 0) || (array.length == 1 && array[0] === exclude))
            return null;
        
        let pick;
        do {
            pick = array[Math.floor(Math.random() * array.length)];
        } while(exclude === pick)

        return pick;
    }

    function dist(a: Float32Array, b: Float32Array) {
        let accu = 0;
        let dis: number;
        for(let i = 0; i < a.length; ++i) {
            dis = (b[i] - a[i]);
            accu += dis * dis;
        }
        return Math.sqrt(accu);
    }

    export function cropGraph(graph: {[node: string]: string[]}, low: Float32Array, high: Float32Array) {
        let nodef32: Float32Array;
        
        for (let node in graph) {
            nodef32 = Parser.toFloat32(node);

            for(let i = 0; i < nodef32.length; ++i) {
                if (nodef32[i] < low[i] || nodef32[i] > high[i])
                    delete graph[node];
            }
        
        }

        for(let node in graph) {
            for(let i = node.length - 1; i >= 0; --i) {
                if (!(graph[node][i] in graph))
                    graph[node].splice(i, 1);
            }
        }
    }

    
    export function randomPath(graph: {[node: string]: string[]}, length: number,
                               vertices: Float32Array, times: Float32Array, offset: number) {

        let node = randomProperty(graph);
        let dim = Parser.toFloat32(node).length;
        let toffset = offset / dim;
        let t = 0;

        let prev_node: string;
        let next_node: string;
        let nodef32: Float32Array;
        let next_nodef32: Float32Array;

        prev_node = node;
        nodef32 = Parser.toFloat32(node);

        for(let i = 0; i < length; ++i) {
            next_node = randomElement(graph[node], prev_node);
            
            if (!next_node)
            return offset;
            
            for (let j = 0; j < dim; ++j)
                vertices[offset++] = nodef32[j];
            times[toffset++] = t;

            next_nodef32 = Parser.toFloat32(next_node);
            t += dist(nodef32, next_nodef32);
            
            for (let j = 0; j < dim; ++j)
                vertices[offset++] = next_nodef32[j];
            times[toffset++] = t;

            prev_node = node;
            node = next_node;
            nodef32 = next_nodef32;
        }

        return offset;
    }


}