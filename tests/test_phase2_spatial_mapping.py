import os
import math
import pandas as pd
import pytest
from pathlib import Path
import sys

# Add scripts directory to path to import haversine
sys.path.append(os.path.join(os.path.dirname(__file__), '../scripts'))
from phase2_step1_spatial_mapping import haversine, VALID_GRID_CELLS

MAPPING_FILE = Path("data/processed/gis/spatial_ward_mapping.csv")

@pytest.fixture
def mapping_df():
    assert MAPPING_FILE.exists(), f"Mapping file {MAPPING_FILE} not found."
    return pd.read_csv(MAPPING_FILE)

def test_exactly_200_wards(mapping_df):
    """Test that exactly 200 GCC wards are mapped."""
    assert len(mapping_df) == 200, f"Expected exactly 200 wards, but found {len(mapping_df)}."

def test_no_duplicate_ward_ids(mapping_df):
    """Test that no duplicate ward IDs exist."""
    assert mapping_df['ward_id'].nunique() == len(mapping_df), "Duplicate ward IDs found."

def test_ward_0_excluded(mapping_df):
    """Test that Ward_No=0 is excluded."""
    assert 0 not in mapping_df['ward_id'].values, "Ward_No=0 was not excluded."

def test_exactly_one_assigned_grid_id(mapping_df):
    """Test that every ward has exactly one assigned grid_id."""
    assert mapping_df['assigned_grid_id'].notna().all(), "Some wards are missing an assigned grid_id."

def test_assigned_grid_id_exists(mapping_df):
    """Test that assigned grid_id exists in the weather dataset (represented by VALID_GRID_CELLS)."""
    valid_ids = set([g['grid_id'] for g in VALID_GRID_CELLS])
    assigned_ids = set(mapping_df['assigned_grid_id'].unique())
    assert assigned_ids.issubset(valid_ids), f"Found invalid grid IDs: {assigned_ids - valid_ids}"

def test_distances_non_negative(mapping_df):
    """Test that distances are non-negative."""
    assert (mapping_df['distance_km'] >= 0).all(), "Negative distances found."

def test_nearest_neighbor_mathematically_correct(mapping_df):
    """Test that nearest-neighbor assignment is mathematically correct."""
    for idx, row in mapping_df.iterrows():
        c_lat = row['centroid_lat']
        c_lon = row['centroid_lon']
        assigned_id = row['assigned_grid_id']
        assigned_dist = row['distance_km']
        
        # Recalculate minimum distance
        min_dist = float('inf')
        best_id = None
        for g in VALID_GRID_CELLS:
            dist = haversine(c_lat, c_lon, g['lat'], g['lon'])
            if dist < min_dist:
                min_dist = dist
                best_id = g['grid_id']
        
        assert assigned_id == best_id, f"Ward {row['ward_id']} incorrectly assigned to {assigned_id} instead of {best_id}"
        assert abs(assigned_dist - min_dist) <= 0.01, f"Distance mismatch for Ward {row['ward_id']}: {assigned_dist} != {min_dist}"
