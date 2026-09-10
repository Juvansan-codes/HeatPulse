import numpy as np

def calculate_vapor_pressure(temperature_c, relative_humidity):
    """Calculate actual vapor pressure (hPa) using the Tetens formula."""
    ta = np.array(temperature_c)
    rh = np.array(relative_humidity)
    
    # Saturation vapor pressure
    es = 6.105 * np.exp((17.27 * ta) / (237.7 + ta))
    # Actual vapor pressure
    e = (rh / 100.0) * es
    return e

def calculate_wbgt_approx(temperature_c, relative_humidity):
    """
    Calculate an approximation of the Wet Bulb Globe Temperature (WBGT).
    
    Source: Australian Bureau of Meteorology (BOM) simplified empirical formulation.
    Often used as an approximation for indoor or shaded conditions.
    
    Formula: WBGT = 0.567 * Ta + 0.393 * e + 3.94
    Where:
    - Ta: Air temperature (°C)
    - e: Actual vapor pressure (hPa)
    
    Limitations:
    - This is a *shade* (or indoor) approximation.
    - It explicitly ignores the solar radiation load and wind speed cooling. 
    - Full outdoor WBGT (Liljegren method) requires accurate solar radiation 
      and globe temperature estimation which requires complex physical modelling.
      
    Parameters:
    - temperature_c: Air temperature in Celsius (float or numpy array)
    - relative_humidity: Relative humidity in % (float or numpy array)
    
    Returns:
    - WBGT in Celsius
    """
    ta = np.array(temperature_c)
    e = calculate_vapor_pressure(temperature_c, relative_humidity)
    
    wbgt = 0.567 * ta + 0.393 * e + 3.94
    return wbgt
