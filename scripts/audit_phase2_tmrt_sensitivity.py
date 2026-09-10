import pandas as pd
import numpy as np
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../scripts'))
from phase2_step2_tmrt import compute_tmrt

def create_synthetic(time, t2m, d2m, ssrd, lat=13.0, lon=80.2):
    return pd.DataFrame({
        'timestamp': pd.to_datetime([time]),
        'latitude': [lat],
        'longitude': [lon],
        'temperature_2m': [t2m],
        'dew_point_2m': [d2m],
        'solar_radiation': [ssrd]
    })

print("--- 6. Tmrt RESPONSE: SYNTHETIC EXPERIMENTS ---")
base = create_synthetic('2023-05-15 06:30:00', t2m=35.0, d2m=25.0, ssrd=500.0)

# A. Increase solar radiation
exp_A = create_synthetic('2023-05-15 06:30:00', t2m=35.0, d2m=25.0, ssrd=800.0)
tmrt_base = compute_tmrt(base)['mean_radiant_temp'].iloc[0]
tmrt_A = compute_tmrt(exp_A)['mean_radiant_temp'].iloc[0]
print(f"A. Base (500 W/m2) -> High Solar (800 W/m2): {tmrt_base:.2f}C -> {tmrt_A:.2f}C (Change: {tmrt_A - tmrt_base:+.2f}C)")

# B. Increase RH (by increasing d2m)
exp_B = create_synthetic('2023-05-15 06:30:00', t2m=35.0, d2m=30.0, ssrd=500.0)
tmrt_B = compute_tmrt(exp_B)['mean_radiant_temp'].iloc[0]
print(f"B. Base (Td=25C) -> High Humidity (Td=30C): {tmrt_base:.2f}C -> {tmrt_B:.2f}C (Change: {tmrt_B - tmrt_base:+.2f}C)")

# C. Change solar zenith (by shifting time to early morning)
exp_C = create_synthetic('2023-05-15 01:30:00', t2m=35.0, d2m=25.0, ssrd=500.0) # 7:00 AM IST
tmrt_C = compute_tmrt(exp_C)['mean_radiant_temp'].iloc[0]
print(f"C. Base (Noon) -> Early Morning (same 500 W/m2): {tmrt_base:.2f}C -> {tmrt_C:.2f}C (Change: {tmrt_C - tmrt_base:+.2f}C)")

# D. Zero radiation night vs strong radiation day
night = create_synthetic('2023-05-15 18:30:00', t2m=30.0, d2m=25.0, ssrd=0.0)
day = create_synthetic('2023-05-15 06:30:00', t2m=30.0, d2m=25.0, ssrd=1000.0)
tmrt_night = compute_tmrt(night)['mean_radiant_temp'].iloc[0]
tmrt_day = compute_tmrt(day)['mean_radiant_temp'].iloc[0]
print(f"D. Night (0 W/m2, 30C) -> Day (1000 W/m2, 30C): {tmrt_night:.2f}C -> {tmrt_day:.2f}C (Change: {tmrt_day - tmrt_night:+.2f}C)")
