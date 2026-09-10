import React from 'react';
import {
  BookOpen,
  GitBranch,
  Layers,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export const MethodologyView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider">
            SCIENTIFIC FOUNDATIONS & PROVENANCE
          </span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          HeatPulse Scientific Methodology & Mathematical Formulations
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-4xl leading-relaxed">
          Open-science documentation of Chennai's impact-based thermal early-warning architecture, physics-based thermal comfort models, machine learning calibration, and operational risk formulations.
        </p>
      </div>

      {/* 2. End-to-End System Architecture Pipeline */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-blue-400" />
          End-to-End Scientific Architecture Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono relative">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-blue-400 uppercase font-bold block">01 External Ingestion</span>
              <div className="font-bold text-slate-200 font-sans mt-1">Meteorology & GIS</div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                ERA5-Land cloud Zarr ARCO (2014-2023, 5 grids), 2025 GCC 200-ward GeoJSON, WorldPop 2020.
              </p>
            </div>
            <div className="hidden md:flex items-center justify-end text-blue-500/60 pt-2">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-amber-400 uppercase font-bold block">02 Biophysical Engine</span>
              <div className="font-bold text-slate-200 font-sans mt-1">Thermal Diagnostics</div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Tmrt (ISO 7726 solar balance), Liljegren outdoor WBGT, and 6th-order polynomial UTCI.
              </p>
            </div>
            <div className="hidden md:flex items-center justify-end text-amber-500/60 pt-2">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-red-400 uppercase font-bold block">03 HTSI Fusion</span>
              <div className="font-bold text-slate-200 font-sans mt-1">Thermal Stress Index</div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Continuous weighted composite: 0.64U + 0.16W + 0.10B24 + 0.06B72 + 0.04N (0–100 score).
              </p>
            </div>
            <div className="hidden md:flex items-center justify-end text-red-500/60 pt-2">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-purple-400 uppercase font-bold block">04 ML Calibration</span>
              <div className="font-bold text-slate-200 font-sans mt-1">XGBoost + Mean Bias</div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                XGBoost on pointwise weather & thermal states; Mean Bias on cumulative multi-day persistence.
              </p>
            </div>
            <div className="hidden md:flex items-center justify-end text-purple-500/60 pt-2">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">05 Ward Risk Model</span>
              <div className="font-bold text-slate-200 font-sans mt-1">Formula B Triage</div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Risk = H × E × (0.5 + 0.5V) applied to exactly 200 GCC wards for operational prioritization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core Mathematical Formulations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HTSI Formulation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
              1. Human Thermal Stress Index (HTSI)
            </h3>
            <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-semibold">
              GRID LEVEL
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-amber-300">
            HTSI = 0.64·U + 0.16·W + 0.10·B₂₄ + 0.06·B₇₂ + 0.04·N
          </div>

          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong className="text-white font-mono">U (UTCI Continuous Score):</strong> Continuous piecewise interpolation where ≤26°C maps to 0–20, 26–32°C to 20–40, 32–38°C to 40–60, 38–46°C to 60–80, and 46–56°C to 80–100.
            </li>
            <li>
              <strong className="text-white font-mono">W (Local WBGT Climatological Anomaly):</strong> Anchored against 2014–2023 grid empirical percentiles: P50 (0), P90 (50), P95 (70), P97.5 (85), P99 (100).
            </li>
            <li>
              <strong className="text-white font-mono">B₂₄ & B₇₂ (Trailing UTCI Burden):</strong> Inclusive rolling mean of <code className="text-slate-200">max(0, U - 20)</code> over 24 and 72 chronological hourly records per grid. Zero future leakage.
            </li>
            <li>
              <strong className="text-white font-mono">N (Nighttime Thermal Stress):</strong> Calibrated strictly on 22:00–06:00 IST nocturnal temperature percentiles (daytime N = 0). Captures lack of overnight physiological cooling.
            </li>
          </ul>
        </div>

        {/* Human Heat Risk Formulation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
              2. Ward Human Heat Risk (Formula B)
            </h3>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
              WARD LEVEL
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300">
            Risk = H × E × (0.5 + 0.5·V)
          </div>

          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong className="text-white font-mono">H (Hazard):</strong> Normalized HTSI score: <code className="text-slate-200">H = HTSI / 100</code>, bounded strictly to [0, 1].
            </li>
            <li>
              <strong className="text-white font-mono">E (Exposure):</strong> Min-max normalized WorldPop 2020 population density per ward: <code className="text-slate-200">E = (density - min) / (max - min)</code>.
            </li>
            <li>
              <strong className="text-white font-mono">V (Reduced Vulnerability):</strong> Bounded score: <code className="text-slate-200">V = 0.5·S + 0.5·(1 - A)</code>, where S is population density sensitivity and A is normalized HWC/UPHC healthcare availability per 10,000 population.
            </li>
            <li>
              <strong className="text-white">Why Formula B over A:</strong> Formula A (<code className="font-mono text-slate-200">H × E × V</code>) would zero out operational priority if vulnerability is low. Formula B ensures severe thermal hazard and dense population exposure remain prioritized in municipal contingency response.
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Biophysical Indices Comparison Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          Biophysical Indices Comparison & Separation of Scales
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3">Physics Formulation</th>
                <th className="py-2.5 px-3">Radiation Handling</th>
                <th className="py-2.5 px-3">Wind Parameter</th>
                <th className="py-2.5 px-3">Project Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">UTCI (°C)</td>
                <td className="py-2.5 px-3 text-slate-300">6th-order polynomial (Błażejczyk et al., 2013)</td>
                <td className="py-2.5 px-3 text-slate-300">Reuses ISO 7726 analytical Tmrt (Spencer/Erbs)</td>
                <td className="py-2.5 px-3 font-mono text-blue-400">10m wind speed (v₁₀)</td>
                <td className="py-2.5 px-3 font-semibold text-emerald-400">Primary continuous biophysical anchor (64% weight)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Outdoor WBGT (°C)</td>
                <td className="py-2.5 px-3 text-slate-300">Liljegren et al. (2008) non-linear heat/mass balance</td>
                <td className="py-2.5 px-3 text-slate-300">Computes own radiation load natively from GHI</td>
                <td className="py-2.5 px-3 font-mono text-blue-400">Downscaled to 2m urban boundary profile</td>
                <td className="py-2.5 px-3 font-semibold text-amber-400">Local climatological anomaly anchor (16% weight)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Mean Radiant Temp (Tmrt)</td>
                <td className="py-2.5 px-3 text-slate-300">Two-hemisphere radiation balance (RayMan foundation)</td>
                <td className="py-2.5 px-3 text-slate-300">Erbs clearness index direct/diffuse solar split</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">N/A</td>
                <td className="py-2.5 px-3 text-slate-400">Intermediate input to UTCI calculation</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">NOAA Heat Index</td>
                <td className="py-2.5 px-3 text-slate-300">Rothfusz regression apparent temperature</td>
                <td className="py-2.5 px-3 text-slate-400">None (shaded air condition only)</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">N/A</td>
                <td className="py-2.5 px-3 text-slate-400">Public-facing supporting context only; excluded from HTSI</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Scientific Limitations & Data Provenance Register */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          Transparency & Scientific Limitations Register
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">Census 2011 vs Current 200 Wards</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The 2011 Census uses a 155-ward spatial delimitation. Direct numeric joining is mathematically invalid. HeatPulse relies on WorldPop R2025A 2020 100m gridded population aggregated to official GCC 2025 ward boundaries (4,356,504 derived count).
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">Omitted Green Space & Cooling Canopy</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Available GCC park data stems from a 2016 historical PDF lacking polygon geometries. Green cooling was intentionally omitted rather than fabricating arbitrary ward-level vegetation indices.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">Omitted Informal Settlement / Slum Polygons</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Authoritative ward-compatible spatial polygons for informal settlements were unavailable. Socioeconomic demographic assumptions were not fabricated into the vulnerability score.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">Healthcare Proxy Nature</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              HWC/UPHC data reflects the official GCC 140 Health and Wellness Centre directory joined to current ward IDs. It represents primary clinic accessibility, not hospital bed or emergency ICU capacity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
