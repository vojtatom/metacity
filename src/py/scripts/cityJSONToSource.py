from typing import List

from cjio.cityjson import CityJSON
from comms import sendProgressPerc
from metascript import MetaTypes, description, output, param
from pipeline.sources import MetaSource


@param('CityJSON', MetaTypes.CityJSON)
@param('Types', MetaTypes.CityJSONTypes)
@param('Lods', MetaTypes.LoDs)
@output('Source', MetaTypes.MetaSource)
@description('Converts CityJSON into MetaSource, only supplied CityJSON Types are processed.')
def call(cj: CityJSON, types: List[str], lods: List[int]):
    source = MetaSource()
    source.fromCityJSON(cj, types, lods, sendProgressPerc)
    return source

