from os import walk, path
import importlib.util
from inspect import getmembers, isfunction
import parameters

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

        print(module, file)
        pymodule = importlib.import_module(f'scripts.{module}')
        members = [ func[0] for func in getmembers(pymodule, isfunction) ]
        if 'call' in members:
            modules[module] = pymodule

            paramlist = modules[module].call()

            functions[module] = {
                'title': module,
                'in': paramlist.inputParams(),
                'out': paramlist.outputParams()
            }

    parameters.disable_params()
    return modules, functions

if __name__ == "__main__":
    load_modules()