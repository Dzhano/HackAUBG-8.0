import pickle

GRAPH_FILE = "./graph-transformation/bulgaria-driving-graph-with-accidents.pkl"

with open(GRAPH_FILE, "rb") as f:
    G = pickle.load(f)

print("Nodes:", G.number_of_nodes())
print("Edges:", G.number_of_edges())

print("\nFirst 20 edges with accidents:")
count = 0

for u, v, key, data in G.edges(keys=True, data=True):
    if data.get("accident_count", 0) > 0:
        geom = data.get("geometry")
        coords_preview = list(geom.coords)[:5] if geom is not None else None

        print({
            "u": u,
            "v": v,
            "key": key,
            "length": data.get("length"),
            "accident_count": data.get("accident_count"),
            "injury_count": data.get("injury_count"),
            "death_count": data.get("death_count"),
            "risk_weight": data.get("risk_weight"),
            "name": data.get("name"),
            "highway": data.get("highway"),
            "coords_preview": coords_preview
        })
        count += 1
        if count == 20:
            break