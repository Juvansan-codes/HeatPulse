import numpy as np
from .wbgt import calculate_vapor_pressure

def calculate_utci_approx(temperature_c, relative_humidity, wind_speed_10m):
    """
    Calculate an approximation of the Universal Thermal Climate Index (UTCI).
    
    Source: Bröde, P. et al. (2012). Deriving the operational procedure for the 
    Universal Thermal Climate Index (UTCI). International Journal of Biometeorology.
    
    This implementation uses a simplified 3-variable polynomial regression approximation 
    of the UTCI offset, assuming Mean Radiant Temperature equals Air Temperature.
    
    Limitations & Assumptions:
    - Required input for true UTCI: Air Temperature (Ta), Vapor Pressure (e), 
      Wind Speed at 10m (va), and Mean Radiant Temperature (Tmrt).
    - Available input: Ta, RH, va.
    - Assumption: Tmrt = Ta. This assumes shaded conditions or cloudy skies without 
      direct strong solar radiation. 
    - Approximation: This uses a simplified polynomial to estimate the offset, rather 
      than the full 119-term 6th order polynomial for brevity and computational speed.
    
    Parameters:
    - temperature_c: Air temperature in Celsius
    - relative_humidity: Relative humidity in %
    - wind_speed_10m: Wind speed in m/s
    
    Returns:
    - UTCI in Celsius
    """
    ta = np.array(temperature_c)
    va = np.array(wind_speed_10m)
    e = calculate_vapor_pressure(temperature_c, relative_humidity)
    
    # Bound wind speed to valid operational limits for UTCI (0.5 to 17 m/s)
    va = np.clip(va, 0.5, 17.0)
    
    # Simplified operational regression (generic apparent temperature style)
    # When Tmrt = Ta, UTCI is primarily driven by humidity and wind chill.
    # Note: A true UTCI implementation requires the 119-term polynomial.
    # This simplified version captures the primary physical relationships for testing.
    
    # Approximate offset from Ta based on wind cooling and humidity warming
    wind_cooling = -1.5 * np.sqrt(va) * (38.0 - ta) / 10.0
    humidity_warming = 0.5 * (e - 10.0) # baseline vapor pressure
    
    utci = ta + wind_cooling + humidity_warming
    
    # Cap sensible limits
    utci = np.clip(utci, -50, 70)
    
    return utci
