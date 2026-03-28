import csv
import math
import pickle
import time
from scipy.spatial import cKDTree

GRAPH_FILE = "./raw-data/bulgaria-slice-driving-graph-all.pkl"
ACCIDENTS_FILE = "./accidents-dataset.csv"
OUTPUT_GRAPH_FILE = "./weighted-graph-v2.pkl"

INJURY_WEIGHT = 3.0
DEATH_WEIGHT = 10.0

ALPHA = 10.0

def project_lonlat(lat, lon):
    # simple projection for KD-tree indexing
    x = lon * math.cos(math.radians(lat))
    y = lat
    return x, y

def load_graph():
    with open(GRAPH_FILE, "rb") as f:
        return pickle.load(f)

def init_edge_attributes(G):
    for u, v, key, data in G.edges(keys=True, data=True):
        data["accident_count"] = 0
        data["injury_count"] = 0
        data["death_count"] = 0

def edge_midpoint_from_data(G, u, v, data):
    geom = data.get("geometry")

    if geom is not None:
        coords = list(geom.coords)
        mid = coords[len(coords) // 2]
        lon, lat = mid[0], mid[1]
    else:
        udata = G.nodes[u]
        vdata = G.nodes[v]
        lat = (float(udata["y"]) + float(vdata["y"])) / 2.0
        lon = (float(udata["x"]) + float(vdata["x"])) / 2.0

    return lat, lon

def build_edge_index(G):
    edge_refs = []
    points = []

    for u, v, key, data in G.edges(keys=True, data=True):
        lat, lon = edge_midpoint_from_data(G, u, v, data)
        x, y = project_lonlat(lat, lon)
        edge_refs.append((u, v, key))
        points.append((x, y))

    tree = cKDTree(points)
    return edge_refs, tree

def parse_int(value):
    try:
        return int(value)
    except Exception:
        return 0

def attach_accidents(G, edge_refs, tree):
    total = 0
    attached = 0

    MAX_DIST_DEG = 0.0005

    with open(ACCIDENTS_FILE, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            total += 1

            try:
                lat = float(row["latitude"])
                lon = float(row["longitude"])
            except Exception:
                continue

            injury = parse_int(row.get("injury", 0))
            death = parse_int(row.get("death", 0))

            x, y = project_lonlat(lat, lon)

            dist, idx = tree.query((x, y))

            if dist > MAX_DIST_DEG:
                continue

            u, v, key = edge_refs[idx]

            edge_data = G[u][v][key]
            edge_data["accident_count"] += 1
            edge_data["injury_count"] += injury
            edge_data["death_count"] += death

            # simple starter risk model
            edge_data["risk_score"] = (
                edge_data["accident_count"]
                + INJURY_WEIGHT * edge_data["injury_count"]
                + DEATH_WEIGHT * edge_data["death_count"]
            )

            attached += 1

    return total, attached

def strip_intermediate_attrs(G):
    for u, v, key, data in G.edges(keys=True, data=True):
        data.pop("injury_count", None)
        data.pop("death_count", None)


def save_graph(G):
    with open(OUTPUT_GRAPH_FILE, "wb") as f:
        pickle.dump(G, f)


if __name__ == "__main__":
    G = load_graph()
    print("Graph loaded")

    init_edge_attributes(G)
    print("Edge attributes initialized")

    edge_refs, tree = build_edge_index(G)
    print("Edge spatial index built")

    total, attached = attach_accidents(G, edge_refs, tree)
    print(f"Processed accidents: {total}")
    print(f"Attached accidents: {attached}")

    strip_intermediate_attrs(G)
    print("Intermediate attributes stripped")
    
    save_graph(G)
    print(f"Saved to {OUTPUT_GRAPH_FILE}")