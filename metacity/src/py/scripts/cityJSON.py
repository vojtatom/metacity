from os import path

from cjio import cityjson
from metascript import MetaTypes, description, output, value


@value('File', MetaTypes.FileField, 'Select CityJSON file')
@output('CityJSON', MetaTypes.CityJSON)
@description('Reads and parses contents of cityJSON file')
def call(file: str):

    if not path.exists(file):
        raise Exception(f"CityJSON file {file} not found.")

    data = cityjson.load(file)
    data.decompress()
    return data

