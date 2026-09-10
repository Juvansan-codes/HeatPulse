# ERA5 Copernicus API Setup

In September 2024, Copernicus migrated to a new Climate Data Store (CDS).

**1. Verify `cdsapi` version**
The installed version is `0.7.7` (verified via `pip freeze`). This is compatible with the new CDS API.

**2. Expected Authentication Mechanism**
The new system requires a Personal Access Token created on the new CDS portal, replacing the old API key.
The new URL endpoint is `https://cds.climate.copernicus.eu/api`.

**3. Script Compatibility**
`scripts/phase1_era5_feasibility.py` uses `cdsapi.Client()`. This is fully compatible and automatically picks up your `~/.cdsapirc` file on Windows (usually `C:\Users\YourUsername\.cdsapirc`).

**4. How to Configure Locally**
1. Log in to [https://cds.climate.copernicus.eu/](https://cds.climate.copernicus.eu/).
2. Go to your User Profile and accept the Terms & Conditions.
3. Scroll to the bottom to find your Personal Access Token.
4. Create a file named `.cdsapirc` in your Windows home directory (`C:\Users\%USERNAME%\.cdsapirc`).
5. Add the following two lines (do not use quotes):
   ```
   url: https://cds.climate.copernicus.eu/api
   key: YOUR_PERSONAL_ACCESS_TOKEN
   ```

**5. Git Exclusion**
The `.cdsapirc` file has been added to `.gitignore` to prevent credential leaks, and the scripts do not hard-code or print credentials.
