import importlib
import sys
from inspect import getmembers, isfunction
from os import path, walk

from metascript import MetaFunction, MetaTypes


def load_modules():
    scripts_dir = path.join(path.dirname(path.abspath(__file__)), '../scripts')
    p = path.dirname(path.abspath(__file__))

    files = []
    modules = {}
    functions = {}

    #get only python files
    for (dirpath, dirnames, filenames) in walk(scripts_dir):
        for file in filenames:
            filename, file_extension = path.splitext(file)
            if file_extension == '.py':
                files.append([filename, path.join(scripts_dir, file)])

    MetaFunction.enableMeta()

    #find call method
    for module, file in files:
        if module == 'parameters':
            continue

        pathmodule = f'scripts.{module}'
        
        if pathmodule not in sys.modules:
            pymodule = importlib.import_module(pathmodule)
        else:
            pymodule = importlib.import_module(pathmodule)
            importlib.reload(pymodule)

        members = [ func[0] for func in getmembers(pymodule, isfunction) ]
        
        if 'call' in members:
            modules[module] = pymodule
            metafunction = modules[module].call()
            functionStruct = metafunction.toDict()
            functionStruct['title'] = module
            functions[module] = functionStruct

    MetaFunction.disableMeta()
    return modules, functions

if __name__ == "__main__":
    load_modules()
