import itertools
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from shapely.geometry import mapping
from shapely.geometry.base import BaseGeometry

from utils.graph import build_kdtree, load_graph, nearest_node, route_to_geometry, get_best_edge
from utils.pathfinder import find_path

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

@app.get("/edges/preview")
def preview_edges(limit: int = Query(40, ge=1, le=500)):
    G = graph_state["G"]
    edges = []
    for u, v, data in itertools.islice(G.edges(data=True), limit):
        edge = {"u": u, "v": v}
        for key, val in data.items():
            if isinstance(val, BaseGeometry):
                edge[key] = mapping(val)
            else:
                edge[key] = val
        edges.append(edge)

    return {"count": len(edges), "edges": edges}

@app.post("/navigation")
def navigation(req: NavigationRequest):
    current = find_path(graph_state, req.start, req.end, req.risk_factor)
    shortest = None
    safest = find_path(graph_state, req.start, req.end, req.risk_factor * 2.5)
    
    if req.risk_factor != 0:
        shortest = find_path(graph_state, req.start, req.end, 0)

    return {
        "current": current,
        "shortest": shortest,
        "safest": safest,
    }

