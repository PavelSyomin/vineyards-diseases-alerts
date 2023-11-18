from typing import List, Optional, Union

from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
import openmeteo_requests
import requests_cache
from retry_requests import retry

from alertmaker import Alertmaker, AlertData, Point
from vineyards_manager import Vineyard, VineyardResponse, VineyardsManager


# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.app_cache', expire_after = -1)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

# Instantiate Alertmaker
am = Alertmaker(client=openmeteo)
v = VineyardsManager(storage_path="vineyards.csv")


app = FastAPI()


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


