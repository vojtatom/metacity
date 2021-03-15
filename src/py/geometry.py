import numpy as np
import enum


def computeBBox(vertices):
    return np.array([np.amin(vertices, axis=0), np.amax(vertices, axis=0)])


def bboxToDict(bbox):
    return {
            'min': bbox[0].tolist(),
            'max': bbox[1].tolist()
        }


def AoutsideB(lowerA, upperA, lowerB, upperB):
    return lowerB > lowerA or lowerA > upperB


def AinsideB(lowerA, upperA, lowerB, upperB):
    return lowerB <= lowerA and upperA <= upperB


class BBoxPosition(enum.Enum):
    inside = 1
    outside = 2
    crossing = 3

def testBBoxPosition(parentBBox, childBBox):
    score = 0
    
    for dim in range(3):
        lA, uA, lB, uB = childBBox[0][dim], childBBox[1][dim], parentBBox[0][dim], parentBBox[1][dim]
        if AoutsideB(lA, uA, lB, uB):
            score += 40
        elif AinsideB(lA, uA, lB, uB):
            score += 0
        else: #A crossing B
            score += 10

    if score >= 40:
        return BBoxPosition.outside
    elif score >= 10:
        return BBoxPosition.crossing
    else:
        return BBoxPosition.inside


def normalize(arr):
    ''' Normalize a numpy array of 3 component vectors shape=(n,3) '''
    lens = np.sqrt( arr[:,0]**2 + arr[:,1]**2 + arr[:,2]**2 )
    arr[:,0] /= lens
    arr[:,1] /= lens
    arr[:,2] /= lens                
    return arr


def computeNormals(triangles):
    normals = np.cross(triangles[::,1] - triangles[::,0], triangles[::,2] - triangles[::,0])
    normalize(normals)
    normals = np.repeat(normals, 3, axis=0)
    return normals


def flipNormals(normals):
    normals[:, :] = -normals[:, :]
    return normals