import pandas as pd
import numpy as np
import os
from metpy.units import units
from pywbgt.liljegren import wetbulb_globe

def compute_wbgt_outdoor(df):
    """
    Compute Outdoor WBGT using Liljegren et al. (2008).
    Requires df to have:
    - timestamp (UTC)
    - latitude, longitude
    - temperature_2m (C)
    - dew_point_2m (C)
    - wind_speed_10m (m/s)
    - surface_pressure (Pa)
    - solar_radiation (W/m^2) [This is GHI]
    """
    
    # 1. Prepare inputs with units
    dt_index = pd.DatetimeIndex(df['timestamp'])
    lat = df['latitude'].values
    lon = df['longitude'].values
    
    # Clip negative radiation to 0 (nighttime)
    ghi = df['solar_radiation'].clip(lower=0).values * units('W/m^2')
    
    # Surface pressure in hPa
    pres = (df['surface_pressure'].values / 100.0) * units.hPa
    
    ta = df['temperature_2m'].values * units.degC
    td = df['dew_point_2m'].values * units.degC
    
    # Wind speed at 10m
    ws = df['wind_speed_10m'].values * units('m/s')
    
    # 2. Run Liljegren WBGT
    # We specify urban=True for Chennai, and zspeed=10m to automatically scale to 2m reference height.
    urban_flag = np.ones_like(lat) # 1 = urban
    
    results = wetbulb_globe(
        datetime=dt_index,
        lat=lat,
        lon=lon,
        solar=ghi,
        pres=pres,
        temp_air=ta,
        temp_dew=td,
        speed=ws,
        urban=urban_flag,
        zspeed=10.0 * units.meter,
        min_speed=0.1 * units('m/s')
    )
    
    # 3. Extract outputs
    df_out = df.copy()
    df_out['wbgt_outdoor'] = results['Twbg'].m
    df_out['wbgt_method'] = 'Liljegren (2008)'
    df_out['wind_speed_reference'] = results['speed'].m # The 2m adjusted wind speed
    
    # Calculate Vapor Pressure manually (Tetens formula)
    ta_c = df['temperature_2m'].values
    rh = df['relative_humidity'].values
    es = 6.105 * np.exp((17.27 * ta_c) / (237.7 + ta_c))
    df_out['vapor_pressure'] = (rh / 100.0) * es
    
    return df_out

if __name__ == "__main__":
    input_path = "data/processed/weather/thermal_step2_tmrt_2014_2023.parquet"
    output_path = "data/processed/weather/thermal_step3_wbgt_2014_2023.parquet"
    
    print("Loading data...")
    df = pd.read_parquet(input_path)
    
    print("Computing Outdoor WBGT (Liljegren)...")
    df_out = compute_wbgt_outdoor(df)
    
    print("Saving to parquet...")
    df_out.to_parquet(output_path, index=False)
    print("Done!")
