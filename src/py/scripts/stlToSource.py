from typing import List

from comms import sendProgressPerc
from meshio import Mesh
from metascript import MetaTypes, description, output, param
from pipeline.sources import MetaSource


@param('STL', MetaTypes.STL)
@output('Source', MetaTypes.MetaSource)
@description('Converts STL into MetaSource')
def call(stl: Mesh):
    source = MetaSource()
    source.fromSTL(stl, sendProgressPerc)
    return source

