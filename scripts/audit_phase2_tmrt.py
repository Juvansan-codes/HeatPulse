import pandas as pd
import numpy as np
import os
import sys

def run_audit():
    df = pd.read_parquet('data/processed/weather/thermal_step2_tmrt_2014_2023.parquet')
    
    print("--- 1. NIGHTTIME Tmrt ---")
    night = df[df['solar_elevation_deg'] <= 0]
    ta = night['temperature_2m']
    tmrt = night['mean_radiant_temp']
    diff = tmrt - ta
    
    print(f"Ta Night: min={ta.min():.2f}, mean={ta.mean():.2f}")
    print(f"Tmrt Night: min={tmrt.min():.2f}, mean={tmrt.mean():.2f}")
    print(f"Tmrt - Ta: min={diff.min():.2f}, mean={diff.mean():.2f}")
    
    b0_5 = ((diff < 0) & (diff >= -5)).sum()
    b5_10 = ((diff < -5) & (diff >= -10)).sum()
    b10_15 = ((diff < -10) & (diff >= -15)).sum()
    b15_plus = (diff < -15).sum()
    total_night = len(night)
    
    print(f"Tmrt < Ta by 0-5C: {b0_5} ({b0_5/total_night*100:.2f}%)")
    print(f"Tmrt < Ta by 5-10C: {b5_10} ({b5_10/total_night*100:.2f}%)")
    print(f"Tmrt < Ta by 10-15C: {b10_15} ({b10_15/total_night*100:.2f}%)")
    print(f"Tmrt < Ta by >15C: {b15_plus} ({b15_plus/total_night*100:.2f}%)")
    
    print("\n--- 2. EXTREME Tmrt ---")
    cols = ['timestamp', 'latitude', 'temperature_2m', 'relative_humidity', 'solar_radiation', 
            'solar_zenith_deg', 'direct_horizontal_radiation', 'diffuse_horizontal_radiation', 
            'reflected_radiation', 'longwave_down', 'longwave_up', 'mean_radiant_temp']
    print("Top 20 Highest Tmrt:")
    print(df[cols].nlargest(20, 'mean_radiant_temp').to_string(index=False))
    
    print("Top 20 Lowest Tmrt:")
    print(df[cols].nsmallest(20, 'mean_radiant_temp').to_string(index=False))
    
    print("\n--- 4. DNI CAP ANALYSIS ---")
    # To audit the cap, we need to recalculate uncapped DNI
    sys.path.append(os.path.join(os.path.dirname(__file__), '../scripts'))
    from phase2_step2_tmrt import calculate_solar_geometry
    
    zenith_rad, zenith_deg, elevation_deg, I0 = calculate_solar_geometry(df)
    cos_zenith = np.cos(zenith_rad)
    cos_z_safe = np.where(cos_zenith < 0.01745, 0.01745, cos_zenith)
    
    # Recalculate original K_dir without cap
    ghi = df['solar_radiation'].clip(lower=0)
    G0 = np.where(cos_zenith > 0, I0 * cos_zenith, 0)
    kt = np.where(G0 > 0, np.clip(ghi / G0, 0, 1), 0)
    
    diffuse_fraction = np.zeros_like(kt)
    mask1 = kt <= 0.22
    mask2 = (kt > 0.22) & (kt <= 0.80)
    mask3 = kt > 0.80
    diffuse_fraction[mask1] = 1.0 - 0.09 * kt[mask1]
    diffuse_fraction[mask2] = (0.9511 - 0.1604 * kt[mask2] + 4.388 * (kt[mask2]**2) - 
                               16.638 * (kt[mask2]**3) + 12.336 * (kt[mask2]**4))
    diffuse_fraction[mask3] = 0.165
    diffuse_fraction = np.clip(diffuse_fraction, 0.0, 1.0)
    
    K_diff_uncapped = ghi * diffuse_fraction
    K_dir_horiz_uncapped = ghi - K_diff_uncapped
    K_dir_uncapped = K_dir_horiz_uncapped / cos_z_safe
    
    night_mask = elevation_deg <= 0
    K_dir_uncapped = np.where(night_mask, 0.0, K_dir_uncapped)
    
    max_k_dir = I0 * 0.9
    cap_mask = K_dir_uncapped > max_k_dir
    daytime_mask = elevation_deg > 0
    total_daytime = daytime_mask.sum()
    hit_cap = (cap_mask & daytime_mask).sum()
    
    print(f"Total daytime obs hitting cap: {hit_cap} ({hit_cap/total_daytime*100:.4f}%)")
    print(f"Max uncapped DNI: {K_dir_uncapped.max():.2f}")
    # Calculate capped max by replacing > max_k_dir with max_k_dir
    K_dir_capped = np.where(cap_mask, max_k_dir, K_dir_uncapped)
    print(f"Max capped DNI: {K_dir_capped.max():.2f}")
    
    print("\n--- 5. ENERGY CONSERVATION ---")
    diff = df['solar_radiation'] - (df['direct_horizontal_radiation'] + df['diffuse_horizontal_radiation'])
    print(f"Max energy conservation error (GHI - (DirH + DiffH)): {diff.abs().max():.6e}")
    
    print("\n--- 7. SPATIAL CONSISTENCY ---")
    spatial = df.groupby('latitude')['mean_radiant_temp'].agg(
        mean='mean',
        median='median',
        p05=lambda x: np.percentile(x, 5),
        p95=lambda x: np.percentile(x, 95),
        max='max'
    )
    print(spatial)

if __name__ == '__main__':
    run_audit()
