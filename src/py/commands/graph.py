from comms import sendNodeFinished, sendNodeStarted, sendClearViewer

def input_connectors(node):
    return node['in']


def output_connectors(node):
    return node['out']


def connections(connector):
    return connector['connections']


def connection_input_node_id(connection):
    return connection['in']['node']


def connection_output_node_id(connection):
    return connection['out']['node']


def function_input_params_order(functions, node):
    params = functions[node['title']]['ordered']
    return [p['param'] for p in params]


##recursive routine
def check_cycles(nodes, node_id, visited):
    if node_id not in visited:
        visited.append(node_id)
        for connector in output_connectors(nodes[node_id]):
            for connection in connections(connector):
                neighbor_id = connection_input_node_id(connection)
                check_cycles(nodes, neighbor_id, visited.copy())
    else:
        raise Exception(f'Cycle detected at node {node_id}!')


def node_dict(graph):
    nodes = {}
    for node in graph:
        nodes[node['id']] = node
    return nodes


def get_start_node_ids(graph):
    return [node['id'] for node in graph if len(node['in']) == 0]


def topological_sort(graph): 
    """
    Sorts the nodes contained in the graph topologically.
    Returns a list with ordered ids.
        :param graph: dict representing the graph, each node 
                      is represented by dict with in and out lists containing 
                      ids of input and output edges
    """

    nodes = node_dict(graph)
    start_node_ids = get_start_node_ids(graph)

    for i in start_node_ids:
        check_cycles(nodes, i, [])

    order = start_node_ids


    ### additional check for requirement satisfication
    # if the node misses input (all inputs are required), than the node is not processed
    for node_id in order:
        for oconnector in output_connectors(nodes[node_id]):
            for oconnection in connections(oconnector):
                neighbor_id = connection_input_node_id(oconnection)
                satisfied = True

                for iconnector in input_connectors(nodes[neighbor_id]):  
                    for iconnection in connections(iconnector):
                        required_node = connection_output_node_id(iconnection)
                        if required_node not in order:
                            satisfied = False

                    if len(connections(iconnector)) == 0:
                        satisfied = False

                if neighbor_id not in order and satisfied:
                    order.append(neighbor_id)
        
    return order


def out_connection_key(conn):
    return conn['out']['node'] + conn['out']['connector']


def out_connector_key(connector):
    return connector['node'] + connector['param']


def pick_params(param_order, node, intermediate):
    params = []
    
    values = { v['param']: v for v in node['value'] } 
    inputs = { i['param']: i for i in node['in'] }

    for p in param_order:
        if p in values:
            params.append(values[p]['value'])
        elif p in inputs:
            connection = connections(inputs[p])
            
            #dirty check
            if len(connection) != 1:
                raise Exception(f'More than one input connection at {node["id"]}!')
            
            key = out_connection_key(connection[0])

            if key not in intermediate:
                raise Exception(f'Missing intermediate result {key}!')

            params.append(intermediate[key])
        else:
            raise Exception(f'Parameter "{p}" declared in code but not found in the input graph.')

    return params



def compute(graph, modules, functions_struct, pipeline): 
    order = topological_sort(graph)
    nodes = node_dict(graph)
    values = {}

    sendClearViewer()
    
    for node_id in order:
        node = nodes[node_id]
        
        param_order = function_input_params_order(functions_struct, node)
        input_values = pick_params(param_order, node, values)  
        module = modules[node['title']] #this is the callable thing

        sendNodeStarted(node['title'], node['id'])
        returned = module.call(*input_values)
        sendNodeFinished(node['title'], node['id'])

        if not isinstance(returned, tuple):
            returned = (returned,)
        
        for val, connector in zip(returned, node['out']):
            param_key = out_connector_key(connector)
            values[param_key] = val
    
    return values
