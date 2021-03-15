from cjio.models import CityObject
from cjio.cityjson import CityJSON
import numpy as np
from typing import List
import json
import base64
import uuid
import geometry
from meshio import Mesh

from comms import printOK


def progress(data, callback):
    if callable(callback):
        progressID = str(uuid.uuid4())
        total = len(data)
        status = 0
        lastUpdate = -1
        for i, d in enumerate(data):
            status = (i / total) * 100
            yield d
            if status - lastUpdate > 1:
                callback(int(status + 1), progressID)
                lastUpdate = status
    else:
        return data
        

class MetaGeometry:
    def __init__(self, tag, geometry):
        self.tag = tag
        self.geometry = geometry


class MetaSource:
    staticID = 0

    def __init__(self):
        self.geometry = {}
        
        self.id = MetaSource.staticID
        MetaSource.staticID += 1
        self.objID = 0

        self.idxToId = {}
        self.idToIdx = {}
        self.objects = {} #dictionary with IDs


    def _addGeometry(self, objID, gtag, gtype, geom):
        if gtype not in self.geometry:
            self.geometry[gtype] = {}

        if objID not in self.geometry[gtype]:
            self.geometry[gtype][objID] = []
         
        self.geometry[gtype][objID].append(MetaGeometry(gtag, geom)) 


    def _processFace(self, cj: CityJSON, face, invertices, triangles):
        re, b, n = cj.triangulate_face(face, invertices)
        if b == True:
            for t in re:
                triangles.extend((invertices[t[0]], invertices[t[1]], invertices[t[2]]))


    def _processPoints(self, points, invertices, outvertices):
        for p in points:
            outvertices.append(invertices[p])

    
    def _processLine(self, line, invertices, outvertices):
        for p, q in zip(line, line[1]):
            outvertices.append(invertices[p], invertices[q])


    def _updateIndex(self, ID):
        if ID not in self.idToIdx:
            idx = self.objID
            self.objID += 1
            self.idToIdx[ID] = idx
            self.idxToId[idx] = ID 


    def fromCityJSON(self, cj: CityJSON, types: List[str], lods: List[int], progressCall=None):
        vnp = np.array(cj.j["vertices"])

        #start with the CO
        for objID in progress(cj.j['CityObjects'], progressCall):
            if cj.j['CityObjects'][objID]['type'] not in types:
                continue

            self._updateIndex(objID)

            #for each geometry/LOD
            for geom in cj.j['CityObjects'][objID]['geometry']:
                vertices, gtype = [], geom['type']

                if geom["lod"] not in lods:
                    continue

                if gtype.lower() == 'multipoint':
                    self._processPoints(geom['boundaries'], vnp, vertices)
                    gtype = MetaPoints.gtype

                elif gtype.lower() == 'multilinestring':
                    for line in geom['boundaries']:
                        self._processLine(line, vnp, vertices)
                    gtype = MetaLines.gtype

                elif gtype.lower() == 'multisurface' or gtype.lower() == 'compositesurface':
                    for face in geom['boundaries']:
                        self._processFace(cj, face, vnp, vertices)
                    gtype = MetaObject.gtype

                elif gtype.lower() == 'solid':
                    for shell in geom['boundaries']:
                        for face in shell:
                            self._processFace(cj, face, vnp, vertices)
                    gtype = MetaObject.gtype

                elif gtype.lower() == 'multisolid' or gtype.lower() == 'compositesolid':
                    for solid in geom['boundaries']:
                        for shell in solid:
                            for face in shell:
                                self._processFace(cj, face, vnp, vertices)
                    gtype = MetaObject.gtype

                self._addGeometry(objID, geom["lod"], gtype, np.array(vertices))
        
        # TODO maybe change this to a localy constructed object with known structure? 
        self.objects = cj.get_cityobjects(type=types)


    def fromSTL(self, mesh: Mesh, progressCall=None):
        for objID, c in enumerate(progress(mesh.cells, progressCall)):
            if c.type != "triangle":
                raise Exception("Encountered non-triangular faces while parsing STL")

            self._updateIndex(objID)

            indices = c.data.flatten()
            triangles = mesh.points[indices]
            self._addGeometry(objID, '', MetaObject.gtype, triangles)


    def getGeometry(self, objID, gtype):
        """Returns array of vertices for supplied gtype and objectID

        Args:
            objID (string): objectID in self.objects dictionary
            gtype (string): geometry type

        Returns:
            np.array: array of vertices
        """
        if gtype not in self.geometry:
            return None

        if objID not in self.geometry[gtype]:
            return None
         
        geometries: List[MetaGeometry]
        geometries = self.geometry[gtype][objID]
        return geometries


    def getObject(self, ID):
        if ID not in self.objects:
            return None
        return self.objects[ID]



class MetaElement:
    def __init__(self, ID: str, source: MetaSource):
        self.id = ID
        self.source = source


    def getMeta(self):
        obj = self.source.getObject(self.id)

        if isinstance(obj, CityObject):
            return obj.attributes
        elif isinstance(obj, dict):
            return obj
        return {}


    def getGeometry(self):
        geometries = self.source.getGeometry(self.id, self.gtype)

        if geometries is None:
            return None

        if len(geometries) > 1:
            pass
            #raise Exception("Objects with more than one geometry not yet supported (multiple LoDs or multiple geometry objects))")

        return geometries[0].geometry

    
    def getBBox(self):
        return geometry.computeBBox(self.getGeometry())


    def getIndex(self):
        return self.source.id, self.source.idToIdx[self.id]


    def getID(self):
        return self.source.id, self.id


    def switchAxis(self, srcAxis, destAxis):
        printOK(srcAxis)
        printOK(destAxis)
        geometries = self.source.getGeometry(self.id, self.gtype)

        if geometries is None:
            return

        srcIdx = ["x", "y", "z"].index(srcAxis)
        destIdx = ["x", "y", "z", "-x", "-y", "-z"].index(destAxis) % 3

        negate = (len(destAxis) == 2) 
        printOK(srcIdx)
        printOK(destIdx)
        printOK(negate)

        geometry: MetaGeometry
        for geometry in geometries:
            printOK(geometry.geometry.shape)
            geometry.geometry[:, [srcIdx, destIdx]] = geometry.geometry[:, [destIdx, srcIdx]]
            if negate:
               geometry.geometry[:, destIdx] = -geometry.geometry[:, destIdx] 
        







class MetaObject(MetaElement):
    gtype = 'object'

    def __init__(self, ID, source):
        super().__init__(ID, source)
        self.style = {}
        

class MetaArea(MetaElement):
    gtype = 'area'

    def __init__(self, ID, source):
        super().__init__(ID, source)
        self.style = {}


class MetaLines(MetaElement):
    gtype = 'lines'

    def __init__(self, ID, source):
        super().__init__(ID, source)
        self.style = {}


class MetaPoints(MetaElement):
    gtype = 'points'

    def __init__(self, ID, source):
        super().__init__(ID, source)
        self.style = {}



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

        for o in objects:
            self._processObject(o)

        self.triangles = np.concatenate(self.triangles)
        self.idxL1 = np.concatenate(self.idxL1)
        self.idxL2 = np.concatenate(self.idxL2)

        self._computeBBox()
        self._computeNormals()


    def _updateMeta(self, idL1, idL2, mobject: MetaObject):
        if idL1 not in self.meta:
            self.meta[idL1] = {}

        if idL2 not in self.meta[idL1]:
            self.meta[idL1][idL2] = mobject.getMeta()


    def  _updateIndex(self, idL1, idL2, idxL1, idxL2):
        if idL1 not in self.idToIdx:
            self.idToIdx[idL1] = {}
            self.idxToId[idxL1] = {}

        if idL2 not in self.idToIdx[idL1]:
            self.idToIdx[idL1][idL2] = [idxL1, idxL2]
            self.idxToId[idxL1][idxL2] = [idL1, idL2]


    def _processObject(self, mobject: MetaObject):
        idL1, idL2 = mobject.getID()
        idxL1, idxL2 = mobject.getIndex()
        geometry = mobject.getGeometry()
        
        if geometry is None:
            return

        nvert = geometry.shape[0]
        self._updateMeta(idL1, idL2, mobject)
        self._updateIndex(idL1, idL2, idxL1, idxL2)
        self.triangles.append(geometry.flatten())
        self.idxL1.append(np.full((nvert,), idxL1))
        self.idxL2.append(np.full((nvert,), idxL2)) 


    def _computeBBox(self):
        nvert = self.triangles.shape[0] // 3
        vertices = self.triangles.reshape((nvert, 3))
        self.bbox = geometry.computeBBox(vertices)


    def _computeNormals(self):
        ntri =  self.triangles.shape[0] // 9
        faces = self.triangles.reshape((ntri, 3, 3))
        normals = geometry.computeNormals(faces)
        self.normals = normals.flatten()

    
    def flipNormals(self):
        nnorm = self.normals.shape[0] // 3
        normals = geometry.flipNormals(self.normals.reshape((nnorm, 3)))
        self.normals = normals.flatten()


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
            "bbox": geometry.bboxToDict(self.bbox)
        }


    def toJSON(self):
        return json.dumps(self.toDict())