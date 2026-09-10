import os
import requests
import pandas as pd

RAW_CENSUS_DIR = r"data\raw\demographics\census"
VALIDATION_FILE = r"data\validation\census\census_alignment_report.txt"

CENSUS_URL = "https://data.opencity.in/dataset/db288d43-56e3-48f4-9932-710d80872155/resource/14e58af6-7ed9-4445-bb47-acc931364c12/download/af83d302-a504-479a-8be9-b3208eb5b6e7.csv"
RAW_FILE_PATH = os.path.join(RAW_CENSUS_DIR, "chennai_census_2011.csv")

def run():
    print("Starting Phase 1B: Census Geography Validation")
    
    # 1. Acquire relevant official Census 2011 Chennai ward data.
    print(f"Downloading from {CENSUS_URL}...")
    response = requests.get(CENSUS_URL)
    response.raise_for_status()
    
    with open(RAW_FILE_PATH, 'wb') as f:
        f.write(response.content)
    print(f"Saved raw Census CSV to {RAW_FILE_PATH}")
    
    # 2. Inspect ward identifiers and names.
    df = pd.read_csv(RAW_FILE_PATH)
    print(f"Loaded DataFrame with shape: {df.shape}")
    print("Columns available:", df.columns.tolist())
    
    # Try to find a ward identifier column
    ward_col = None
    for col in df.columns:
        if 'ward' in col.lower():
            ward_col = col
            break
            
    if ward_col:
        unique_census_wards = df[ward_col].nunique()
        print(f"Census Wards found: {unique_census_wards} based on column '{ward_col}'")
    else:
        print("WARNING: Could not automatically detect a ward column.")
        unique_census_wards = len(df)
        
    # 3. Compare Census geography with current GCC ward geography.
    gcc_wards = 201 # from phase 1A
    
    # 4 & 5 & 6 & 7. Document the alignment approach.
    with open(VALIDATION_FILE, 'w') as f:
        f.write("Census to GCC Ward Alignment Report\n")
        f.write("=====================================\n\n")
        f.write(f"GCC Current Wards (from GeoJSON): {gcc_wards}\n")
        f.write(f"Census 2011 Wards (from OpenCity CSV): {unique_census_wards}\n\n")
        f.write("ANALYSIS:\n")
        if unique_census_wards < 200:
            f.write("The Census 2011 dataset reflects the older 155-ward structure before the 2011 Greater Chennai Corporation expansion (which resulted in 200 wards).\n")
            f.write("Direct 1:1 join is IMPOSSIBLE without an area-based crosswalk or official mapping.\n\n")
            f.write("RECOMMENDED DEMOGRAPHIC MAPPING APPROACH:\n")
            f.write("1. Acquire an area-weighted crosswalk linking the old 155 wards to the new 200 wards.\n")
            f.write("2. Multiply population counts by the intersection area proportion of the new wards.\n")
            f.write("3. Alternatively, use uniform distribution based on current ward geometry area.\n")
            f.write("NOTE: Final vulnerability scores should not be strictly calculated until this mapping is resolved.\n")
        else:
            f.write("The Census dataset has around 200 wards, which might allow direct mapping to the current GCC geography. However, exact ID and name matching must still be carefully validated.\n")
            
    print(f"Saved alignment report to {VALIDATION_FILE}")

if __name__ == "__main__":
    run()
