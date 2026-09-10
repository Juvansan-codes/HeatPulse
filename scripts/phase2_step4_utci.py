import pandas as pd
import numpy as np
import os
from pythermalcomfort.models import utci

def compute_utci(df):
    """
    Compute UTCI using the 6th-order polynomial formulation.
    Requires df to have:
    - temperature_2m (C)
    - mean_radiant_temp (C)
    - wind_speed_10m (m/s)
    - relative_humidity (%)
    """
    
    # 1. Prepare inputs
    ta = df['temperature_2m'].values
    tmrt = df['mean_radiant_temp'].values
    ws_10m = df['wind_speed_10m'].values
    rh = df['relative_humidity'].values
    
    # 2. Calculate UTCI using pythermalcomfort
    # Note: pythermalcomfort takes limit_inputs=False to avoid dropping valid thermal extremes if they fall slightly outside
    # standard bounds (-50 to 50 C air temp, 0.5 to 17 m/s wind). We clip wind speed artificially to 0.5 internally just for the polynomial
    # to avoid blowing up, but UTCI standard says wind < 0.5 should use 0.5.
    
    ws_10m_clipped = np.clip(ws_10m, 0.5, 17.0)
    
    # Execute UTCI
    res = utci(tdb=ta, tr=tmrt, v=ws_10m_clipped, rh=rh, limit_inputs=False)
    
    # 3. Calculate internal vapor pressure used by the UTCI formulation (for validation column)
    # The official polynomial uses Vapor Pressure in kPa
    def exponential(t_db):
        g = [
            -2836.5744, -6028.076559, 19.54263612, -0.02737830188,
            0.000016261698, (7.0229056 * 10**-10), (-1.8680009 * 10**-13)
        ]
        tk = t_db + 273.15  # air temp in K
        es = 2.7150305 * np.log1p(tk)
        for count, i in enumerate(g):
            es = es + (i * np.power(tk, count - 2))
        es = np.exp(es) * 0.01  # convert Pa to hPa
        return es
    
    eh_pa = exponential(ta) * (rh / 100.0)
    pa = eh_pa / 10.0  # kPa
    
    # 4. Extract outputs
    df_out = df.copy()
    df_out['utci'] = res.utci
    df_out['utci_method'] = 'Standard 6th-order Polynomial'
    df_out['utci_vapor_pressure'] = pa # in kPa
    df_out['utci_wind_speed'] = ws_10m_clipped # standard 10m reference
    
    return df_out

if __name__ == "__main__":
    input_path = "data/processed/weather/thermal_step3_wbgt_2014_2023.parquet"
    output_path = "data/processed/weather/thermal_step4_utci_2014_2023.parquet"
    
    print("Loading data...")
    df = pd.read_parquet(input_path)
    
    print("Computing UTCI...")
    df_out = compute_utci(df)
    
    print("Saving to parquet...")
    df_out.to_parquet(output_path, index=False)
    print("Done!")
