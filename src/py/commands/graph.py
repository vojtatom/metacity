from comms import sendClearViewer, sendNodeFinished, sendNodeStarted
from metascript import MetaNode, MetaOutputConnector, MetaPipeline


def compute(graph, pipeline: MetaPipeline): 
    pipeline.update_graph(graph)
    node: MetaNode
    for node in pipeline.order:
        if not node.execute:
            continue
        
        param_order = pipeline.function_input_params_order(node.title)
        input_values = pipeline.parameters_for_node(node)

        module = pipeline.modules[node.title] #this is the callable thing
        sendNodeStarted(node.title, node.ID)
        returned = module.call(*input_values)
        sendNodeFinished(node.title, node.ID)

        if not isinstance(returned, tuple):
            returned = (returned,)
        
        connector: MetaOutputConnector
        for val, connector in zip(returned, node.outParams):
            pipeline.update_values(connector.key, val)      

    return {}
