from functions import param, output, description
from objects import MetaSource
from cjio.cityjson import CityJSON
from typing import List

from comms import sendProgressPerc

@param('CityJSON', 'CityJSON')
@param('Types', 'CityJSONTypes')
@output('Source', 'MetaSource')
@description('Converts CityJSON into MetaSource, only supplied CityJSON Types are processed.')
def call(cj: CityJSON, types: List[str]):
    source = MetaSource()
    source.fromCityJSON(cj, types, sendProgressPerc)
    return source

