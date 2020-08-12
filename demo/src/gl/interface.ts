interface OBJstats {
    min : number[],
    max : number[]
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
    vertices: Float32Array
}


interface BoxModelInterface {
    min: number[],
    max: number[]
}


interface GLProgramList {
    building: BuildingProgram,
    terrain: TerrainProgram,
    box: BoxProgram,
    pick: PickProgram,
    street: StreetProgram
}