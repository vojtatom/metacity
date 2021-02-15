from functools import wraps
# Python code to illustrate  
# Decorators with parameters in Python  

get_params = False

def enable_params():
    global get_params
    get_params = True

def disable_params():
    global get_params
    get_params = False


class ParameterList:
    def __init__(self):
        self.list = []

    def addParameter(self, paramtitle, paramtype, inout):
        self.list.append({
            'param': paramtitle,
            'type': paramtype,
            'inout': inout
        })

    def addValue(self, paramtitle, paramtype, value):
        self.list.append({
            'param': paramtitle,
            'type': paramtype,
            'value': value
        })

    def addDescription(self, description):
        self.list.append({
            'description': description
        })

    def __add__(self, other):
        concat = ParameterList()
        concat.list.extend(self.list)
        concat.list.extend(other.list)
        return concat

    def outputParams(self):
        return [p for p in self.list if ('inout' in p and p['inout'] == 'output')]

    def inputParams(self):
        return [p for p in self.list if ('inout' in p and p['inout'] == 'input')]

    def valueParams(self):
        return [p for p in self.list if 'value' in p]

    def description(self):
        return [p['description'] for p in self.list if 'description' in p]

    def orderedParams(self):
        return self.list


def param(paramtitle, paramtype): 
    """Registres an input parameter of the function

    Args:
        paramtitle (str): title of the parameter, must be unique for the function
        paramtype (str): type of the parameter
    """
    def inner(func): 
        @wraps(func)
        def wrapper(*args, **kwargs):     
            global get_params
            if get_params:
                params = ParameterList()
                params.addParameter(paramtitle, paramtype, 'input')

                try:
                    params = params + func(*args, **kwargs)
                except:
                    pass

                return params
            else:
                return func(*args, **kwargs) 
        
        return wrapper 
    return inner 


def value(paramtitle, paramtype, default): 
    """Registres an user-accesible input field of the function

    Args:
        paramtitle (str): title of the parameter, must be unique for the function
        paramtype (str): type of the parameter
    """
    def inner(func): 
        @wraps(func)
        def wrapper(*args, **kwargs):     
            global get_params
            if get_params:
                params = ParameterList()
                params.addValue(paramtitle, paramtype, default)

                try:
                    params = params + func(*args, **kwargs)
                except:
                    pass

                return params
            else:
                return func(*args, **kwargs) 
        
        return wrapper 
    return inner 
  

def output(paramtitle, paramtype): 
    """Registres a returned value

    Args:
        paramtitle (str): title of the returned parameter, must be unique for the function
        paramtype (str): type of the returned parameter
    """
    def inner(func): 
        @wraps(func)
        def wrapper(*args, **kwargs):     
            global get_params
            if get_params:
                params = ParameterList()
                params.addParameter(paramtitle, paramtype, 'output')

                try:
                    params += (func(*args, **kwargs))
                except:
                    pass

                return params
            else:
                return func(*args, **kwargs) 
        
        return wrapper 
    return inner 


def description(desc): 
    """Registres a returned value

    Args:
        paramtitle (str): title of the returned parameter, must be unique for the function
        paramtype (str): type of the returned parameter
    """
    def inner(func): 
        @wraps(func)
        def wrapper(*args, **kwargs):     
            global get_params
            if get_params:
                params = ParameterList()
                params.addDescription(desc)

                try:
                    params += (func(*args, **kwargs))
                except:
                    pass

                return params
            else:
                return func(*args, **kwargs) 
        
        return wrapper 
    return inner 
