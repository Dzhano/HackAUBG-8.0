import time
from contextlib import asynccontextmanager

import networkx as nx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from shapely.geometry import mapping

from utils.graph import build_kdtree, load_graph, nearest_node, route_to_geometry, get_best_edge

GRAPH_FILE = "./bulgaria-driving-graph-with-accidents.pkl"

graph_state: dict = {}

class Coordinate(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class NavigationRequest(BaseModel):
    start: Coordinate
    end: Coordinate
    risk_factor: float = Field(10.0, ge=0)


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

        rf = req.risk_factor

        def weight_fn(u, v, data):
            best = float("inf")
            edge = get_best_edge(G, u, v)
            length       = edge.get("length", 0.0)
            risk_density = edge.get("risk_density", 0.0)

            # print(f"Length: {edge.get('length', 0.0)}, Risk density: {edge.get('risk_density', 0.0)} RF: {rf}")

            return length + rf * risk_density * length

        path = nx.shortest_path(G, source=start_node, target=end_node, weight=weight_fn)
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

@app.get("/debug/edge-sample")
def debug_edge_sample(count: int = Query(5, ge=1, le=50)):
    G = graph_state["G"]
    sample = []
    for i, (u, v, key, data) in enumerate(G.edges(keys=True, data=True)):
        sample.append({
            "u": u, "v": v, "key": key,
            "keys": list(data.keys()),
            "data": {k: str(v)[:200] for k, v in data.items()},
        })
        if i >= count - 1:
            break
    return sample


@app.get("/navigation")
def navigation_get(
    start_lat: float = Query(..., ge=-90, le=90),
    start_lng: float = Query(..., ge=-180, le=180),
    end_lat: float = Query(..., ge=-90, le=90),
    end_lng: float = Query(..., ge=-180, le=180),
    risk_factor: float = Query(10.0, ge=0),
):
    req = NavigationRequest(
        start=Coordinate(lat=start_lat, lng=start_lng),
        end=Coordinate(lat=end_lat, lng=end_lng),
        risk_factor=risk_factor,
    )
    return navigation(req)
