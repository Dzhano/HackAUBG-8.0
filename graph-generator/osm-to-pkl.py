from pyrosm import OSM
import pickle

osm = OSM("./raw-data/bulgaria-latest.osm.pbf")
nodes, edges = osm.get_network(network_type="driving", nodes=True)
G = osm.to_graph(nodes, edges, graph_type="networkx")

with open("bulgaria-slice-driving-graph-all.pkl", "wb") as f:
    pickle.dump(G, f)