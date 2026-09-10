# System Architecture

```text
                EXTERNAL DATA
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
   ERA5 /        NASA POWER      Census /
   ERA5-Land                    GIS/Satellite
      │              │              │
      └──────────────┼──────────────┘
                     ▼
            DATA PROCESSING
                     │
                     ▼
            FEATURE ENGINEERING
                     │
                     ▼
            THERMAL ENGINE
         ┌───────────┼───────────┐
         ▼           ▼           ▼
        HI         WBGT        UTCI
         └───────────┼───────────┘
                     ▼
                    HTSI
                     │
                     ▼
            ML PREDICTION ENGINE
                     │
                   XGBoost
                     │
                     ▼
                   SHAP
                     │
                     ▼
          EXPOSURE + VULNERABILITY
                     │
                     ▼
                RISK FUSION
                     │
                     ▼
              WARD-LEVEL RISK
                     │
                     ▼
               EARLY WARNING
                     │
           ┌─────────┴─────────┐
           ▼                   ▼
      NEXT.JS WEB         FLUTTER MOBILE
```
