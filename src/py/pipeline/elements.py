from typing import List

from cjio.models import CityObject
from meshio import Mesh

from pipeline.geometry import bboxForBBoxes
import pipeline.sources


class MetaElement:
    def __init__(self, ID: str, source):
        self.id = ID
        self.source = source
        self.style = {}

    @property
    def meta(self):
        obj = self.source.getObject(self.id)

        if isinstance(obj, CityObject):
            return obj.attributes
        elif isinstance(obj, dict):
            return obj
        return {}


    @property
    def geometry(self):
        return self.source.getGeometry(self.id, self.gtype)


    @property
    def bbox(self):
        g: pipeline.sources.MetaGeometry
        bboxes = [ g.bbox for g in self.geometry ]
        return bboxForBBoxes(bboxes)


    @property
    def index(self):
        return 0, self.source.idToIdx[self.id]


    @property
    def objID(self):
        return 0, self.id



class MetaObject(MetaElement):
    gtype = 'object'

    def __init__(self, ID, source):
        super().__init__(ID, source)
        

class MetaArea(MetaElement):
    gtype = 'area'

    def __init__(self, ID, source):
        super().__init__(ID, source)


class MetaLines(MetaElement):
    gtype = 'lines'

    def __init__(self, ID, source):
        super().__init__(ID, source)


class MetaPoints(MetaElement):
    gtype = 'points'

    def __init__(self, ID, source):
        super().__init__(ID, source)

