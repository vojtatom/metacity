from functions import param, output, description
from objects import MetaSource, MetaObject, MetaArea, MetaLines, MetaPoints
from typing import List

@param('Source', 'MetaSource')
@output('Objects', 'MetaObjects')
@output('Areas', 'MetaAreas')
@output('Lines', 'MetaLines')
@output('Points', 'MetaPoints')
@description('Gets selected classes of objects from CityJSON and converts them into internal format.')
def call(source: MetaSource):
    objects = []
    areas = []
    lines = []
    points = []

    for ilod, lod in enumerate(source.lods):
        for gtype, entries in lod.items():
            for ID in entries:
                if gtype == MetaObject.gtype:
                    objects.append(MetaObject(ID, source, ilod))
                elif gtype == MetaArea.gtype:
                    areas.append(MetaArea(ID, source, ilod))
                elif gtype == MetaLines.gtype:
                    lines.append(MetaLines(ID, source, ilod))
                elif gtype == MetaPoints.gtype:
                    points.append(MetaPoints(ID, source, ilod))

    return objects, areas, lines, points

