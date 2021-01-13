from output import printOK


def topological_sort(graph): 
    """
    Sorts the nodes contained in the graph topologically.
    Returns a list with ordered ids.
        :param graph: dict representing the graph, each node 
                      is represented by dict with in and out lists containing 
                      ids of input and output edges
    """
    # List of indices of starting nodes
    start_nodes = []
    # dict of nodes
    nodes = {}

    for node in graph:
        nodes[node['id']] = node
        if len(node['inParameters']) == 0:
            start_nodes.append(node['id'])

    ##recursive routine
    def visit_node(nodes, nid, visited):
        if nid not in visited:
            visited.append(nid)
            for param in nodes[nid]['outParameters']:
                for conn in param['connections']:
                    neighborid = conn['in']['node']
                    visit_node(nodes, neighborid, visited.copy())
        else:
            raise Exception(f'Cycle detected at node {nid}!')

    for i in start_nodes:
        visit_node(nodes, i, [])

    order = start_nodes

    for nid in order:
        for param in nodes[nid]['outParameters']:
            for conn in param['connections']:
                neighborid = conn['in']['node']
            
                ### additional chack for requirement satisfication
                satisfied = True

                for param in nodes[neighborid]['inParameters']:
                    for conn in param['connections']:
                        requirednode = conn['out']['node']

                        if requirednode not in order:
                            satisfied = False

                if neighborid not in order and satisfied:
                    order.append(neighborid)    
    return order


def out_connection_key(conn):
    return conn['out']['node'] + conn['out']['connector']

def out_param_key(param):
    return param['node'] + param['param']

def compute(graph, modules): 
    order = topological_sort(graph)

    nodes = {}
    values = {}

    for node in graph:
        nodes[node['id']] = node

    for node_id in order:
        node = nodes[node_id]
        in_data = {}
        module = modules[node['title']]

        input_values = []

        #construct input params
        for param in node['inParameters']:
            for conn in param['connections']:
                conn_key = out_connection_key(conn)
                if conn_key not in values:
                    raise Exception(f'Missing input values - {conn_key}!')

                input_values.append(values[conn_key])

        
        returned = module.call(*input_values)
        if not isinstance(returned, list):
            returned = [returned]

        for val, param in zip(returned, node['outParameters']):
            param_key = out_param_key(param)
            values[param_key] = val

    return values
