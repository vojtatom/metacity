from os import walk, path
from inspect import getmembers, isfunction
import importlib
import parameters
import sys


def load_modules():
    scripts_dir = path.join(path.dirname(__file__), 'scripts')

    files = []
    modules = {}
    functions = {}

    #get only python files
    for (dirpath, dirnames, filenames) in walk(scripts_dir):
        for file in filenames:
            filename, file_extension = path.splitext(file)
            if file_extension == '.py':
                files.append([filename, path.join(scripts_dir, file)])

    #module = importlib.import_module('scripts')
    #print(dir(module))
    #members = [ func[0] for func in getmembers(module) ]
    #print(members)

    parameters.enable_params()

    #find call method
    for module, file in files:
        if module == 'parameters':
            continue

        pathmodule = f'scripts.{module}'
        print(pathmodule, file)
        
        if pathmodule not in sys.modules:
            pymodule = importlib.import_module(pathmodule)
        else:
            pymodule = importlib.import_module(pathmodule)
            importlib.reload(pymodule)

        members = [ func[0] for func in getmembers(pymodule, isfunction) ]
        if 'call' in members:
            modules[module] = pymodule

            paramlist = modules[module].call()

            functions[module] = {
                'title': module,
                'in': paramlist.inputParams(),
                'out': paramlist.outputParams(),
                'value': paramlist.valueParams(),
                'description': paramlist.description(),
                'ordered': paramlist.orderedParams()
            }

    parameters.disable_params()
    return modules, functions

if __name__ == "__main__":
    load_modules()