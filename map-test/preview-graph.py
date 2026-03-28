import pickle

GRAPH_FILE = "bulgaria-driving-graph.pkl"

with open(GRAPH_FILE, "rb") as f:
    G = pickle.load(f)

print("Graph type:", type(G))
print("Nodes:", G.number_of_nodes())
print("Edges:", G.number_of_edges())

print("\nFirst 20 nodes:")
for i, (node_id, data) in enumerate(G.nodes(data=True)):
    if i >= 20:
        break
    print(node_id, data)

print("\nFirst 20 edges:")
for i, (u, v, key, data) in enumerate(G.edges(keys=True, data=True)):
    if i >= 20:
        break
    print(f"{u} -> {v} (key={key})", data)