import base64
import json
from typing import List

import numpy as np

from pipeline.geometry import bboxForVertices, computeNormals, bboxToDict
from pipeline.elements import MetaObject


class MetaLayer:
    def __init__(self):
        pass

    @staticmethod
    def serialize_array(array, dtype):
        a = np.ascontiguousarray(dtype(array), dtype=dtype)
        a = base64.b64encode(a.data)
        return a.decode('utf-8')


    def flipNormals(self):
        pass


class MetaObjectLayer(MetaLayer):
    def __init__(self, objects: List[MetaObject]):
        super().__init__()
        
        self.triangles = []
        self.normals = []
        self.idxL1 = []
        self.idxL2 = []
        self.bbox = np.array([
            np.array([np.inf, np.inf, np.inf], dtype=np.float32),
            np.array([-np.inf, -np.inf, -np.inf], dtype=np.float32)
            ])

        self.meta = {}
        self.idxToId = {}
        self.idToIdx = {}

        if len(objects) == 0:
            return

        for o in objects:
            self._processObject(o)

        self.triangles = np.concatenate(self.triangles)
        self.idxL1 = np.concatenate(self.idxL1)
        self.idxL2 = np.concatenate(self.idxL2)

        self._computeBBox()
        self._computeNormals()


    def shallowCopy(self):
        copy = MetaObjectLayer([])
        copy.triangles = self.triangles
        copy.normals = self.normals  
        copy.bbox = self.bbox
        copy.idxL1 = self.idxL1  
        copy.idxL2 = self.idxL2  
        copy.meta = self.meta  
        copy.idxToId = self.idxToId  
        copy.idToIdx = self.idToIdx  
        return copy


    def _updateMeta(self, idL1, idL2, mobject: MetaObject):
        if idL1 not in self.meta:
            self.meta[idL1] = {}

        if idL2 not in self.meta[idL1]:
            self.meta[idL1][idL2] = mobject.meta


    def  _updateIndex(self, idL1, idL2, idxL1, idxL2):
        if idL1 not in self.idToIdx:
            self.idToIdx[idL1] = {}
            self.idxToId[idxL1] = {}

        if idL2 not in self.idToIdx[idL1]:
            self.idToIdx[idL1][idL2] = [idxL1, idxL2]
            self.idxToId[idxL1][idxL2] = [idL1, idL2]


    def _processObject(self, mobject: MetaObject):
        idL1, idL2 = mobject.objID
        idxL1, idxL2 = mobject.index
        geometries = mobject.geometry
        
        for g in geometries:
            nvert = g.geometry.shape[0]
            self.triangles.append(g.geometry.flatten())
            self.idxL1.append(np.full((nvert,), idxL1))
            self.idxL2.append(np.full((nvert,), idxL2)) 

        self._updateMeta(idL1, idL2, mobject)
        self._updateIndex(idL1, idL2, idxL1, idxL2)


    def _computeBBox(self):
        nvert = self.triangles.shape[0] // 3
        vertices = self.triangles.reshape((nvert, 3))
        self.bbox = bboxForVertices(vertices)


    def _computeNormals(self):
        ntri =  self.triangles.shape[0] // 9
        faces = self.triangles.reshape((ntri, 3, 3))
        normals = computeNormals(faces)
        self.normals = normals.flatten()

    
    def flipNormals(self):
        copy = self.shallowCopy()
        copy.normals = -copy.normals
        return copy


    def toDict(self):
        return {
            "type": "objects",
            "triangles":  self.serialize_array(self.triangles, dtype=np.float32),
            "normals": self.serialize_array(self.normals, dtype=np.float32),
            "idxL1": self.serialize_array(self.idxL1, dtype=np.uint32),
            "idxL2": self.serialize_array(self.idxL2, dtype=np.uint32),
            "meta": self.meta,
            "idToIdx": self.idToIdx,
            "idxToId": self.idxToId,
            "bbox": bboxToDict(self.bbox)
        }


    def toJSON(self):
        return json.dumps(self.toDict())
