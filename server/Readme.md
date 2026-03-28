# Installation
```
conda create -n map-path python=3.10
conda activate map-path
conda install -c conda-forge pyrosm networkx fastapi uvicorn scipy shapely geopandas
```

# How to start

`uvicorn main:app --reload --port 8000`