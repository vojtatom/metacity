

module Parser {

    function parseVertex(tokens: string[], vertexBuffer: Array<number>, stats: GL.OBJstats)
    {
        let x = Number(tokens[1]); 
        let y = Number(tokens[2]); 
        let z = Number(tokens[3]); 
        vertexBuffer.push(Number(x), Number(y), Number(z));

        stats.min[0] = Math.min(stats.min[0], x);
        stats.min[1] = Math.min(stats.min[1], y);
        stats.min[2] = Math.min(stats.min[2], z);

        stats.max[0] = Math.max(stats.max[0], x);
        stats.max[1] = Math.max(stats.max[1], y);
        stats.max[2] = Math.max(stats.max[2], z);
    }

    function copyVertexToEnd(vertexBuffer: Array<number>, vertexID: number)
    {
        let startID = vertexID * 3;
        let newVertexID = vertexBuffer.length / 3;
        vertexBuffer.push(vertexBuffer[startID], vertexBuffer[startID + 1], vertexBuffer[startID + 2]);
        return newVertexID;
    }

    function setupNormal(vertexIDs: number[], vertexBuffer: Array<number>)
    {
        let vs: Vec3Array[] = [];
        
        for (let id of vertexIDs) {
            let rid = 3 * id;
            vs.push(glMatrix.vec3.fromValues(vertexBuffer[rid], vertexBuffer[rid + 1], vertexBuffer[rid + 2]));
        }

        let a = glMatrix.vec3.sub(glMatrix.vec3.create(), vs[2], vs[0]);
        let b = glMatrix.vec3.sub(glMatrix.vec3.create(), vs[1], vs[0]);
        let normal = glMatrix.vec3.create();

        return glMatrix.vec3.normalize(normal, glMatrix.vec3.cross(normal, a, b));
    }

    function parseFace(tokens: string[], vertexBuffer: Array<number>, elementBuffer: Array<number>, normalBuffer: Array<number>, 
                       objBuffer:Array<number>, vertexUsed: Array<boolean>, objectID: number)
    {
        if (tokens.length != 4)
        {
            console.log(tokens);
            throw "Encountered non-triangular face";
        }

        //sub 1 since OBJ indices are 1-based
        let a = Number(tokens[1]) - 1;
        let b = Number(tokens[2]) - 1;
        let c = Number(tokens[3]) - 1;
        let vertexIDs = [a, b, c];

        //check for cuplicates and set objectID
        for(let i = 0; i < 3; ++i) {
            if (vertexUsed[vertexIDs[i]]) {
                vertexIDs[i] = copyVertexToEnd(vertexBuffer, vertexIDs[i]);
                normalBuffer.push(0, 0, 0);
                objBuffer.push(objectID);
            } else {
                objBuffer[vertexIDs[i]] = objectID;
            }

            vertexUsed[vertexIDs[i]] = true;
        }

        //add checked element IDs
        elementBuffer.push(...vertexIDs);
        
        //setup normals
        let normal = setupNormal(vertexIDs, vertexBuffer);

        for(let id of vertexIDs) {
            let rid = 3 * id;
            for(let i = 0; i < 3; ++i) {
                normalBuffer[rid + i] = normal[i];
            }
        }
    }


    export function parseOBJ(contents: string) {
        console.log("loading OBJ");

        let stats = {
            min: [Infinity, Infinity, Infinity],
            max: [-Infinity, -Infinity, -Infinity],
        };

        
        let vertices = Array<number>();
        let normals = Array<number>();
        let objects = Array<number>();
        let elements = Array<number>();
        
        const lines = contents.split("\n");
        let vertexUsed = [];
        
        //load all vertices first
        for(let line of lines) {
            let tokens = line.split(" ");
            let type = tokens[0];
            
            if (type === "v")
            {
                parseVertex(tokens, vertices, stats);
                vertexUsed.push(false);
                normals.push(0, 0, 0);
                objects.push(0);
            }
        }

        //mapping of object IDs in the scene onto json IDs
        let objectMap: { [name: number]: string }= {};
        let object = 0;

        //parse objects and faces
        for(let line of lines) {
            let tokens = line.split(" ");
            let type = tokens[0];
            
            if (type === "f")
            {
                parseFace(tokens, vertices, elements, normals, objects, vertexUsed, object);
            }
            else if (type === "o")
            {
                object++;
                objectMap[object] = tokens[1];
            }
        }


        return {
            vertices: new Float32Array(vertices),
            elements: new Int32Array(elements),
            normals: new Float32Array(normals),
            objects: new Uint32Array(objects),
            objectMap: objectMap,
            stats: stats
        };
    }
    
    export function parseJson(contents: string) {
        return false;
    }
}