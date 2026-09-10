import pandas as pd
import numpy as np

def run_wbgt_audit():
    print("Loading data...")
    df = pd.read_parquet('data/processed/weather/thermal_step3_wbgt_2014_2023.parquet')
    
    print("\n--- 10-YEAR WBGT STATISTICS ---")
    wbgt = df['wbgt_outdoor']
    print(f"Min: {wbgt.min():.2f}")
    print(f"Max: {wbgt.max():.2f}")
    print(f"Mean: {wbgt.mean():.2f}")
    print(f"Median: {wbgt.median():.2f}")
    print(f"5th Percentile: {wbgt.quantile(0.05):.2f}")
    print(f"95th Percentile: {wbgt.quantile(0.95):.2f}")
    print(f"Missing (NaN): {wbgt.isna().sum()}")
    
    suspicious_high = (wbgt > 45).sum()
    suspicious_low = (wbgt < 0).sum()
    print(f"Suspicious (>45C): {suspicious_high}")
    print(f"Suspicious (<0C): {suspicious_low}")
    
    print("\n--- REFERENCE VALIDATION ---")
    # Liljegren formulation: WBGT = 0.7 * Tnwb + 0.2 * Tg + 0.1 * Ta
    # We will pick a few random rows and explicitly calculate this using pywbgt outputs if we had them.
    # Since we only saved Twbg, let's just show that at night (GHI=0), WBGT is approx indoor WBGT (which pywbgt can compute).
    from pywbgt.liljegren import wetbulb_globe
    from metpy.units import units
    import time
    
    # Controlled case 1: Hot and humid, sunny
    dt = pd.DatetimeIndex(['2023-05-15 12:00:00'])
    res1 = wetbulb_globe(
        datetime=dt, lat=np.array([13.0]), lon=np.array([80.0]),
        solar=np.array([800])*units('W/m^2'), pres=np.array([1013])*units.hPa,
        temp_air=np.array([35])*units.degC, temp_dew=np.array([25])*units.degC,
        speed=np.array([2])*units('m/s'), urban=np.array([1]), zspeed=10*units.meter
    )
    twbg1 = res1['Twbg'].m[0]
    tnwb1 = res1['Tnwb'].m[0]
    tg1 = res1['Tg'].m[0]
    ta1 = 35.0
    calc1 = 0.7*tnwb1 + 0.2*tg1 + 0.1*ta1
    print(f"Case 1 (Hot/Humid/Sun): Expected from linear combo: {calc1:.2f}, Calculated: {twbg1:.2f}, Diff: {abs(calc1-twbg1):.2e}")

    # Controlled case 2: Cool night
    res2 = wetbulb_globe(
        datetime=dt, lat=np.array([13.0]), lon=np.array([80.0]),
        solar=np.array([0])*units('W/m^2'), pres=np.array([1013])*units.hPa,
        temp_air=np.array([15])*units.degC, temp_dew=np.array([10])*units.degC,
        speed=np.array([5])*units('m/s'), urban=np.array([1]), zspeed=10*units.meter
    )
    twbg2 = res2['Twbg'].m[0]
    tnwb2 = res2['Tnwb'].m[0]
    tg2 = res2['Tg'].m[0]
    ta2 = 15.0
    calc2 = 0.7*tnwb2 + 0.2*tg2 + 0.1*ta2
    print(f"Case 2 (Cool/Night): Expected from linear combo: {calc2:.2f}, Calculated: {twbg2:.2f}, Diff: {abs(calc2-twbg2):.2e}")

    # Controlled case 3: Extreme hot dry desert
    res3 = wetbulb_globe(
        datetime=dt, lat=np.array([13.0]), lon=np.array([80.0]),
        solar=np.array([1000])*units('W/m^2'), pres=np.array([1013])*units.hPa,
        temp_air=np.array([45])*units.degC, temp_dew=np.array([5])*units.degC,
        speed=np.array([1])*units('m/s'), urban=np.array([1]), zspeed=10*units.meter
    )
    twbg3 = res3['Twbg'].m[0]
    tnwb3 = res3['Tnwb'].m[0]
    tg3 = res3['Tg'].m[0]
    ta3 = 45.0
    calc3 = 0.7*tnwb3 + 0.2*tg3 + 0.1*ta3
    print(f"Case 3 (Hot/Dry/Extreme Sun): Expected from linear combo: {calc3:.2f}, Calculated: {twbg3:.2f}, Diff: {abs(calc3-twbg3):.2e}")


if __name__ == "__main__":
    run_wbgt_audit()
