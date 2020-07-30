

module GLGeometry {
    export function boxVertices(min: number[], max: number[]) {
        return new Float32Array([
            min[0], min[1], min[2],
            max[0], min[1], min[2],            
            max[0], min[1], min[2],
            max[0], max[1], min[2],            
            max[0], max[1], min[2],
            min[0], max[1], min[2],            
            min[0], max[1], min[2],
            min[0], min[1], min[2],
            min[0], min[1], max[2],
            max[0], min[1], max[2],            
            max[0], min[1], max[2],
            max[0], max[1], max[2],            
            max[0], max[1], max[2],
            min[0], max[1], max[2],            
            min[0], max[1], max[2],
            min[0], min[1], max[2],
            min[0], min[1], min[2],
            min[0], min[1], max[2],
            max[0], min[1], min[2],
            max[0], min[1], max[2],
            min[0], max[1], min[2],
            min[0], max[1], max[2],
            max[0], max[1], min[2],
            max[0], max[1], max[2],
        ])
    }
}