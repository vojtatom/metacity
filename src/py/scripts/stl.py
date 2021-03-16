from os import path

import meshio
from metascript import MetaTypes, description, output, value


@value('File', MetaTypes.FileField, 'Select STL file')
@output('STL', MetaTypes.STL)
@description('Reads and parses contents of STL file')
def call(file: str):

    if not path.exists(file):
        raise Exception(f"STL file {file} not found.")

    data = meshio.read(file, file_format="stl")
    return data

