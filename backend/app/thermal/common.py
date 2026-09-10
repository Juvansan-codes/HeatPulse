import numpy as np

def kelvin_to_celsius(k):
    """Convert Kelvin to Celsius."""
    return np.array(k) - 273.15

def calculate_relative_humidity(t2m_c, d2m_c):
    """
    Calculate Relative Humidity (%) from air temperature and dew point.
    Uses Magnus-Tetens approximation.
    """
    t = np.array(t2m_c)
    td = np.array(d2m_c)
    
    # Magnus-Tetens coefficients for water
    a = 17.625
    b = 243.04
    
    es = np.exp((a * t) / (b + t))
    ea = np.exp((a * td) / (b + td))
    
    rh = 100 * (ea / es)
    return np.clip(rh, 0, 100)

def calculate_wind_speed(u, v):
    """Calculate wind speed magnitude from u and v components."""
    return np.sqrt(np.array(u)**2 + np.array(v)**2)
