

module Parser {

    function parseVertex(tokens: string[], vertexBuffer: Float32Array, stats: GL.OBJstats, filled: number)
    {
        let x = Number(tokens[1]); 
        let y = Number(tokens[2]); 
        let z = Number(tokens[3]); 

        vertexBuffer[filled++] = Number(x);
        vertexBuffer[filled++] = Number(y);
        vertexBuffer[filled++] = Number(z);

        stats.min[0] = Math.min(stats.min[0], x);
        stats.min[1] = Math.min(stats.min[1], y);
        stats.min[2] = Math.min(stats.min[2], z);

        stats.max[0] = Math.max(stats.max[0], x);
        stats.max[1] = Math.max(stats.max[1], y);
        stats.max[2] = Math.max(stats.max[2], z);
    }

    function parseNormal(tokens: string[], normalBuffer: Float32Array, filled: number)
    {
        normalBuffer[filled++] = Number(tokens[1]); 
        normalBuffer[filled++] = Number(tokens[2]); 
        normalBuffer[filled++] = Number(tokens[3]); 
    }

    function copyVertexToEnd(vertexBuffer: Array<number>, vertexID: number)
    {
        let startID = vertexID * 3;
        let newVertexID = vertexBuffer.length / 3;
        vertexBuffer.push(vertexBuffer[startID], vertexBuffer[startID + 1], vertexBuffer[startID + 2]);
        return newVertexID;
    }

    function setupNormal(vertexIDs: number[], vertexBuffer: Float32Array)
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

    function countPrimitives(lines: string[]) {
        let vertices = 0;
        let normals = 0;
        let triangles = 0;

        for(let line of lines) {
            let tokens = line.split(" ");
            let type = tokens[0];

            if (type === "v")
                vertices++;

            if (type === "vn")
                normals++;

            if (type === "f")
                triangles += tokens.length - 3;
        }

        return {
            vertices: vertices,
            normals: normals,
            triangles: triangles
        };
    }

    function copyVector(bufferTo: Float32Array, bufferFrom: Float32Array, idTo: number, idFrom: number) {
        for(let i = 0; i < 3; ++i) {
            bufferTo[idTo * 3 + i] = bufferFrom[idFrom * 3 + i];
        }
    }

    function loadNoNormals(lines: string[], counts: { [name: string]: number }, storeIDs: boolean) {
        let rvert = new Float32Array(counts.vertices * 3);

        let stats = {
            min: [Infinity, Infinity, Infinity],
            max: [-Infinity, -Infinity, -Infinity]
        };

        let filled = 0;
        for(let line of lines) {
            let tokens = line.split(" ");
            if (tokens[0] === "v") {
                parseVertex(tokens, rvert, stats, filled);
                filled += 3;
            }
        }

        filled = 0;
        let vertices = new Float32Array(counts.triangles * 3 * 3);
        let normals = new Float32Array(counts.triangles * 3 * 3);
        let objects: Uint32Array | undefined;
        let idToObj: { [name: number]: string } | undefined;
        let objToId: { [name: string]: number } | undefined;

        if (storeIDs)
        {
            objects = new Uint32Array(counts.triangles * 3);
            idToObj = {};
            objToId = {};
        }
        
        let id = 0;
        for(let line of lines) {
            let tokens = line.split(" ");
            
            if (tokens[0] === "o" && storeIDs) {
                id++;
                idToObj[id] = tokens[1];
                objToId[tokens[1]] = id;
                //console.log(tokens);
            } else if (tokens[0] === "f") {
                let faceVertIds = Array<number>(tokens.length - 1);

                for(let i = 1; i < tokens.length; ++i)
                    faceVertIds[i - 1] = Number(tokens[i]) - 1;
                
                let faceIDs = [faceVertIds[0], 0, 0];

                //split face into triangles
                for(let i = 0; i < faceVertIds.length - 2; ++i) {
                    faceIDs[1] = faceVertIds[i + 1];
                    faceIDs[2] = faceVertIds[i + 2];
                    //console.log(faceIDs);

                    copyVector(vertices, rvert, filled, faceIDs[0]);
                    copyVector(vertices, rvert, filled + 1, faceIDs[1]);
                    copyVector(vertices, rvert, filled + 2, faceIDs[2]);
                    let normal = setupNormal(faceIDs, rvert);
                    copyVector(normals, normal, filled, 0);
                    copyVector(normals, normal, filled + 1, 0);
                    copyVector(normals, normal, filled + 2, 0);
                    
                    if (storeIDs)
                    {
                        objects[filled] = id;
                        objects[filled + 1] = id;
                        objects[filled + 2] = id;
                    }

                    filled += 3;
                }
            }
        }

        if (storeIDs) {
            return {
                vertices: vertices,
                normals: normals,
                objects: objects,
                idToObj: idToObj,
                objToId: objToId,
                stats: stats
            }
        } else {
            return {
                vertices: vertices,
                normals: normals,
                stats: stats
            }
        }
    }


    function loadWithNormals(lines: string[], counts: { [name: string]: number }, storeIDs: boolean) {
        let rvert = new Float32Array(counts.vertices * 3);
        let rnorm = new Float32Array(counts.normals * 3);

        let stats = {
            min: [Infinity, Infinity, Infinity],
            max: [-Infinity, -Infinity, -Infinity]
        };

        let filledVert = 0;
        let filledNorm = 0;

        for(let line of lines) {
            let tokens = line.split(" ");
            if (tokens[0] === "v") {
                parseVertex(tokens, rvert, stats, filledVert);
                filledVert += 3;
            } else if (tokens[0] === "vn") {
                parseNormal(tokens, rnorm, filledNorm)
                filledNorm += 3;
            }
        }

        let filled = 0;
        let vertices = new Float32Array(counts.triangles * 3 * 3);
        let normals = new Float32Array(counts.triangles * 3 * 3);
        let objects: Uint32Array | undefined;
        let idToObj: { [name: number]: string } | undefined;
        let objToId: { [name: string]: number } | undefined;

        if (storeIDs)
        {
            objects = new Uint32Array(counts.triangles * 3);
            idToObj = {};
            objToId = {};
        }
        
        let id = 0;
        for(let line of lines) {
            let tokens = line.split(" ");
            
            if (tokens[0] === "o" && storeIDs) {
                id++;
                idToObj[id] = tokens[1];
                objToId[tokens[1]] = id;

            } else if (tokens[0] === "f") {
                let faceVertIds = Array<number>(tokens.length - 1);
                let faceNormIds = Array<number>(tokens.length - 1);
                let missingNormal = false;

                for(let i = 1; i < tokens.length; ++i){
                    let vertIds = tokens[i].split("/");

                    faceVertIds[i - 1] = Number(vertIds[0]) - 1;
                    
                    if (vertIds.length == 3)
                        faceNormIds[i - 1] = Number(vertIds[vertIds.length - 1]) - 1;
                    else {
                        faceNormIds[i - 1] = -1;
                        missingNormal = true;
                    }
                }
                
                let triVertIDs = [faceVertIds[0], 0, 0];
                let triNormIDs = [faceNormIds[0], 0, 0];

                //split face into triangles
                for(let i = 0; i < faceVertIds.length - 2; ++i) {
                    triVertIDs[1] = faceVertIds[i + 1];
                    triVertIDs[2] = faceVertIds[i + 2];
                    triNormIDs[1] = faceNormIds[i + 1];
                    triNormIDs[2] = faceNormIds[i + 2];

                    copyVector(vertices, rvert, filled, triVertIDs[0]);
                    copyVector(vertices, rvert, filled + 1, triVertIDs[1]);
                    copyVector(vertices, rvert, filled + 2, triVertIDs[2]);

                    if (missingNormal)
                    {
                        let normal = setupNormal(triVertIDs, rvert);
                        copyVector(normals, normal, filled, 0);
                        copyVector(normals, normal, filled + 1, 0);
                        copyVector(normals, normal, filled + 2, 0);
                    } else {
                        copyVector(normals, rnorm, filled, triNormIDs[0]);
                        copyVector(normals, rnorm, filled + 1, triNormIDs[1]);
                        copyVector(normals, rnorm, filled + 2, triNormIDs[2]);
                    }
                    
                    if (storeIDs)
                    {
                        objects[filled] = id;
                        objects[filled + 1] = id;
                        objects[filled + 2] = id;
                    }

                    filled += 3;
                }
            }
        }

        if (storeIDs) {
            return {
                vertices: vertices,
                normals: normals,
                objects: objects,
                idToObj: idToObj,
                objToId: objToId,
                stats: stats
            }
        } else {
            return {
                vertices: vertices,
                normals: normals,
                stats: stats
            }
        }
    }


    export function parseOBJ(contents: string, storeIDs: boolean) {
        console.log("loading OBJ");
        const lines = contents.split("\n");
        const counts = countPrimitives(lines);
        console.log(counts);

        if (counts.normals == 0)
        {
            //normals have to be calculated manually
            return loadNoNormals(lines, counts, storeIDs);
        } else {
            return loadWithNormals(lines, counts, storeIDs);
        }
        
        /*let vertices = Array<number>();
        let normals = Array<number>();
        let objects = Array<number>();
        let elements = Array<number>();
        
        const lines = contents.split("\n");
        let triangles = 0;
        
        //load all vertices first
        for(let line of lines) {
            let tokens = line.split(" ");
            let type = tokens[0];
            
            if (type === "v")
                parseVertex(tokens, vertices, stats);

            if (type === "vn")
                parseNormal(tokens, normals);

            if (type === "f")
                triangles += countTriangles(tokens);
        }

        //mapping of object IDs in the scene onto json IDs
        let objectMap: { [name: number]: string }= {};
        let object = 0;
        
        //by now, all normals and vertices are loaded and stored
        if (normals.length == 0) {
            //no normals present in OBJ, have to be calculated manually
            let vertexUsed = new Array(vertices.length / 3).fill(false);
            normals = new Array(vertices.length).fill(0);

            for(let line of lines) {
                let tokens = line.split(" ");
                let type = tokens[0];
                
                if (type === "f") {
                    parseFaceNoNormals(tokens, vertices, elements, normals, objects, vertexUsed, object);
                } else if (type === "o") {
                    object++;
                    objectMap[object] = tokens[1];
                }
            }

        } else if (normals.length == vertices.length) {
            //we have the same abount of vertices and normals, 
            //there is a chance that the indices will match
            console.log("same");

            
        }





        return {
            vertices: new Float32Array(vertices),
            elements: new Int32Array(elements),
            normals: new Float32Array(normals),
            objects: new Uint32Array(objects),
            objectMap: objectMap,
            stats: stats
        };*/
    }
    
    export function parseJson(contents: string) {
        return false;
    }
}