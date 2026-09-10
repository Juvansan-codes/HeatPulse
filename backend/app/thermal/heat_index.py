import numpy as np

def calculate_heat_index(temperature_c, relative_humidity):
    """
    Calculate the Heat Index using the NOAA NWS formulation.
    
    Source: Rothfusz, L. P. (1990). "The heat index 'equation' (or, more than you
    ever wanted to know about heat index)". NWS Southern Region Technical Attachment,
    SR/SSD 90-23, Fort Worth, Texas.
    
    Formula assumes:
    - Temperature in Fahrenheit (converted internally)
    - Relative humidity in %
    
    Limitations:
    - Heat Index is officially valid only for temperatures >= 80°F (~26.7°C) and RH >= 40%.
    - If temperature is below 80°F, it returns the ambient temperature.
    
    Parameters:
    - temperature_c: Air temperature in Celsius (float or numpy array)
    - relative_humidity: Relative humidity in % (float or numpy array)
    
    Returns:
    - Heat Index in Celsius
    """
    # Convert inputs to float arrays for vectorization
    t_f = (np.array(temperature_c) * 9/5) + 32
    rh = np.array(relative_humidity)
    
    # Simple Heat Index (Steadman)
    hi = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (rh * 0.094))
    
    # Needs adjustment if simple HI >= 80°F
    mask_rothfusz = (hi >= 80)
    
    if np.any(mask_rothfusz):
        # Rothfusz Regression
        hi_rothfusz = (
            -42.379
            + 2.04901523 * t_f
            + 10.14333127 * rh
            - 0.22475541 * t_f * rh
            - 6.83783e-3 * t_f**2
            - 5.481717e-2 * rh**2
            + 1.22874e-3 * t_f**2 * rh
            + 8.5282e-4 * t_f * rh**2
            - 1.99e-6 * t_f**2 * rh**2
        )
        
        # Adjustments
        inner_sqrt = (17 - np.abs(t_f - 95.)) / 17
        inner_sqrt = np.maximum(inner_sqrt, 0) # Prevent negative sqrt warning
        
        adj_1 = np.where(
            (rh < 13) & (t_f >= 80) & (t_f <= 112),
            -((13 - rh) / 4) * np.sqrt(inner_sqrt),
            0
        )
        
        adj_2 = np.where(
            (rh > 85) & (t_f >= 80) & (t_f <= 87),
            ((rh - 85) / 10) * ((87 - t_f) / 5),
            0
        )
        
        hi_rothfusz += adj_1 + adj_2
        
        # Apply Rothfusz where simple HI was >= 80
        hi = np.where(mask_rothfusz, hi_rothfusz, hi)
        
    # Convert back to Celsius
    hi_c = (hi - 32) * 5/9
    
    return hi_c
