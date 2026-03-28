import pickle
import math
import json
import networkx as nx
from scipy.spatial import cKDTree
from shapely.geometry import LineString, mapping
import time

GRAPH_FILE = "bulgaria-driving-graph.pkl"

start = {"lat": 42.690062, "lng": 23.306588 }
end = {"lat": 42.648641, "lng": 23.3306865 }    
output_file = "route_result.json"

def load_graph():
    with open(GRAPH_FILE, "rb") as f:
        G = pickle.load(f)
    return G

def build_kdtree(G):
    node_ids = []
    coords_xy = []

    for nid, data in G.nodes(data=True):
        lat = float(data["y"])
        lon = float(data["x"])

        # simple projection for nearest-node lookup
        x = lon * math.cos(math.radians(lat))
        y = lat

        node_ids.append(nid)
        coords_xy.append((x, y))

    tree = cKDTree(coords_xy)
    return node_ids, tree

def nearest_node(lat, lng, node_ids, tree):
    x = lng * math.cos(math.radians(lat))
    y = lat
    _, idx = tree.query((x, y))
    return node_ids[idx]


def get_best_edge(G, u, v):
    edge_dict = G.get_edge_data(u, v)
    if not edge_dict:
        return None

    best_edge = None
    best_len = float("inf")

    for _, attrs in edge_dict.items():
        length = float(attrs.get("length", float("inf")))
        if length < best_len:
            best_len = length
            best_edge = attrs

    return best_edge


def route_to_geometry(G, path):
    coords = []
    total_length = 0.0

    for u, v in zip(path[:-1], path[1:]):
        edge = get_best_edge(G, u, v)
        if edge is None:
            continue

        total_length += float(edge.get("length", 0.0))

        geom = edge.get("geometry")
        if geom is not None:
            seg_coords = list(geom.coords)
        else:
            u_data = G.nodes[u]
            v_data = G.nodes[v]
            seg_coords = [
                (float(u_data["x"]), float(u_data["y"])),
                (float(v_data["x"]), float(v_data["y"]))
            ]

        if coords and coords[-1] == seg_coords[0]:
            coords.extend(seg_coords[1:])
        else:
            coords.extend(seg_coords)

    if len(coords) < 2:
        raise ValueError("Route geometry could not be built")

    return LineString(coords), total_length


def shortest_route(G, start, end, node_ids, tree):
    start_node = nearest_node(start["lat"], start["lng"], node_ids, tree)
    end_node = nearest_node(end["lat"], end["lng"], node_ids, tree)

    path = nx.shortest_path(G, source=start_node, target=end_node, weight="length")
    line, distance_m = route_to_geometry(G, path)

    return {
        "start_node": start_node,
        "end_node": end_node,
        "distance_m": distance_m,
        "path_nodes": path,
        "geometry": mapping(line),  # GeoJSON LineString
    }


if __name__ == "__main__":
    start_time = time.time()
    G = load_graph()
    node_ids, tree = build_kdtree(G)

    # start = {"lat": 42.6977, "lng": 23.3219}
    # end = {"lat": 42.6977, "lng": 23.7453}

    result = shortest_route(G, start, end, node_ids, tree)

    print("Distance (m):", result["distance_m"])
    print("Start node:", result["start_node"])
    print("End node:", result["end_node"])
    print("First 5 path nodes:", result["path_nodes"][:5])
    print("Geometry type:", result["geometry"]["type"])
    print("First 5 coordinates:", result["geometry"]["coordinates"][:5])
    print("Time taken:", time.time() - start_time)

    with open(output_file, "w") as f:
        json.dump(result, f, indent=2)
    print("Result written to route_result-2.json")