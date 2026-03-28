import networkx as nx

from utils.graph import nearest_node, route_to_geometry, get_best_edge
from fastapi import HTTPException
from shapely.geometry import mapping

def find_path(graph_state, start, end, rf):
    G = graph_state["G"]
    node_ids = graph_state["node_ids"]
    tree = graph_state["tree"]

    try:
        start_node = nearest_node(start.lat, start.lng, node_ids, tree)
        end_node = nearest_node(end.lat, end.lng, node_ids, tree)

        def weight_fn(u, v, data):
            edge = get_best_edge(G, u, v)
            length = edge.get("length", 0.0)
            risk_score = edge.get("risk_score", 0.0)

            total = length + rf * risk_score
            
            # If the street is well lit
            # then we reduce the risk score by 5%
            if edge.get('lit') == 'yes':
                total = total * 0.95;
    
            return total

        path = nx.shortest_path(G, source=start_node, target=end_node, weight=weight_fn)
        line, distance_m, total_accidents = route_to_geometry(G, path)

        return {
            "distance_m": distance_m,
            "node_count": len(path),
            "start_node": start_node,
            "end_node": end_node,
            "geometry": mapping(line),
            "total_accidents": total_accidents,
            "risk_factor": rf
        }

    except nx.NetworkXNoPath:
        raise HTTPException(status_code=404, detail="No route found between the given points")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))