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


def extendList(baseList, extA, extB):
    baseList.extend(extA)
    baseList.extend(extB)


class MetaFunction:
    metaVisible = False

    def __init__(self):
        self.inputs = []
        self.outputs = []
        self.values = []
        self.ordered = []
        self.types = []
        self.description = []
        self.disabled = False

    def addParam(self, paramtitle, paramtype):
        inputv = {
            'param': paramtitle,
            'type': paramtype
        }
        self.inputs.append(inputv)
        self.ordered.append(inputv)


    def addOutput(self, paramtitle, paramtype):
        self.outputs.append({
            'param': paramtitle,
            'type': paramtype
        })


    def addValue(self, paramtitle, paramtype, value, optionals):
        value = {
            'param': paramtitle,
            'type': paramtype,
            'value': value,
            'optionals': optionals
        }
        self.values.append(value)
        self.ordered.append(value)
        

    def addDescription(self, description):
        self.description.append(description)

    
    def disable(self):
        self.disabled = True


    def __add__(self, other):
        mf = MetaFunction()
        extendList(mf.inputs, self.inputs, other.inputs)
        extendList(mf.outputs, self.outputs, other.outputs)
        extendList(mf.values, self.values, other.values)
        extendList(mf.ordered, self.ordered, other.ordered)
        extendList(mf.types, self.types, other.types)
        extendList(mf.description, self.description, other.description)
        mf.disabled = self.disabled or other.disabled
        return mf


    def toDict(self):
        return {
            'in': self.inputs,
            'out': self.outputs,
            'value': self.values,
            'description': self.description,
            'disabled': self.disabled,
            'ordered': self.ordered
        }


    @staticmethod
    def enableMeta():
        MetaFunction.metaVisible = True


    @staticmethod
    def disableMeta():
        MetaFunction.metaVisible = False


def param(paramtitle, paramtype): 
    """Registres an input parameter of the function

    Args:
        paramtitle (str): title of the parameter, must be unique for the function
        paramtype (str): type of the parameter
    """
    def inner(func): 
        @wraps(func)
        def wrapper(*args, **kwargs):     
            if MetaFunction.metaVisible:
                params = MetaFunction()
                params.addParam(paramtitle, paramtype)

                try:
                    params = params + func(*args, **kwargs)
                except:
                    pass

                return params
            else:
                return func(*args, **kwargs) 
        
        return wrapper 
    return inner 


def value(paramtitle, paramtype, default, optionals=None): 
    """Registres an user-accesible input field of the function

    Args:
        paramtitle (str): title of the parameter, must be unique for the function
        paramtype (str): type of the parameter
    """
    def inner(func): 
        @wraps(func)
        def wrapper(*args, **kwargs):   
            if MetaFunction.metaVisible:
                params = MetaFunction()
                params.addValue(paramtitle, paramtype, default, optionals)

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
            if MetaFunction.metaVisible:
                params = MetaFunction()
                params.addOutput(paramtitle, paramtype)

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
            if MetaFunction.metaVisible:
                params = MetaFunction()
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


def disable(func):
    """[summary]

    Args:
        func ([type]): [description]

    Returns:
        [type]: [description]
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        if MetaFunction.metaVisible:
            params = MetaFunction()
            params.disable()

            try:
                params += (func(*args, **kwargs))
            except:
                pass
        else:
            func(*args, **kwargs)
    return wrapper