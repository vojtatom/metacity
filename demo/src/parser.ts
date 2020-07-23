

module Parser {

    function parseVertex(tokens: string[], vertexBuffer: Array<number>, stats: GL.OBJstats)
    {
        let x = Number(tokens[1]); 
        let y = Number(tokens[2]); 
        let z = Number(tokens[3]); 
        vertexBuffer.push(Number(x));
        vertexBuffer.push(Number(y));
        vertexBuffer.push(Number(z));

        stats.min[0] = Math.min(stats.min[0], x);
        stats.min[1] = Math.min(stats.min[1], y);
        stats.min[2] = Math.min(stats.min[2], z);

        stats.max[0] = Math.max(stats.max[0], x);
        stats.max[1] = Math.max(stats.max[1], y);
        stats.max[2] = Math.max(stats.max[2], z);
    }

    function parseFace(tokens: string[], elementBuffer: Array<number>)
    {
        if (tokens.length != 4)
        {
            console.log(tokens);
            throw "Encountered non-triangular face";
        }

        //sub 1 since OBJ indices are 1-based
        elementBuffer.push(Number(tokens[1]) - 1);
        elementBuffer.push(Number(tokens[2]) - 1);
        elementBuffer.push(Number(tokens[3]) - 1);
    }

    function parseObject(tokens: string[])
    {
        //TODO json check
    }


    export function parseOBJ(contents: string) {
        console.log("loading OBJ");

        let stats = {
            min: [Infinity, Infinity, Infinity],
            max: [-Infinity, -Infinity, -Infinity],
        };

        let vertices = Array<number>();
        let elements = Array<number>();

        const lines = contents.split("\n");
        
        for(let line of lines) {
            let tokens = line.split(" ");
            let type = tokens[0];
            
            if (type === "v")
                parseVertex(tokens, vertices, stats);
            else if (type === "f")
                parseFace(tokens, elements);
            else if (type === "o")
                parseObject(tokens);
        }

        return {
            vertices: new Float32Array(vertices),
            elements: new Int32Array(elements),
            stats: stats
        };
    }
    
    export function parseJson(contents: string) {
        return false;
    }
}