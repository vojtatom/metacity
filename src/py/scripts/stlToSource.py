from functions import param, output, description
from objects import MetaSource
from typing import List
from meshio import Mesh

from comms import sendProgressPerc

@param('STL', 'STL')
@output('Source', 'MetaSource')
@description('Converts STL into MetaSource')
def call(stl: Mesh):
    source = MetaSource()
    source.fromSTL(stl, sendProgressPerc)
    return source

