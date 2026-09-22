'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Cloud,
  Thermometer,
  Sun,
  Activity,
  Users,
  Shield,
  Zap,
  AlertTriangle,
  ChevronRight,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  FileText,
  Lock,
  ArrowRight,
  Code2,
  GitBranch,
  ShieldAlert,
  HelpCircle,
  BarChart3
} from 'lucide-react';

interface MethodologyViewProps {
  onOpenExplainability?: (wardId?: number) => void;
}

/** 8 Pipeline Stage Definition */
interface PipelineStage {
  id: string;
  stepNumber: string;
  name: string;
  shortTag: string;
  oneLiner: string;
  icon: React.ReactNode;
  badgeText: string;
  badgeStyle: string;
  description: string;
  inputs: string[];
  outputs: string[];
  dataSource: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'era5',
    stepNumber: '01',
    name: 'ERA5-Land / Weather Forecast',
    shortTag: 'RAW DATA',
    oneLiner: 'Meteorological variables collected from ECMWF reanalysis and forecast models.',
    icon: <Cloud className="w-4 h-4 text-blue-500" />,
    badgeText: 'Meteorology Ingestion',
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Meteorological forcing variables are ingested from ERA5-Land cloud Zarr archives (2014–2023 baseline, 0.1° × 0.1° resolution) and updated with short-term forecast feeds to characterize environmental heat loads across Chennai.',
    inputs: ['2m Air Temperature (T2m)', 'Surface Dewpoint (Td)', '10m Wind Speed (u10, v10)', 'Surface Solar Radiation (SSRD)'],
    outputs: ['Hourly grid-level weather matrices (5 ERA5-Land cells over Chennai)'],
    dataSource: 'ECMWF ERA5-Land Reanalysis & Open-Meteo GFS/ECMWF APIs'
  },
  {
    id: 'thermal-vars',
    stepNumber: '02',
    name: 'Thermal Variables',
    shortTag: 'PROCESSING',
    oneLiner: 'Derived radiation balance, apparent moisture, and wind shear parameters.',
    icon: <Thermometer className="w-4 h-4 text-amber-500" />,
    badgeText: 'Biophysical Derivations',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Raw weather parameters are converted into radiation balance terms. Mean Radiant Temperature (Tmrt) is solved via two-hemisphere Spencer/Erbs solar geometry, downscaling 10m wind to 2m urban boundary conditions.',
    inputs: ['Raw T2m, Td, SSRD, v10', 'Solar zenith & clearness index (Erbs)'],
    outputs: ['Analytical Tmrt (°C)', '2m boundary wind speed (v2m)', 'Vapor pressure (e_hPa)'],
    dataSource: 'ISO 7726 Analytical Radiation Standard'
  },
  {
    id: 'indices',
    stepNumber: '03',
    name: 'UTCI / WBGT / Heat Index',
    shortTag: 'THERMAL INDICES',
    oneLiner: 'Multi-model biophysical indices capturing human heat exchanges.',
    icon: <Sun className="w-4 h-4 text-red-500" />,
    badgeText: 'Biophysical Diagnostics',
    badgeStyle: 'bg-red-50 text-red-700 border-red-200',
    description: 'Physics-based thermal comfort indicators quantify distinct physiological stressors. UTCI models multi-node human thermoregulation, outdoor WBGT models non-linear mass transfer, and Heat Index provides apparent shade temperature.',
    inputs: ['Tmrt', 'T2m', 'Relative Humidity', 'v2m'],
    outputs: ['UTCI (°C, 6th-order polynomial)', 'Liljegren Outdoor WBGT (°C)', 'NOAA Heat Index (°C)'],
    dataSource: 'Błażejczyk et al. (2013) & Liljegren et al. (2008)'
  },
  {
    id: 'htsi',
    stepNumber: '04',
    name: 'HTSI',
    shortTag: 'HTSI HAZARD',
    oneLiner: 'Project-specific operational thermal hazard index (0–100 continuous score).',
    icon: <Activity className="w-4 h-4 text-purple-500" />,
    badgeText: 'Project-Specific Index',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'The Human Thermal Stress Index (HTSI) is a continuous weighted composite index developed specifically for HeatPulse: HTSI = 0.64·U + 0.16·W + 0.10·B24 + 0.06·B72 + 0.04·N. It combines immediate thermal strain with trailing multi-day heat accumulation and nocturnal stress.',
    inputs: ['UTCI score U (0-100)', 'WBGT anomaly W', '24h/72h burden B24, B72', 'Night anomaly N'],
    outputs: ['Grid-level HTSI continuous score (0–100 pts)'],
    dataSource: 'HeatPulse Operational Risk Core (Canonical HTSI)'
  },
  {
    id: 'exposure',
    stepNumber: '05',
    name: 'Population Exposure',
    shortTag: 'EXPOSURE',
    oneLiner: 'WorldPop 2020 gridded population aggregated to 200 GCC ward boundaries.',
    icon: <Users className="w-4 h-4 text-orange-500" />,
    badgeText: 'Spatial Population',
    badgeStyle: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'To evaluate how many residents are potentially exposed to thermal stress, high-resolution WorldPop 2020 100m raster grids are spatially intersected and aggregated across official 2025 GCC 200-ward polygons (4,356,504 total derived population).',
    inputs: ['WorldPop R2025A 2020 100m raster', 'GCC 2025 ward boundaries (200 wards)'],
    outputs: ['Ward resident count', 'Ward population density (people/km²)', 'Normalized exposure E'],
    dataSource: 'WorldPop 2020 100m & GCC Revenue Dept Wards'
  },
  {
    id: 'vulnerability',
    stepNumber: '06',
    name: 'Vulnerability / Context',
    shortTag: 'VULNERABILITY',
    oneLiner: 'Ward-level adaptive capacity proxy based on GCC Health & Wellness Centres.',
    icon: <Shield className="w-4 h-4 text-emerald-500" />,
    badgeText: 'Operational Proxy',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Adaptive capacity is represented using official GCC Health and Wellness Centre (HWC) and UPHC directory locations per 10,000 residents. Reduced vulnerability V is formulated as 0.5·S + 0.5·(1 - A).',
    inputs: ['GCC 140 HWC location directory', 'Ward population counts'],
    outputs: ['HWC facilities per 10k population', 'Normalized adaptive capacity A', 'Vulnerability score V'],
    dataSource: 'Greater Chennai Corporation Health Department'
  },
  {
    id: 'risk-fusion',
    stepNumber: '07',
    name: 'Human Heat Risk',
    shortTag: 'RISK FUSION',
    oneLiner: 'Combines hazard, exposure, and vulnerability into operational triage score.',
    icon: <Zap className="w-4 h-4 text-red-600" />,
    badgeText: 'Formula B Triage',
    badgeStyle: 'bg-red-50 text-red-700 border-red-200',
    description: 'Operational risk fusion applies Formula B: Risk = H × E × (0.5 + 0.5V). This mathematical formulation ensures that severe thermal hazard H in dense population wards E retains high operational priority even when vulnerability proxies are low.',
    inputs: ['Hazard H = HTSI/100', 'Normalized exposure E', 'Vulnerability V'],
    outputs: ['Human Heat Risk score (0.000–1.000)', '5-tier severity classification'],
    dataSource: 'HeatPulse Operational Risk Core'
  },
  {
    id: 'alert',
    stepNumber: '08',
    name: 'Ward-Level Alert',
    shortTag: 'DECISION SUPPORT',
    oneLiner: 'Actionable ward-level advisories and public health SOP recommendations.',
    icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
    badgeText: 'Action Matrix',
    badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Converts ward-level risk rankings into targeted municipal advisories, triggering hydration deployment, cooling shelter activation, and outdoor labor advisories tailored for GCC ward officers and disaster response teams.',
    inputs: ['Ward risk score & severity level', 'Role context (Authority / Public / Medic)'],
    outputs: ['Targeted SOP advisories', 'Explainable risk drivers', 'Public health alerts'],
    dataSource: 'GCC Emergency Response Protocol Guidelines'
  }
];

export const MethodologyView: React.FC<MethodologyViewProps> = ({ onOpenExplainability }) => {
  const [selectedStageId, setSelectedStageId] = useState<string>('htsi');
  const activeStage = PIPELINE_STAGES.find((s) => s.id === selectedStageId) || PIPELINE_STAGES[3];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F47C20] via-amber-500 to-red-500" />
        
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#F47C20] border border-orange-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#F47C20]" />
              Transparent • Explainable • Human-Centered
            </span>
            <span className="text-xs font-mono text-slate-400">
              Document Ref: HP-METHOD-2026-F8
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            How HeatPulse Works
          </h1>

          <p className="text-base sm:text-lg font-medium text-[#F47C20]">
            From environmental conditions to human-centered heat-risk intelligence.
          </p>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            HeatPulse combines meteorological data, thermal-stress indicators, population exposure, and vulnerability information to estimate ward-level human heat risk across Chennai's 200 GCC administrative wards.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Open Math Formulations
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Explicit Stated Limitations
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Per-Ward Sensitivity Analysis
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. VISUAL METHODOLOGY PIPELINE (INTERACTIVE)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-[#F47C20]" />
              Interactive Methodology Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any stage node below to inspect data inputs, computational logic, outputs, and provenance.
            </p>
          </div>

          <span className="text-[11px] font-mono text-slate-500 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 font-semibold self-start sm:self-auto">
            8-STAGE PROCESSING CHAIN
          </span>
        </div>

        {/* Pipeline Nodes Flow Bar */}
        <div className="overflow-x-auto pb-2">
          {/* Desktop Horizontal Flow / Mobile Vertical List */}
          <div className="flex flex-col lg:flex-row items-stretch gap-2 min-w-full lg:min-w-[900px]">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isSelected = stage.id === selectedStageId;

              return (
                <React.Fragment key={stage.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedStageId(stage.id)}
                    className={`flex-1 p-3 rounded-xl border text-left transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-[#F47C20]/40'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`font-mono text-[10px] font-bold ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                        {stage.stepNumber}
                      </span>
                      <div className="p-1 rounded bg-white/80 shadow-2xs">
                        {stage.icon}
                      </div>
                    </div>

                    <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {stage.name}
                    </div>

                    <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {stage.shortTag}
                    </div>

                    {isSelected && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 hidden lg:block" />
                    )}
                  </button>

                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center text-slate-300 px-0.5">
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Stage Detail Expansion Card */}
        {activeStage && (
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                  {activeStage.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      STAGE {activeStage.stepNumber}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${activeStage.badgeStyle}`}>
                      {activeStage.badgeText}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {activeStage.name}
                  </h3>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                Source: <span className="text-slate-200 font-semibold">{activeStage.dataSource}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeStage.description}
            </p>

            {/* Inputs vs Outputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  Data Inputs
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {activeStage.inputs.map((inp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                  Outputs Produced
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {activeStage.outputs.map((out, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. DATA SOURCES REGISTER
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#F47C20]" />
            Data Sources Register
          </h2>
          <span className="text-xs text-slate-500 font-mono font-medium">Authoritative Provenance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">ERA5-Land</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">ECMWF</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Historical/reanalysis environmental data used to characterize meteorological conditions (2m temperature, dewpoint, 10m wind, surface radiation).
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-slate-400 border-t border-slate-200/60">
              Baseline: 2014–2023 • 0.1° × 0.1° Grid
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">ECMWF Forecast</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">FORECAST</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Forecast meteorological information used for forward-looking heat-risk analysis and 5-day calibrated thermal predictions.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-slate-400 border-t border-slate-200/60">
              Update: Hourly Feeds • GFS/ECMWF Ensembles
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">WorldPop</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-semibold">EXPOSURE</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Population distribution data used to estimate population exposure aggregated to administrative ward boundaries (R2025A 2020 100m raster).
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-slate-400 border-t border-slate-200/60">
              Derived GCC Pop: 4,356,504 residents
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">GCC Ward Boundaries</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">GEOMETRY</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Administrative ward boundaries used for spatial aggregation and ward-level analysis across 200 GCC wards and 15 zones.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-slate-400 border-t border-slate-200/60">
              2025 Delimitation • 200 Polygons
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between lg:col-span-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">GCC HWC Information</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">VULNERABILITY PROXY</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Heat-wave/cooling-center related information used as contextual information for operational interpretation and healthcare accessibility proxy (140 Health & Wellness Centres).
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-slate-400 border-t border-slate-200/60">
              GCC Public Health Directory • Primary Clinic Proxy
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. WHAT THE TERMS MEAN (GLOSSARY)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#F47C20]" />
            What the Terms Mean
          </h2>
          <span className="text-xs text-slate-500 font-mono font-medium">Core Glossary</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">HTSI</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold border border-purple-200">
                Project-specific
              </span>
            </div>
            <div className="text-xs font-semibold text-[#F47C20]">Human Thermal Stress Index</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              HTSI is a project-specific operational thermal hazard index developed for HeatPulse. It combines thermal indicators (UTCI, WBGT, 24h/72h burden, nighttime anomaly) to represent the intensity of heat stress at ward level.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Human Heat Risk</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-200">
                Operational prioritization score
              </span>
            </div>
            <div className="text-xs font-semibold text-red-600">Formula B Triage Score</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Human Heat Risk is an operational ward-level prioritization score that combines thermal stress with population exposure and available vulnerability/contextual information using Formula B: <code className="font-mono text-slate-800 font-bold">Risk = H × E × (0.5 + 0.5V)</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Population</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                Estimated population
              </span>
            </div>
            <div className="text-xs font-semibold text-amber-700">WorldPop 2020 Aggregation</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Population exposure is derived using WorldPop 2020 100m estimates spatially aggregated to the ward level. It estimates how many residents are potentially exposed to thermal stress during extreme heat events.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. OPERATIONAL RISK FUSION EXPLANATION
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">
                FORMULATION BREAKDOWN
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Operational Risk Fusion (Formula B)
            </h2>
          </div>

          <div className="font-mono text-xs text-amber-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            Formula B: <span className="text-white font-bold">Risk = H × E × (0.5 + 0.5V)</span>
          </div>
        </div>

        {/* Visual Fusion Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
            <span className="text-red-400 font-bold block text-sm">Thermal Stress (H)</span>
            <span className="text-slate-400 text-[11px] block">HTSI / 100</span>
            <span className="text-[10px] text-slate-500 block pt-1">Hazard Intensity</span>
          </div>

          <div className="flex items-center justify-center text-slate-500 font-bold text-lg">
            +
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
            <span className="text-amber-400 font-bold block text-sm">Population (E)</span>
            <span className="text-slate-400 text-[11px] block">WorldPop Density</span>
            <span className="text-[10px] text-slate-500 block pt-1">Exposed Resident Count</span>
          </div>

          <div className="flex items-center justify-center text-slate-500 font-bold text-lg">
            +
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
            <span className="text-orange-400 font-bold block text-sm">Vulnerability (V)</span>
            <span className="text-slate-400 text-[11px] block">0.5S + 0.5(1-A)</span>
            <span className="text-[10px] text-slate-500 block pt-1">HWC Access Proxy</span>
          </div>
        </div>

        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
          <div className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-semibold">Operational Context Note:</strong> The final risk score is intended for municipal prioritization and situational awareness rather than as a direct prediction of individual health outcomes. Formula B retains operational hazard and population density prioritization even when incomplete vulnerability evidence produces a low score.
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. LIMITATIONS & RESPONSIBLE USE SECTION (MANDATORY EXACT 6)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 border border-amber-300 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-950 uppercase tracking-wide">
                Limitations & Responsible Use
              </h2>
              <p className="text-xs text-amber-800 font-medium">
                Mandatory operational disclosures and boundary constraints for reviewers and authorities.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-200 text-amber-900 font-bold border border-amber-300">
            PROTOTYPE DISCLOSURE
          </span>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span className="font-mono text-amber-700">1.</span> Modeled Population
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              Population exposure is estimated using modeled population datasets (WorldPop 2020 100m) and should not be interpreted as a real-time population count.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span className="font-mono text-amber-700">2.</span> HWC Availability Proxy
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              Heat-wave/cooling-center availability is represented using available information (GCC 140 HWC directory) and should be treated as an operational proxy rather than guaranteed real-time availability.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span className="font-mono text-amber-700">3.</span> Reduced Vulnerability
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              Current vulnerability modeling is intentionally simplified and does not capture every demographic, socioeconomic, occupational, or health-related factor.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span className="font-mono text-amber-700">4.</span> Missing Green / Slum Layers
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              Detailed green-cover and slum-level spatial layers may not be available in the current implementation, limiting fine-grained urban vulnerability characterization.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span className="font-mono text-amber-700">5.</span> Not Mortality Prediction
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              HeatPulse does not predict individual deaths, mortality, hospital admissions, or individual medical outcomes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span className="font-mono text-amber-700">6.</span> Not an Official Warning
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              HeatPulse is a decision-support and research prototype. It is not an official government warning system and should not replace guidance issued by authorized agencies.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. DATA → DECISION TRANSPARENCY (CHAIN)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-[#F47C20]" />
            From Data to Decision
          </h2>
          <span className="text-xs text-slate-500 font-mono font-medium">9-Step Processing Chain</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-2 text-center text-xs font-mono">
          {[
            { label: 'RAW DATA', desc: 'Weather, population & spatial datasets' },
            { label: 'PROCESSING', desc: 'Cleaning, normalization & spatial aggregation' },
            { label: 'THERMAL INDICES', desc: 'UTCI, WBGT & Heat Index calculation' },
            { label: 'HTSI', desc: 'Operational continuous thermal-stress score' },
            { label: 'EXPOSURE', desc: 'Estimated population potentially exposed' },
            { label: 'VULNERABILITY', desc: 'HWC clinic availability proxy' },
            { label: 'RISK FUSION', desc: 'Formula B operational synthesis' },
            { label: 'WARD RISK', desc: 'Prioritization score for 200 wards' },
            { label: 'EXPLAINABLE ALERT', desc: 'Communicates risk & recommended actions' }
          ].map((item, index) => (
            <div key={index} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#F47C20] block">0{index + 1}</span>
              <div className="font-bold text-slate-900 text-[11px] font-sans">{item.label}</div>
              <p className="text-[9px] text-slate-500 font-sans leading-tight mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. CONNECTION TO "WHY THIS WARD?" (PHASE F7)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-400/10 text-amber-400 font-mono text-xs font-bold border border-amber-400/20">
                PHASE F7 EXPLAINABILITY
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Why This Ward?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The methodology behind every ward-level risk score is exposed through the HeatPulse explainability layer. When you click any ward on the GIS map or dashboard, the system breaks down exact sensitivity percentages for Hazard, Exposure, and Vulnerability.
            </p>
          </div>

          <div className="shrink-0">
            {onOpenExplainability ? (
              <button
                type="button"
                onClick={() => onOpenExplainability(114)}
                className="px-5 py-3 bg-[#F47C20] hover:bg-[#e06c15] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg group border border-orange-400/30"
              >
                <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                <span>Explore Ward Explainability</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-xs text-amber-400 font-mono">
                Click any ward on map to launch explainability.
              </div>
            )}
          </div>
        </div>

        {/* Visual flow: Methodology -> Risk Model -> Ward Risk Score -> Why This Ward? */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-400">
          <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">Methodology</span>
          <span>→</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">Risk Model</span>
          <span>→</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[#F47C20]">Ward Risk Score</span>
          <span>→</span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 font-bold">Why This Ward?</span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. TECHNICAL ARCHITECTURE STACK
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#F47C20]" />
            Technical Architecture Stack
          </h2>
          <span className="text-xs text-slate-500 font-mono font-medium">SIH 26083 Prototype Stack</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] text-blue-700 font-bold uppercase block">FRONTEND</span>
            <ul className="space-y-1 text-slate-800">
              <li>• Next.js (App Router)</li>
              <li>• TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• MapLibre GL JS</li>
              <li>• Recharts</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">BACKEND</span>
            <ul className="space-y-1 text-slate-800">
              <li>• Python 3.11</li>
              <li>• FastAPI</li>
              <li>• Uvicorn ASGI</li>
              <li>• Pydantic v2</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] text-purple-700 font-bold uppercase block">DATA</span>
            <ul className="space-y-1 text-slate-800">
              <li>• Supabase PostgreSQL</li>
              <li>• PostGIS Spatial</li>
              <li>• Zarr ARCO Cloud</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] text-amber-700 font-bold uppercase block">ML / ANALYTICS</span>
            <ul className="space-y-1 text-slate-800">
              <li>• XGBoost</li>
              <li>• scikit-learn</li>
              <li>• Pandas / NumPy</li>
              <li>• SHAP Explainability</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] text-red-700 font-bold uppercase block">GEOSPATIAL</span>
            <ul className="space-y-1 text-slate-800">
              <li>• GeoPandas</li>
              <li>• Rasterio</li>
              <li>• xarray</li>
              <li>• Shapely</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          10. TRUST PRINCIPLES
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            HeatPulse Trust Principles
          </h2>
          <span className="text-xs text-slate-500 font-mono font-medium">Core Governance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 uppercase text-[11px] text-[#F47C20]">TRANSPARENT</div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Users can inspect how risk is constructed without black-box opacity.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 uppercase text-[11px] text-[#F47C20]">EXPLAINABLE</div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Ward-level risk drivers can be surfaced through the explainability layer.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 uppercase text-[11px] text-[#F47C20]">CONTEXT-AWARE</div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Risk considers more than simple air temperature alone.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 uppercase text-[11px] text-[#F47C20]">LIMITATION-AWARE</div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Known data and modeling limitations are explicitly disclosed.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 uppercase text-[11px] text-[#F47C20]">OPERATIONAL</div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Risk is designed to support prioritization and situational awareness.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
