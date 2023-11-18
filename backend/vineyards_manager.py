import json
import pathlib
from pydantic import BaseModel
from typing import List, Union

import numpy as np
import pandas as pd


# Class for Vineyards POST input
class Vineyard(BaseModel):
    name: str
    desc: Union[str, None] = None
    lat: float
    lon: float


class VineyardResponse(Vineyard):
    id: int


class VineyardsManager:
    STORAGE_COLS = {
        "id": int,
        "name": str,
        "desc": str,
        "lat": float,
        "lon": float
    }

    def __init__(self, storage_path: str = "vineyards.csv"):
        self._storage_path = storage_path
        self._vineyards = self._load_vineyards()

    def _load_vineyards(self) -> pd.DataFrame:
        if not pathlib.Path(self._storage_path).exists():
            pd.DataFrame(columns=self.STORAGE_COLS).to_csv(self._storage_path, index=False)
        df = pd.read_csv(self._storage_path, dtype=self.STORAGE_COLS).fillna("")

        return df

    def items(self) -> List[dict]:
        if self._vineyards.empty:
            return []

        return self._vineyards.to_dict(orient="records")

    def get(self, vineyard_id: int) -> dict:
        vineyard = self._vineyards.loc[self._vineyards["id"] == vineyard_id]
        if vineyard.empty:
            return None

        return vineyard.to_dict(orient="records")[0]

    def add(self, vineyard_data: dict):
        new_id = self._vineyards["id"].max() + 1 if not self._vineyards.empty else 1
        new_vineyard = pd.DataFrame(
            [[
                new_id,
                vineyard_data.name,
                vineyard_data.desc or "",
                vineyard_data.lat,
                vineyard_data.lon,
            ]],
            columns=self.STORAGE_COLS
        )

        self._vineyards = pd.concat([self._vineyards, new_vineyard])
        self._vineyards.to_csv(self._storage_path, index=False)

        return new_vineyard.to_dict(orient="records")[0]

    def delete(self, vineyard_id: int) -> bool:
        new_vineyards = self._vineyards.loc[self._vineyards["id"] != vineyard_id]
        if len(new_vineyards) == len(self._vineyards):
            return False # not found

        self._vineyards = new_vineyards
        self._vineyards.to_csv(self._storage_path, index=False)

        return True
