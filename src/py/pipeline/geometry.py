import enum
from typing import List

import numpy as np

def bboxToDict(bbox):
    return {
            'min': bbox[0].tolist(),
            'max': bbox[1].tolist()
        }


def AoutsideB(lowerA, upperA, lowerB, upperB):
    return lowerB > upperA or lowerA > upperB


def AinsideB(lowerA, upperA, lowerB, upperB):
    return lowerB <= lowerA and upperA <= upperB


class BBoxPosition(enum.Enum):
    inside = 1
    outside = 2
    crossing = 3


def bboxPosition(parentBBox, childBBox):
    status = BBoxPosition.inside
    
    for dim in range(3):
        lA, uA, lB, uB = childBBox[0][dim], childBBox[1][dim], parentBBox[0][dim], parentBBox[1][dim]
        
        if AoutsideB(lA, uA, lB, uB):
            return BBoxPosition.outside
        elif AinsideB(lA, uA, lB, uB):
            continue
        else: #A crossing B
            status = BBoxPosition.crossing

    return status


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


def bboxForVertices(vertices: np.ndarray):
    return np.array([np.amin(vertices, axis=0), np.amax(vertices, axis=0)])


def bboxForBBoxes(bboxes: List[np.ndarray]):
    vertices = np.concatenate(bboxes)
    vertices = vertices.flatten()
    vertices = vertices.reshape((vertices.shape[0] // 3, 3))
    bbox = bboxForVertices(vertices)
    return bbox


class MetaGeometry:
    def __init__(self, tag, geometry: np.ndarray):
        self.tag = tag
        self.geometry = geometry

    @property
    def bbox(self):
        return bboxForVertices(self.geometry)


def switchAxis(geometries: List[MetaGeometry], srcAxis, destAxis):
    srcIdx = ["x", "y", "z"].index(srcAxis)
    destIdx = ["x", "y", "z", "-x", "-y", "-z"].index(destAxis) % 3

    negate = (len(destAxis) == 2) 

    g: MetaGeometry
    for g in geometries:
        g.geometry[:, [srcIdx, destIdx]] = g.geometry[:, [destIdx, srcIdx]]
        if negate:
            g.geometry[:, destIdx] = -g.geometry[:, destIdx] 