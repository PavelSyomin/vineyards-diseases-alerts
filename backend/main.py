import json
from typing import List, Optional, Tuple, Union

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import geopandas as gpd
import openmeteo_requests
from pydantic import BaseModel
import requests_cache
from retry_requests import retry

from alertmaker import Alertmaker, AlertData, Point
from vineyards_manager import Vineyard, VineyardResponse, VineyardsManager


# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.app_cache', expire_after = -1)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

# Instantiate Alertmaker and VineyardsManager
am = Alertmaker(client=openmeteo)
v = VineyardsManager(storage_path="vineyards.csv")

# Create app
app = FastAPI()

# CORS setup
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8080",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Contour(BaseModel):
    id: int
    geometry: List[List[Tuple[float, float]]]


@app.get("/health")
def health():
    """
    Check service status
    """

    return {"status": "OK"}


@app.get("/vineyards", response_model=List[VineyardResponse])
def get_vineyards():
    """
    Get list of all vineyards
    """

    return v.items()


@app.post("/vineyards", status_code=status.HTTP_201_CREATED, response_model=VineyardResponse)
def post_vineyards(vineyard: Vineyard):
    """
    Add a new vineyard
    """

    created = v.add(vineyard)

    return created


@app.get("/vineyards/{vid}", response_model=VineyardResponse)
def get_vineyard_by_id(vid: int):
    """
    Get vineyard by its id
    """

    vineyard = v.get(vid)
    if vineyard is None:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=None)

    return vineyard


@app.delete("/vineyards/{vid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vineyard_by_id(vid: int):
    result = v.delete(vid)
    if not result:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=None)

    return {"status": "deleted"}


@app.get("/vineyards/{vid}/alerts", response_model=AlertData)
def get_vineyard_alerts_by_id(vid: int, date: str = None):
    """
    Get alerts and weather for vineyard
    """

    vineyard = get_vineyard_by_id(vid)
    if vineyard is None:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=None)

    point = Point(vineyard["lat"], vineyard["lon"])
    resp = am.alerts(point, date)

    return resp


@app.get("/map", response_model=List[Contour])
def get_map():
    """
    Get grid map of alert statuses for the whole region
    """
    grid = gpd.read_file("grid.geojson")
    centroids = gpd.read_file("grid_centroids.geojson")

    contours = json.loads(grid[["id", "geometry"]].to_json()).get("features", [])
    contours = [
        {
            "id": contour["id"],
            "geometry": contour["geometry"]["coordinates"],
        }
        for contour in contours
    ]

    return contours
