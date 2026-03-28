import math
import pickle
import time
from contextlib import asynccontextmanager
from pathlib import Path

import networkx as nx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from scipy.spatial import cKDTree
from shapely.geometry import LineString, mapping

GRAPH_FILE = "./bulgaria-driving-graph-with-accidents.pkl"

graph_state: dict = {}

class Coordinate(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class NavigationRequest(BaseModel):
    start: Coordinate
    end: Coordinate


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    t0 = time.time()
    print("Loading graph…")
    G = load_graph(GRAPH_FILE)
    node_ids, tree = build_kdtree(G)
    graph_state["G"] = G
    graph_state["node_ids"] = node_ids
    graph_state["tree"] = tree
    print(f"Graph ready in {time.time() - t0:.1f}s ({G.number_of_nodes()} nodes, {G.number_of_edges()} edges)")
    yield
    graph_state.clear()

app = FastAPI(title="Map Path Navigation", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/navigation")
def navigation(req: NavigationRequest):
    G = graph_state["G"]
    node_ids = graph_state["node_ids"]
    tree = graph_state["tree"]

    try:
        start_node = nearest_node(req.start.lat, req.start.lng, node_ids, tree)
        end_node = nearest_node(req.end.lat, req.end.lng, node_ids, tree)

        path = nx.shortest_path(G, source=start_node, target=end_node, weight="risk_weight")
        line, distance_m = route_to_geometry(G, path)

        return {
            "distance_m": distance_m,
            "node_count": len(path),
            "start_node": start_node,
            "end_node": end_node,
            "geometry": mapping(line),
        }

    except nx.NetworkXNoPath:
        raise HTTPException(status_code=404, detail="No route found between the given points")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/navigation")
def navigation_get(
    start_lat: float = Query(..., ge=-90, le=90),
    start_lng: float = Query(..., ge=-180, le=180),
    end_lat: float = Query(..., ge=-90, le=90),
    end_lng: float = Query(..., ge=-180, le=180),
):
    req = NavigationRequest(
        start=Coordinate(lat=start_lat, lng=start_lng),
        end=Coordinate(lat=end_lat, lng=end_lng),
    )
    return navigation(req)
