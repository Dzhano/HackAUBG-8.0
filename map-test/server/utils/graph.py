import math
import pickle
from pathlib import Path

from scipy.spatial import cKDTree
from shapely.geometry import LineString


def load_graph(path: Path):
    with open(path, "rb") as f:
        return pickle.load(f)


def build_kdtree(G):
    node_ids = []
    coords_xy = []

    for nid, data in G.nodes(data=True):
        lat = float(data["y"])
        lon = float(data["x"])
        x = lon * math.cos(math.radians(lat))
        node_ids.append(nid)
        coords_xy.append((x, lat))

    return node_ids, cKDTree(coords_xy)


def nearest_node(lat: float, lng: float, node_ids: list, tree: cKDTree) -> int:
    x = lng * math.cos(math.radians(lat))
    _, idx = tree.query((x, lat))
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


def route_to_geometry(G, path: list):
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
                (float(v_data["x"]), float(v_data["y"])),
            ]

        if coords and coords[-1] == seg_coords[0]:
            coords.extend(seg_coords[1:])
        else:
            coords.extend(seg_coords)

    if len(coords) < 2:
        raise ValueError("Route geometry could not be built")

    return LineString(coords), total_length
