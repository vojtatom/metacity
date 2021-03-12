from cjio import cityjson
from cjio.cityjson import CityJSON
from cjio.models import CityObject
from pprint import pprint
import numpy as np
from tqdm import tqdm
import json
from typing import List
import base64


class MetaSource:
    staticID = 0

    def __init__(self):
        self.lod1 = {}
        self.lod2 = {}
        self.lod3 = {}
        self.lod4 = {}
        self.lod5 = {}
        self.lods = [self.lod1, self.lod2, self.lod3, self.lod4, self.lod5]
        
        self.id = MetaSource.staticID
        MetaSource.staticID += 1
        self.objID = 0

        self.idxToId = {}
        self.idToIdx = {}
        self.objects = {}


    def _addGeometry(self, objID, lod, geom, gtype):
        if gtype not in self.lods[lod]:
            self.lods[lod][gtype] = {}

        if objID not in self.lods[lod][gtype]:
            self.lods[lod][gtype][objID] = []
         
        self.lods[lod][gtype][objID].append(geom)   


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


    def fromCityJSON(self, cj: CityJSON, types: List[str]):
        vnp = np.array(cj.j["vertices"])

        #-- start with the CO
        for objID in tqdm(cj.j['CityObjects']):
            if cj.j['CityObjects'][objID]['type'] not in types:
                continue

            self._updateIndex(objID)

            #for each geometry/LOD
            for geom in cj.j['CityObjects'][objID]['geometry']:
                vertices, gtype = [], geom['type']

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

                self._addGeometry(objID, geom["lod"], np.array(vertices), gtype)

        
        self.objects = cj.get_cityobjects(type=types)


    def getGeometry(self, objID, lod, gtype):
        if gtype not in self.lods[lod]:
            return None

        if objID not in self.lods[lod][gtype]:
            return None
         
        return self.lods[lod][gtype][objID]


    def getObject(self, ID):
        if ID not in self.objects:
            return None
        return self.objects[ID]



class MetaElement:
    def __init__(self, ID: str, source: MetaSource, lod: int):
        self.id = ID
        self.lod = lod
        self.source = source


    def getMeta(self):
        obj = self.source.getObject(self.id)

        if isinstance(obj, CityObject):
            return obj.attributes
        elif isinstance(obj, dict):
            return obj
        return {}


    def getGeometry(self, lod: int):
        return self.source.getGeometry(self.id, self.lod, self.gtype)


    def getIndex(self):
        return self.source.id, self.source.idToIdx[self.id]


    def getID(self):
        return self.source.id, self.id


class MetaObject(MetaElement):
    gtype = 'object'

    def __init__(self, ID, source, lod):
        super().__init__(ID, source, lod)
        self.style = {}
        

class MetaArea(MetaElement):
    gtype = 'area'

    def __init__(self, ID, source, lod):
        super().__init__(ID, source, lod)
        self.style = {}


class MetaLines(MetaElement):
    gtype = 'lines'

    def __init__(self, ID, source, lod):
        super().__init__(ID, source, lod)
        self.style = {}


class MetaPoints(MetaElement):
    gtype = 'points'

    def __init__(self, ID, source, lod):
        super().__init__(ID, source, lod)
        self.style = {}



class MetaLayer:
    def __init__(self, lod):
        self.lod = lod


    @staticmethod
    def serialize_array(array, dtype):
        a = np.ascontiguousarray(dtype(array), dtype=dtype)
        a = base64.b64encode(a.data)
        return a.decode('utf-8')


def normalize(arr):
    ''' Normalize a numpy array of 3 component vectors shape=(n,3) '''
    lens = np.sqrt( arr[:,0]**2 + arr[:,1]**2 + arr[:,2]**2 )
    arr[:,0] /= lens
    arr[:,1] /= lens
    arr[:,2] /= lens                
    return arr



class MetaObjectLayer(MetaLayer):
    def __init__(self, lods: List[int], objects: List[MetaObject]):
        super().__init__(lod)
        
        self.triangles = []
        self.normals = []
        self.idxL1 = []
        self.idxL2 = []
        self.lods = lods

        self.meta = {}
        self.idxToId = {}
        self.idToIdx = {}

        for o in objects:
            self._processObject(o)

        self.triangles = np.concatenate(self.triangles)
        self.idxL1 = np.concatenate(self.idxL1)
        self.idxL2 = np.concatenate(self.idxL2)

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
        if mobject.lod not in self.lods:
            return

        idL1, idL2 = mobject.getID()
        idxL1, idxL2 = mobject.getIndex()
        geometry = mobject.getGeometry(mobject.lod)
        
        if geometry == None:
            return

        if len(geometry) >  1:
            vertices = np.concatenate(geometry)
        else:
            vertices = geometry[0]
        nvert = vertices.shape[0]


        self._updateMeta(idL1, idL2, mobject)
        self._updateIndex(idL1, idL2, idxL1, idxL2)
        self.triangles.append(vertices.flatten())
        self.idxL1.append(np.full((nvert,), idxL1))
        self.idxL2.append(np.full((nvert,), idxL2)) 


    def _computeNormals(self):
        ntri =  self.triangles.shape[0] // 9
        faces = self.triangles.reshape((ntri, 3, 3))

        normals = np.cross(faces[::,1] - faces[::,0], faces[::,2] - faces[::,0])
        normalize(normals)
        normals = np.repeat(normals, 3, axis=0)
        self.normals = normals.flatten()


    def toJSON(self):
        return json.dumps({
            "triangles":  self.serialize_array(self.triangles, dtype=np.float32),
            "normals": self.serialize_array(self.normals, dtype=np.float32),
            "idxL1": self.serialize_array(self.idxL1, dtype=np.uint32),
            "idxL2": self.serialize_array(self.idxL2, dtype=np.uint32),
            "lod": self.lod,
            "meta": self.meta,
            "idToIdx": self.idToIdx,
            "idxToId": self.idxToId
        })







cj = cityjson.load("/home/vojtatom/Documents/cityvis/bubny_3D/bubny_bud.json")
objects = cj.number_city_objects()

types = ["Building", "BuildingPart", "BuildingInstallation"]

source = MetaSource()
source.fromCityJSON(cj, types)

objects = []
area = []
lines = []
points = []

for ilod, lod in enumerate(source.lods):
    for gtype, entries in lod.items():
        for ID in entries:
            if gtype == MetaObject.gtype:
                objects.append(MetaObject(ID, source, ilod))
            elif gtype == MetaArea.gtype:
                area.append(MetaArea(ID, source, ilod))
            elif gtype == MetaLines.gtype:
                lines.append(MetaLines(ID, source, ilod))
            elif gtype == MetaPoints.gtype:
                points.append(MetaPoints(ID, source, ilod))


layer = MetaObjectLayer([2, 3], objects)

with open("city.json", "w") as file:
    file.write(layer.toJSON())





