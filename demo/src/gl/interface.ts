interface Indexable<T> {
    [ids: number]: T
}

interface OBJstats {
    min : Indexable<number>,
    max : Indexable<number>
}

interface F32OBJstats extends OBJstats {
    min : Float32Array,
    max : Float32Array
}

interface CityModelInterface {
    vertices: Float32Array,
    normals: Float32Array,
    objects: Uint32Array,
    idToObj: { [name: number]: string },
    objToId: { [name: string]: number },
    stats: OBJstats
}

interface TerrainModelInterface {
    vertices: Float32Array,
    normals: Float32Array,
    stats: OBJstats
}

interface StreetModelInterface {
    lineVertices: Float32Array
}


interface PathModelInterface {
    vertices: Float32Array,
    times: Float32Array
}


interface BoxModelInterface {
    min: Indexable<number>,
    max: Indexable<number>
}


interface GLProgramList {
    building: BuildingProgram,
    terrain: TerrainProgram,
    box: BoxProgram,
    pick: PickProgram,
    street: StreetProgram,
    path: PathProgram
}

interface TextureInterface {
    data: string,
    width: number,
    height: number
}