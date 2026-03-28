# Installation

conda create -n map-path python=3.10
conda activate map-path
conda install -c conda-forge pyrosm networkx fastapi uvicorn scipy shapely geopandas

# How to run

python generate-route.py (It generates a JSON route to be used in the lefletJS map)
