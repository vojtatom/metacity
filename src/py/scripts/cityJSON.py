from functions import value, output, description
from cjio import cityjson
from os import path

@value('File', 'file', 'Select CityJSON file')
@output('CityJSON', 'CityJSON')
@description('Reads and parses contents of cityJSON file')
def call(file: str):

    if not path.exists(file):
        raise Exception(f"CityJSON file {file} not found.")

    data = cityjson.load(file)
    data.decompress()
    return data

