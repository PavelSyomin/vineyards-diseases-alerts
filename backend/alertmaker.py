from collections import namedtuple
import datetime
from itertools import groupby
import datetime
import logging
from typing import Dict, List, Optional

import openmeteo_requests
from openmeteo_sdk.WeatherApiResponse import WeatherApiResponse
import pandas as pd
from pydantic import BaseModel
import requests_cache
from retry_requests import retry


Interval = namedtuple("Interval", ["start", "end"])
Point = namedtuple("Point", ["lat", "lon"])


class Alerts(BaseModel):
    name: str
    type: str
    dt: List[str]


class Weather(BaseModel):
    dt: datetime.datetime
    t: float
    h: float


class AlertData(BaseModel):
    alerts: List[Alerts]
    weather: List[Weather]


class Alertmaker:
    FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast"
    HISTORY_ENDPOINT = "https://archive-api.open-meteo.com/v1/archive"
    HISTORY_DELAY = 2
    TARGET_VARS = ["temperature_2m", "relative_humidity_2m"]
    TZ = "Europe/Moscow"

    def __init__(self, client: openmeteo_requests.Client, diseases_path: str = "diseases.csv"):
        self._diseases = pd.read_csv(diseases_path)
        self._logger = logging.getLogger("alertmaker")
        self._client = client

        self._max_history_date = (
            datetime.date.today()
            - datetime.timedelta(days=self.HISTORY_DELAY)
        ).isoformat()

    def alerts(
        self,
        point: Point,
        date: Optional[str] = None,
        back: int = 2,
        forward: int = 7,
        threshold: int = 3
    ) -> Dict[dict, dict]:
        data = self._get_weather(point, date, back, forward)
        alerts = self._get_alerts(data, threshold)

        return {
            "alerts": alerts,
            "weather": data.to_dict(orient="records"),
        }

    def _get_weather(self, point: Point, date: Optional[str] = None, back: int = 2, forward: int = 7):
        if date is None:
            # Get for today
            data = self._get_forecast_data(point, back, forward)
        else:
            interval = self._get_interval_from_date(date, back, forward)
            if interval.end <= self._max_history_date:
                data = self._get_historical_data(point, interval)
            else:
                forecast_days = (
                    datetime.date.fromisoformat(interval.end)
                    - datetime.date.fromisoformat(self._max_history_date)
                ).days
                interval = Interval(start=interval.start, end=self._max_history_date)
                historical_data = self._get_historical_data(point, interval)
                forecast_data = self._get_forecast_data(point, self.HISTORY_DELAY, forecast_days)
                data = pd.concat([historical_data, forecast_data]).drop_duplicates(subset="dt")

        return data

    def _get_historical_data(self, point: Point, interval: Interval):
        params = {
            "latitude": point.lat,
            "longitude": point.lon,
            "start_date": interval.start,
            "end_date": interval.end,
            "hourly": self.TARGET_VARS,
            "timezone": self.TZ,
        }
        try:
            responses = self._client.weather_api(self.HISTORY_ENDPOINT, params=params)
        except Exception as e:
            self._logger.error(f"Cannot get history data for {point=}, {interval=}: {e}")
            return pd.DataFrame()

        if not self._check_responses(responses):
            return pd.DataFrame()

        return self._make_dataframe_from_response(responses[0])

    def _get_forecast_data(self, point: Point, past_days: int = 2, forecast_days: int = 7):
        params = {
            "latitude": point.lat,
            "longitude": point.lon,
            "hourly": self.TARGET_VARS,
            "timezone": self.TZ,
            "past_days": past_days,
            "forecast_days": forecast_days,
        }
        try:
            responses = self._client.weather_api(self.FORECAST_ENDPOINT, params=params)
        except Exception as e:
            self._logger.error(f"Cannot get forecast for {point=}, {past_days=}, {forecast_days=}: {e}")
            return pd.DataFrame()

        if not self._check_responses(responses):
            return pd.DataFrame()

        return self._make_dataframe_from_response(responses[0])

    def _get_alerts(self, data: pd.DataFrame, threshold: int = 3):
        alerts = []

        for disease in self._diseases.itertuples(index=False):
            print(f"Checking {disease.name}")
            optimal = []
            potential = []
            for day in data.itertuples(index=False):
                conditions_optimal = (
                    disease.t_optimal_min < day.t < disease.t_optimal_max
                    and disease.h_optimal_min < day.h < disease.h_optimal_max
                )
                optimal.append(conditions_optimal)

                conditions_potential = (
                    disease.t_begin_min < day.t < disease.t_begin_max
                    and disease.h_begin_min < day.h < disease.h_begin_max
                )
                potential.append(conditions_potential)

            optimal_mask = []
            for g in [list(g) for _, g in groupby(optimal)]:
                if sum(g) >= threshold:
                    optimal_mask.extend(g)
                else:
                    optimal_mask.extend(False for _ in g)

            potential_mask = []
            for g in [list(g) for _, g in groupby(potential)]:
                if sum(g) >= threshold:
                    potential_mask.extend(g)
                else:
                    potential_mask.extend(False for _ in g)

            if len(data["dt"][optimal_mask]) > 0:
                alerts.append({
                    "name": disease.name,
                    "type": "red",
                    "dt": data["dt"][optimal_mask].astype(str).values
                })

            if len(data["dt"][potential_mask]) > 0:
                alerts.append({
                    "name": disease.name,
                    "type": "yellow",
                    "dt": data["dt"][potential_mask].astype(str).values
                })

        return alerts

    def _make_dataframe_from_response(self, response: WeatherApiResponse):
        hourly_data = response.Hourly()
        temperature = hourly_data.Variables(0).ValuesAsNumpy()
        humidity = hourly_data.Variables(1).ValuesAsNumpy()
        datetime = pd.date_range(
            start = pd.to_datetime(hourly_data.Time(), unit="s"),
            end = pd.to_datetime(hourly_data.TimeEnd(), unit="s"),
            freq = pd.Timedelta(seconds=hourly_data.Interval()),
            inclusive = "left"
        )

        df = pd.DataFrame({
            "dt": datetime,
            "t": temperature,
            "h": humidity,
        })

        df = df.resample("1D", on="dt").median().reset_index()

        return df

    def _check_responses(self, responses: List[WeatherApiResponse]):
        if len(responses) == 0:
            self._logger.error("Empty response")
            return False

        if responses[0].Hourly().VariablesLength() != len(self.TARGET_VARS):
            self._logger.error("Cannot get all requested variables")
            return False

        return True

    def _get_interval_from_date(self, date: str, back: int, forward: int) -> Interval:
        date = datetime.date.fromisoformat(date)
        start = date - datetime.timedelta(days=back)
        end = date + datetime.timedelta(days=forward)

        return Interval(start=start.isoformat(), end=end.isoformat())
