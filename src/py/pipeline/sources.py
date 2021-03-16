import json
import uuid
from typing import List

import numpy as np
from cjio.cityjson import CityJSON
from cjio.models import CityObject
from meshio import Mesh

from pipeline.geometry import MetaGeometry
import pipeline.elements



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
                    gtype = pipeline.elements.MetaPoints.gtype

                elif gtype.lower() == 'multilinestring':
                    for line in geom['boundaries']:
                        self._processLine(line, vnp, vertices)
                    gtype = pipeline.elements.MetaLines.gtype

                elif gtype.lower() == 'multisurface' or gtype.lower() == 'compositesurface':
                    for face in geom['boundaries']:
                        self._processFace(cj, face, vnp, vertices)
                    gtype = pipeline.elements.MetaObject.gtype

                elif gtype.lower() == 'solid':
                    for shell in geom['boundaries']:
                        for face in shell:
                            self._processFace(cj, face, vnp, vertices)
                    gtype = pipeline.elements.MetaObject.gtype

                elif gtype.lower() == 'multisolid' or gtype.lower() == 'compositesolid':
                    for solid in geom['boundaries']:
                        for shell in solid:
                            for face in shell:
                                self._processFace(cj, face, vnp, vertices)
                    gtype = pipeline.elements.MetaObject.gtype

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
            self._addGeometry(objID, '', pipeline.elements.MetaObject.gtype, triangles)


    def getGeometry(self, objID, gtype):
        """Returns array of vertices for supplied gtype and objectID

        Args:
            objID (string): objectID in self.objects dictionary
            gtype (string): geometry type

        Returns:
            List[MetaGeometry]: List of MetaGeometry classes
        """
        geometries: List[MetaGeometry] = []

        if gtype not in self.geometry:
            return geometries

        if objID not in self.geometry[gtype]:
            return geometries
         
        geometries = self.geometry[gtype][objID]
        return geometries


    def getObject(self, ID):
        if ID not in self.objects:
            return {}
        return self.objects[ID]
