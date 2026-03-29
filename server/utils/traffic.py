import os
import math
import time
import requests
from typing import Dict, Set, Tuple, Optional
from scipy.spatial import cKDTree

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "8EdZAw7Pr6qSvZ5dZQNtUZy7aWgK33Iu")

# Incident categories that block roads completely
BLOCKING_CATEGORIES = {6}  # road_closed

# Traffic penalty multipliers by category
TRAFFIC_PENALTIES = {
    1: 2.0,    # accident - double weight
    7: 1.5,    # road_works - 50% slower
    9: 1.3,    # congestion - 30% slower
    3: 1.2,    # dangerous - 20% slower
    14: 1.3,   # broken_vehicle - 30% slower
    2: 1.1,    # fog - 10% slower
}

# Cache for traffic data (TTL: 60 seconds)
_traffic_cache: Dict[str, Tuple[float, dict]] = {}
CACHE_TTL = 60  # seconds

# Cache for edge spatial index (built once per graph)
_edge_index_cache: Dict[int, Tuple[list, cKDTree]] = {}

def fetch_incidents(min_lat: float, min_lng: float, max_lat: float, max_lng: float) -> dict:
    """Fetch traffic incidents from TomTom API with caching"""
    # Round bbox to reduce cache misses
    bbox_key = f"{min_lng:.2f},{min_lat:.2f},{max_lng:.2f},{max_lat:.2f}"

    # Check cache
    if bbox_key in _traffic_cache:
        cached_time, cached_data = _traffic_cache[bbox_key]
        if time.time() - cached_time < CACHE_TTL:
            return cached_data

    bbox = f"{min_lng},{min_lat},{max_lng},{max_lat}"

    url = "https://api.tomtom.com/traffic/services/5/incidentDetails"
    params = {
        "key": TOMTOM_API_KEY,
        "bbox": bbox,
        "fields": "{incidents{type,geometry{type,coordinates},properties{iconCategory,delay}}}",
        "language": "en-GB",
        "timeValidityFilter": "present"
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        # Cache the result
        _traffic_cache[bbox_key] = (time.time(), data)
        return data
    except Exception as e:
        print(f"TomTom API error: {e}")
        # Return cached data if available (even if stale)
        if bbox_key in _traffic_cache:
            return _traffic_cache[bbox_key][1]
        return {"incidents": []}


def build_incident_index(incidents: list, edge_refs: list, edge_tree: cKDTree) -> Tuple[Set[Tuple], Dict[Tuple, float]]:
    """
    Build index of blocked edges and traffic penalties.
    Returns:
        - blocked_edges: set of (u, v, key) tuples for completely blocked roads
        - edge_penalties: dict of (u, v, key) -> penalty multiplier
    """
    blocked_edges: Set[Tuple] = set()
    edge_penalties: Dict[Tuple, float] = {}

    for incident in incidents:
        props = incident.get("properties", {})
        geom = incident.get("geometry", {})
        category = props.get("iconCategory", 0)
        coords = geom.get("coordinates", [])

        if not coords:
            continue

        # Handle both Point and LineString geometries
        if geom.get("type") == "Point":
            points = [coords]
        else:
            points = coords if isinstance(coords[0], list) else [coords]

        # Find edges near incident points
        for point in points:
            if len(point) < 2:
                continue
            lng, lat = point[0], point[1]

            # Project to match edge index
            x = lng * math.cos(math.radians(lat))
            y = lat

            # Find nearest edge (within ~50m)
            dist, idx = edge_tree.query((x, y))
            if dist > 0.001:  # ~100m threshold
                continue

            edge_ref = edge_refs[idx]

            if category in BLOCKING_CATEGORIES:
                blocked_edges.add(edge_ref)
            elif category in TRAFFIC_PENALTIES:
                # Use the highest penalty if multiple incidents affect same edge
                current_penalty = edge_penalties.get(edge_ref, 1.0)
                edge_penalties[edge_ref] = max(current_penalty, TRAFFIC_PENALTIES[category])

    return blocked_edges, edge_penalties


def build_edge_spatial_index(G) -> Tuple[list, cKDTree]:
    """Build spatial index for graph edges (cached per graph)"""
    graph_id = id(G)

    # Return cached index if available
    if graph_id in _edge_index_cache:
        return _edge_index_cache[graph_id]

    print("Building edge spatial index (one-time)...")
    t0 = time.time()

    edge_refs = []
    points = []

    for u, v, key, data in G.edges(keys=True, data=True):
        geom = data.get("geometry")

        if geom is not None:
            coords = list(geom.coords)
            mid = coords[len(coords) // 2]
            lng, lat = mid[0], mid[1]
        else:
            u_data = G.nodes[u]
            v_data = G.nodes[v]
            lat = (float(u_data["y"]) + float(v_data["y"])) / 2.0
            lng = (float(u_data["x"]) + float(v_data["x"])) / 2.0

        x = lng * math.cos(math.radians(lat))
        edge_refs.append((u, v, key))
        points.append((x, lat))

    result = (edge_refs, cKDTree(points))
    _edge_index_cache[graph_id] = result
    print(f"Edge index built in {time.time() - t0:.1f}s")

    return result


def get_traffic_adjustments(G, start_lat: float, start_lng: float, end_lat: float, end_lng: float):
    """
    Fetch current traffic and return blocked edges and penalties.
    Expands bbox slightly around start/end points.
    """
    # Expand bbox by ~5km to cover potential routes
    padding = 0.05  # ~5km
    min_lat = min(start_lat, end_lat) - padding
    max_lat = max(start_lat, end_lat) + padding
    min_lng = min(start_lng, end_lng) - padding
    max_lng = max(start_lng, end_lng) + padding

    # Fetch incidents
    data = fetch_incidents(min_lat, min_lng, max_lat, max_lng)
    incidents = data.get("incidents", [])

    if not incidents:
        return set(), {}

    # Build edge spatial index (could be cached)
    edge_refs, edge_tree = build_edge_spatial_index(G)

    # Match incidents to edges
    return build_incident_index(incidents, edge_refs, edge_tree)