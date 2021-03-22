from functools import wraps
from typing import List
from comms import printOK
from uuid import uuid4

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


class MetaTypes:
    #types
    MetaSource = 'MetaSource'
    MetaObjects = 'MetaObjects'
    MetaAreas = 'MetaAreas'
    MetaLines = 'MetaLines'
    MetaPoints = 'MetaPoints'
    MetaLayer = 'MetaLayer'
    BBox = 'BBox'
    LoDs = 'LoDs'
    CityJSON = 'CityJSON'
    STL = 'STL'
    CityJSONTypes = 'CityJSONTypes'


    #values
    FileField = 'file'
    BoolField = 'bool'
    SelectField = 'bool'




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
        self.passIdentifier = False


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


    def enablePassIdentifier(self):
        self.passIdentifier = True


    def __add__(self, other):
        mf = MetaFunction()
        extendList(mf.inputs, self.inputs, other.inputs)
        extendList(mf.outputs, self.outputs, other.outputs)
        extendList(mf.values, self.values, other.values)
        extendList(mf.ordered, self.ordered, other.ordered)
        extendList(mf.types, self.types, other.types)
        extendList(mf.description, self.description, other.description)
        mf.disabled = self.disabled or other.disabled
        mf.passIdentifier = self.passIdentifier or other.passIdentifier   
        return mf


    def toDict(self):
        return {
            'in': self.inputs,
            'out': self.outputs,
            'value': self.values,
            'description': self.description,
            'disabled': self.disabled,
            'ordered': self.ordered,
            'passIdentifier': self.passIdentifier
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

            return params
        else:
            func(*args, **kwargs)
    return wrapper


def passIdentifier(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if MetaFunction.metaVisible:
            params = MetaFunction()
            params.enablePassIdentifier()
            try:
                params += func(*args, **kwargs)
            except:
                pass

            return params
        else:
            func(*args, **kwargs)
    return wrapper


class MetaConnection:
    def __init__(self, inConnector, outConnector):
        self.inputConn = inConnector
        self.outputConn = outConnector

    @property
    def key(self):
        return self.outputConn.node.ID + self.outputConn.param + '---' + self.inputConn.node.ID + self.inputConn.param 


class MetaValue:
    def __init__(self, data, node):
        self.param = data['param']
        self.value = data['value']
        self.node = node


class MetaConnector:
    def __init__(self, data, node):
        self.param = data['param']
        self.node = node
        self.connections = []

    def add_connection(self, connection):
        self.connections.append(connection)


class MetaInputConnector(MetaConnector):
    def __init__(self, data, node):
        super().__init__(data, node)


class MetaOutputConnector(MetaConnector):
    def __init__(self, data, node):
        super().__init__(data, node)

    @property
    def key(self):
        return self.node.ID + self.param


class MetaNode:
    def __init__(self, data):
        self.title = data['title']
        self.ID = data['id']
        self.values = [ MetaValue(v, self) for v in data['value'] ]
        self.inParams = [ MetaInputConnector(c, self) for c in data['in'] ]
        self.outParams = [ MetaOutputConnector(c, self) for c in data['out'] ]
        self.execute = False


    def get_input_connector(self, param_title):
        for conn in self.inParams:
            if conn.param == param_title:
                return conn


    def get_output_connector(self, param_title):
        for conn in self.outParams:
            if conn.param == param_title:
                return conn

##recursive routine
def check_cycles(node: MetaNode, visited):
    connection: MetaConnection
    if node.ID not in visited:
        visited.append(node.ID)
        for connector in node.outParams:
            for connection in connector.connections:
                successor = connection.inputConn.node
                check_cycles(successor, visited.copy())
    else:
        raise Exception(f'Cycle detected at node {node.ID}!')



def mark_execution(node: MetaNode, parentChanged, active, pipeline):
    connection: MetaConnection
    if node in active:
        if parentChanged or pipeline.isNodeChanged(node):
            node.execute = True

        for connector in node.outParams:
            for connection in connector.connections:
                successor = connection.inputConn.node
                mark_execution(successor, node.execute, active, pipeline)


def get_start_nodes(graph):
    node: MetaNode
    return [node for ID, node in graph.items() if len(node.inParams) == 0]


def topsort_and_execution(graph, pipeline): 
    """
    Sorts the nodes contained in the graph topologically.
    Returns a list with ordered ids.
        :param graph: dict representing the graph, each node 
                      is represented by dict with in and out lists containing 
                      ids of input and output edges
    """

    start_nodes = get_start_nodes(graph)

    for node in start_nodes:
        check_cycles(node, [])
    order = start_nodes.copy()

    oconnection: MetaConnection
    iconnection: MetaConnection
    successor: MetaNode
    required_node: MetaNode
    for node in order:
        for oconnector in node.outParams:
            for oconnection in oconnector.connections:
                successor = oconnection.inputConn.node
                satisfied = True

                for iconnector in successor.inParams:  
                    for iconnection in iconnector.connections:
                        required_node = iconnection.outputConn.node
                        if required_node not in order:
                            satisfied = False

                    if len(iconnector.connections) == 0:
                        satisfied = False

                if successor not in order and satisfied:
                    order.append(successor)
    
    for node in start_nodes:
        mark_execution(node, False, order, pipeline)
    
    return order


def input_connectors(node):
    return node['in']


def connections(connector):
    return connector['connections']


def connection_output_node_id(connection):
    return connection['out']['node']


def load_graph(graph):
    nodes = {}

    for nodedata in graph:
        node = MetaNode(nodedata)
        nodes[node.ID] = node

    for nodedata in graph:
        for iconnector in input_connectors(nodedata):
            for iconnection in connections(iconnector):
                inputnodeID = nodedata['id']
                outputnodeID = connection_output_node_id(iconnection)
                inputConnector = nodes[inputnodeID].get_input_connector(iconnection['in']['connector'])
                outputConnector = nodes[outputnodeID].get_output_connector(iconnection['out']['connector'])

                conn = MetaConnection(inputConnector, outputConnector)
                inputConnector.add_connection(conn)
                outputConnector.add_connection(conn)

    return nodes


class MetaPipeline: 
    def __init__(self):
        self.cur = None
        self.old = None
        self.__order = []
        self.functions = {}
        self.__modules = {}
        self.values = {}


    def update_graph(self, graph):
        self.old = self.cur
        self.cur = load_graph(graph)
        self.__order = topsort_and_execution(self.cur, self)


    def update_functions(self, functions, modules):
        self.functions = functions
        self.__modules = modules


    def function_input_params_order(self, function):
        params = self.functions[function]['ordered']
        return [p['param'] for p in params]


    def parameters_for_node(self, node: MetaNode):
        param_order = self.function_input_params_order(node.title)
        
        v: MetaValue
        i: MetaInputConnector
        connection: MetaConnection

        values = { v.param: v.value for v in node.values } 
        inputs = { i.param: i.connections for i in node.inParams }
        params = []
        for p in param_order:
            if p in values:
                params.append(values[p])
            elif p in inputs:
                connections = inputs[p]
                
                #dirty check
                if len(connections) != 1:
                    raise Exception(f'More than one input connection at {node.ID}!')
                
                connection = connections[0]
                key = connection.outputConn.key

                if key not in self.values:
                    printOK(self.values)
                    raise Exception(f'Missing intermediate result {key} required by {node.title}!')

                params.append(self.values[key])
            else:
                raise Exception(f'Parameter "{p}" declared in code but not found in the input graph.')

        if self.functions[node.title]['passIdentifier']:
            params += [node.ID]

        return params


    def update_values(self, identifier, value):
        self.values[identifier] = value


    @property
    def order(self):
        return self.__order


    @property
    def modules(self):
        return self.__modules


    def clearPipeline(self):
        self.cur = None
        self.old = None
        self.__order = []
        self.values = {}


    def isNodeChanged(self, node: MetaNode):
        if self.old is None:
            return True

        if node.ID not in self.old:
            return True

        oldnode: MetaNode = self.old[node.ID]
        val : MetaValue
        oval : MetaValue
        for val, oval in zip(node.values, oldnode.values):
            if val.value != oval.value:
                return True

        param: MetaInputConnector
        oparam: MetaInputConnector
        for param, oparam in zip(node.inParams, oldnode.inParams):
            if len(param.connections) != len(oparam.connections):
                return True

            #expects to be an active node with one input connection
            if param.connections[0].key != oparam.connections[0].key:
                return True

        return False


