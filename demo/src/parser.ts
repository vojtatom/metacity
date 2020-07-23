

module Parser {


    function parseVertex(tokens: string[], vertexBuffer: Array<number>)
    {
        vertexBuffer.push(Number(tokens[1]));
        vertexBuffer.push(Number(tokens[2]));
        vertexBuffer.push(Number(tokens[3]));
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
        console.log("loading OBJ")
        console.log(contents);

        let vertices = Array<number>();
        let elements = Array<number>();

        const lines = contents.split("\n");
        
        for(let line of lines) {
            let tokens = line.split(" ");
            let type = tokens[0];
            
            if (type === "v")
                parseVertex(tokens, vertices);
            else if (type === "f")
                parseFace(tokens, elements);
            else if (type === "o")
                parseObject(tokens);
        }

        return {
            vertices: new Float32Array(vertices),
            elements: new Int32Array(elements)
        };
    }
    
    export function parseJson(contents: string) {
        return false;
    }
}