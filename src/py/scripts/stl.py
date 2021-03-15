from functions import value, output, description
from os import path

import meshio

@value('File', 'file', 'Select STL file')
@output('STL', 'STL')
@description('Reads and parses contents of STL file')
def call(file: str):

    if not path.exists(file):
        raise Exception(f"STL file {file} not found.")

    data = meshio.read(file, file_format="stl")
    return data

