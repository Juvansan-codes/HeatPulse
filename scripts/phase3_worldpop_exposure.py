"""Build the derived WorldPop 2020 exposure layer for official GCC 2025 wards.

Successful polygon responses are cached by ward so an interrupted public-API run
can resume without resubmitting completed geometries.
"""
from __future__ import annotations

import concurrent.futures
import json
import os
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import pandas as pd

ROOT = Path(__file__).parents[1]
GEO = ROOT / "data/raw/gis/gcc/EDP_wardBoundary_2025.geojson"
OUT = ROOT / "data/processed/gis/ward_exposure_200.csv"
META = ROOT / "data/validation/gis/ward_exposure_200_metadata.json"
CACHE = ROOT / "data/validation/gis/worldpop_2020_ward_cache.json"
API = "https://api.worldpop.org/v2"
WORKERS = 3


def _request(url: str, payload: dict | None = None, attempts: int = 5) -> dict:
    """Make a retrying API request; public-service throttling is transient."""
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"} if body else {}
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = Request(url, data=body, headers=headers)
            with urlopen(request, timeout=90) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError) as error:
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(min(20, 1.5 * (2**attempt)))
    raise RuntimeError(f"WorldPop request failed after {attempts} attempts: {url}") from last_error


def _population(feature: dict) -> dict:
    """Submit one ward polygon and wait for its count result."""
    submitted = _request(
        f"{API}/population",
        {"geojson": feature["geometry"], "year": 2020, "resolution": "100m"},
    )
    task_id = submitted["task_id"]
    for _ in range(90):
        status = _request(f"{API}/tasks/{task_id}")
        if status.get("status") == "success":
            result = status.get("result")
            if not isinstance(result, dict) or "total_population" not in result:
                raise RuntimeError(f"WorldPop task returned no total population: {task_id}")
            return result
        if status.get("status") in {"failed", "error"}:
            raise RuntimeError(f"WorldPop task failed: {task_id}: {status}")
        time.sleep(1)
    raise TimeoutError(f"WorldPop task did not finish within 90 seconds: {task_id}")


def _read_cache() -> dict[str, dict]:
    if not CACHE.exists():
        return {}
    cached = json.loads(CACHE.read_text(encoding="utf-8"))
    return cached if isinstance(cached, dict) else {}


def _write_cache(cache: dict[str, dict]) -> None:
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    temporary = CACHE.with_suffix(".tmp")
    temporary.write_text(json.dumps(cache, indent=2, sort_keys=True), encoding="utf-8")
    os.replace(temporary, CACHE)


def _summary(df: pd.DataFrame) -> dict:
    def stats(column: str) -> dict:
        return {key: float(df[column].agg(key)) for key in ("sum", "min", "max", "median")}

    return {
        "rows": len(df),
        "ward_id_range": [int(df.ward_id.min()), int(df.ward_id.max())],
        "population_statistics": stats("population"),
        "population_density_statistics": stats("population_density"),
        "top_10_wards_by_population": df.nlargest(10, "population")[["ward_id", "population"]].to_dict("records"),
        "bottom_10_wards_by_population": df.nsmallest(10, "population")[["ward_id", "population"]].to_dict("records"),
        "method": "WorldPop API direct zonal aggregation",
        "limitations": "WorldPop modeled 2020 population; neither an official Census count nor a household, child, sensitivity, vulnerability, or medical-risk estimate.",
    }


def main() -> None:
    raw = json.loads(GEO.read_text(encoding="utf-8"))
    features = sorted(raw["features"], key=lambda feature: int(feature["properties"]["ward"]))
    if [int(feature["properties"]["ward"]) for feature in features] != list(range(1, 201)):
        raise ValueError("Official geometry does not contain exactly wards 1--200")

    cache = _read_cache()
    missing = [feature for feature in features if str(int(feature["properties"]["ward"])) not in cache]
    print(f"WorldPop cache: {len(cache)} completed wards; requesting {len(missing)} remaining wards.")
    if missing:
        with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
            futures = {pool.submit(_population, feature): feature for feature in missing}
            for future in concurrent.futures.as_completed(futures):
                feature = futures[future]
                ward_id = str(int(feature["properties"]["ward"]))
                cache[ward_id] = future.result()
                _write_cache(cache)
                print(f"Cached ward {ward_id} ({len(cache)}/200).", flush=True)

    rows = []
    for feature in features:
        properties = feature["properties"]
        ward_id = int(properties["ward"])
        result = cache[str(ward_id)]
        area = float(properties["Shape__Area"]) / 1_000_000
        population = float(result["total_population"])
        rows.append({
            "ward_id": ward_id,
            "zone_id": properties["zone_id"],
            "zone": properties["zone"],
            "area_km2": area,
            "population": population,
            "population_density": population / area,
            "population_source": "WorldPop R2025A 2020 100m API",
            "population_method": "Direct zonal aggregation of modeled 100 m population counts over the official GCC 2025 ward polygon",
            "population_vintage": 2020,
            "population_is_derived": True,
            "population_confidence": "MEDIUM",
        })
    df = pd.DataFrame(rows).sort_values("ward_id")
    if len(df) != 200 or df.ward_id.nunique() != 200 or not (df.population >= 0).all():
        raise ValueError("Exposure quality control failed")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)
    META.parent.mkdir(parents=True, exist_ok=True)
    META.write_text(json.dumps(_summary(df), indent=2), encoding="utf-8")
    print(json.dumps(_summary(df), indent=2))


if __name__ == "__main__":
    main()
