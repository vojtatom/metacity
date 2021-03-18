from typing import List

from metascript import MetaTypes, description, output, param
from pipeline.elements import MetaArea, MetaLines, MetaObject, MetaPoints
from pipeline.sources import MetaSource

from comms import printOK

@param('Source', MetaTypes.MetaSource)
@output('Objects', MetaTypes.MetaObjects)
@output('Areas', MetaTypes.MetaAreas)
@output('Lines', MetaTypes.MetaLines)
@output('Points', MetaTypes.MetaPoints)
@description('Gets selected classes of objects from CityJSON and converts them into internal format.')
def call(source: MetaSource):
    objects = []
    areas = []
    lines = []
    points = []

    for gtype, entries in source.geometry.items():
        for ID in entries:
            if gtype == MetaObject.gtype:
                objects.append(MetaObject(ID, source))
            elif gtype == MetaArea.gtype:
                areas.append(MetaArea(ID, source))
            elif gtype == MetaLines.gtype:
                lines.append(MetaLines(ID, source))
            elif gtype == MetaPoints.gtype:
                points.append(MetaPoints(ID, source))

    return objects, areas, lines, points

