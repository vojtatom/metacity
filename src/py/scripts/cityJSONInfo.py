from functions import param, output, description
from cjio.cityjson import CityJSON

import json

@param('CityJSON', 'CityJSON')
@output('Types', 'Types')
@description('CityJSON metadata and information')
def call(cj: CityJSON):
    info = cj.get_info()
    info = json.loads(info)
    present_types = info["cityobjects_present"]
    return present_types

