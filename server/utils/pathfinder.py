import networkx as nx

from utils.graph import nearest_node, route_to_geometry, get_best_edge
from utils.traffic import get_traffic_adjustments
from fastapi import HTTPException
from shapely.geometry import mapping

def find_path(graph_state, start, end, rf, use_traffic=True):
    G = graph_state["G"]
    node_ids = graph_state["node_ids"]
    tree = graph_state["tree"]

    # Get traffic adjustments (blocked roads and penalties)
    blocked_edges = set()
    edge_penalties = {}

    if use_traffic:
        try:
            blocked_edges, edge_penalties = get_traffic_adjustments(
                G, start.lat, start.lng, end.lat, end.lng
            )
            if blocked_edges or edge_penalties:
                print(f"Traffic: {len(blocked_edges)} blocked, {len(edge_penalties)} slowed")
        except Exception as e:
            print(f"Traffic fetch failed: {e}")

    try:
        start_node = nearest_node(start.lat, start.lng, node_ids, tree)
        end_node = nearest_node(end.lat, end.lng, node_ids, tree)

        def weight_fn(u, v, data):
            edge = get_best_edge(G, u, v)
            if edge is None:
                return float("inf")

            # Check if edge is blocked
            edge_key = data.get("key", 0)
            if (u, v, edge_key) in blocked_edges:
                return float("inf")  # Effectively removes edge

            length = edge.get("length", 0.0)
            risk_score = edge.get("risk_score", 0.0)

            total = length + rf * risk_score

            # Apply traffic penalty
            penalty = edge_penalties.get((u, v, edge_key), 1.0)
            total *= penalty

            # If the street is well lit
            # then we reduce the risk score by 5%
            if edge.get('lit') == 'yes':
                total = total * 0.95

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
            "risk_factor": rf,
            "traffic_blocked": len(blocked_edges),
            "traffic_slowed": len(edge_penalties)
        }

    except nx.NetworkXNoPath:
        raise HTTPException(status_code=404, detail="No route found between the given points")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))