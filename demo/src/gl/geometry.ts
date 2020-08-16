

function boxVertices(min: Indexable<number>, max: Indexable<number>) {
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

/*function rescale3D(data: Float32Array, shift: Float32Array, scale: number) {
    for(let i = 0; i < data.length; i += 3) {
        data[i] = (data[i] + shift[0]) * scale;
        data[i + 1] = (data[i + 1] + shift[1]) * scale;
        data[i + 2] = (data[i + 2] + shift[2]) * scale;
    }
}

function rescale2D(data: Float32Array, shift: Float32Array, scale: number) {
    for(let i = 0; i < data.length; i += 2) {
        data[i] = (data[i] + shift[0]) * scale;
        data[i + 1] = (data[i + 1] + shift[1]) * scale;
    }
}*/