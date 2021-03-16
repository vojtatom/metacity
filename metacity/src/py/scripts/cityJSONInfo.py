import json

from cjio.cityjson import CityJSON
from metascript import MetaTypes, description, output, param


@param('CityJSON', MetaTypes.CityJSON)
@output('Types', MetaTypes.CityJSONTypes)
@description('CityJSON metadata and information')
def call(cj: CityJSON):
    info = cj.get_info()
    info = json.loads(info)
    present_types = info["cityobjects_present"]
    return present_types

