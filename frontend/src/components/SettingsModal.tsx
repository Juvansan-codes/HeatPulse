'use client';

import React, { useState } from 'react';
import {
  X,
  Sliders,
  Database,
  Layers,
  BellRing,
  Info,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building,
  Thermometer,
  Gauge
} from 'lucide-react';

export interface SettingsConfig {
  tempUnit: 'C' | 'F';
  windUnit: 'kmh' | 'ms';
  mapStyle: 'obsidian' | 'satellite' | 'topo';
  alertAudio: boolean;
  autoRefreshInterval: number; // in seconds, 0 = off
  showGridOverlay: boolean;
  extremePulseAnimation: boolean;
  highContrastMode: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SettingsConfig;
  onSaveConfig: (newConfig: SettingsConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [activeTab, setActiveTab] = useState<'display' | 'data' | 'alerts' | 'about'>('display');
  const [localConfig, setLocalConfig] = useState<SettingsConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 400);
  };

  const handleReset = () => {
    const defaults: SettingsConfig = {
      tempUnit: 'C',
      windUnit: 'kmh',
      mapStyle: 'obsidian',
      alertAudio: true,
      autoRefreshInterval: 60,
      showGridOverlay: true,
      extremePulseAnimation: true,
      highContrastMode: false
    };
    setLocalConfig(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F47C20]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Platform Preferences & System Configuration
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-100 text-[#F47C20] font-semibold">
                  v1.2.0-F1
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Configure GIS rendering, thermal telemetry units, and municipal alert parameters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'display'
                ? 'border-[#F47C20] text-[#F47C20] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Display & GIS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'alerts'
                ? 'border-[#F47C20] text-[#F47C20] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Alerts & Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'data'
                ? 'border-[#F47C20] text-[#F47C20] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Provenance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'about'
                ? 'border-[#F47C20] text-[#F47C20] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About HeatPulse</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {activeTab === 'display' && (
            <div className="space-y-5">
              {/* Unit Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-red-600" />
                      Temperature Unit
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">HTSI, UTCI, WBGT</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, tempUnit: 'C' })}
                      className={`py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        localConfig.tempUnit === 'C'
                          ? 'bg-orange-50 border-[#F47C20] text-[#F47C20] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Celsius (°C)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, tempUnit: 'F' })}
                      className={`py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        localConfig.tempUnit === 'F'
                          ? 'bg-orange-50 border-[#F47C20] text-[#F47C20] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Fahrenheit (°F)
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-cyan-600" />
                      Wind Speed Unit
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">Anemometer</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, windUnit: 'kmh' })}
                      className={`py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        localConfig.windUnit === 'kmh'
                          ? 'bg-orange-50 border-[#F47C20] text-[#F47C20] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Kilometers / hr
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, windUnit: 'ms' })}
                      className={`py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        localConfig.windUnit === 'ms'
                          ? 'bg-orange-50 border-[#F47C20] text-[#F47C20] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Meters / sec
                    </button>
                  </div>
                </div>
              </div>

              {/* GIS Basemap Themes */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-semibold text-slate-900">GIS Map Workspace Theme</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'obsidian', label: 'Light Institutional', desc: 'Government Standard Light' },
                    { id: 'satellite', label: 'Satellite Hybrid', desc: 'Aerial Infrared Overlays' },
                    { id: 'topo', label: 'Clean Carto', desc: 'Administrative Topo Delimitation' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, mapStyle: style.id as any })}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        localConfig.mapStyle === style.id
                          ? 'bg-orange-50 border-[#F47C20] text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-xs text-slate-900">{style.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Toggles */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-semibold text-slate-900">Visual Telemetry Overlays</span>
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <div className="font-medium text-slate-900">
                        ERA5-Land Grid Bounding Overlays
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Display the 5 land cell bounding boxes (0.1° resolution) over the 200 wards
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localConfig.showGridOverlay}
                      onChange={(e) =>
                        setLocalConfig({ ...localConfig, showGridOverlay: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-[#F47C20] focus:ring-[#F47C20] bg-white"
                    />
                  </label>

                  <div className="h-px bg-slate-200" />

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <div className="font-medium text-slate-900">
                        Extreme Thermal Hazard Beacon Pulse
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Trigger pulsating purple animations on Level 5 Extreme heat conditions
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localConfig.extremePulseAnimation}
                      onChange={(e) =>
                        setLocalConfig({ ...localConfig, extremePulseAnimation: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-[#F47C20] focus:ring-[#F47C20] bg-white"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-semibold text-slate-900">Municipal Alert Protocol Sound</span>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-slate-900 font-medium">Audible Severity Warning Chimes</div>
                    <div className="text-[11px] text-slate-500">
                      Play acoustic signal when automated triage flags a ward into Level 4 or Level 5
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localConfig.alertAudio}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, alertAudio: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#F47C20] focus:ring-[#F47C20] bg-white"
                  />
                </label>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Automated Data Ingestion Refresh</span>
                  <span className="font-mono text-[#F47C20] text-xs font-semibold">
                    {localConfig.autoRefreshInterval === 0
                      ? 'Manual Only'
                      : `Every ${localConfig.autoRefreshInterval}s`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { sec: 0, label: 'Manual' },
                    { sec: 30, label: '30 sec' },
                    { sec: 60, label: '1 min' },
                    { sec: 300, label: '5 min' }
                  ].map((item) => (
                    <button
                      key={item.sec}
                      type="button"
                      onClick={() =>
                        setLocalConfig({ ...localConfig, autoRefreshInterval: item.sec })
                      }
                      className={`py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        localConfig.autoRefreshInterval === item.sec
                          ? 'bg-orange-50 border-[#F47C20] text-[#F47C20]'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Authoritative Verified Data Pipelines</span>
                </div>
                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <span className="font-medium text-slate-800">Spatial Administrative Base:</span>
                    <span className="font-mono text-emerald-700 font-semibold">200 GCC Wards (2025 boundary)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <span className="font-medium text-slate-800">Demographic Exposure:</span>
                    <span className="font-mono text-blue-700 font-semibold">WorldPop R2025A 2020 (4.35M pop)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <span className="font-medium text-slate-800">Health Vulnerability Proxy:</span>
                    <span className="font-mono text-amber-700 font-semibold">140 GCC Health & Wellness Centers</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <span className="font-medium text-slate-800">Thermal Grids:</span>
                    <span className="font-mono text-purple-700 font-semibold">5 Calibrated ERA5-Land Land Cells</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <span className="font-medium text-slate-800">Machine Learning Correction:</span>
                    <span className="font-mono text-emerald-700 font-semibold">XGBoost Lead 1–5 Calibration (-34% MAE)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Building className="w-4 h-4 text-[#F47C20]" />
                  <span>Greater Chennai Corporation Heat Early Warning System</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  HeatPulse is Chennai’s first impact-based thermal intelligence platform. Unlike conventional dry-bulb thermometer metrics, HeatPulse synthesizes mean radiant temperature (Tmrt), Universal Thermal Climate Index (UTCI), wet-bulb globe temperature (WBGT), structural ward population density, and municipal healthcare capacity to deliver actionable early warnings for GCC frontline personnel.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <div className="text-slate-400">SYSTEM STATUS</div>
                    <div className="text-emerald-700 font-semibold mt-0.5">OPERATIONAL (IST)</div>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <div className="text-slate-400">CURRENT VERSION</div>
                    <div className="text-[#F47C20] font-semibold mt-0.5">Phase F1 Application Shell</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#F47C20] hover:bg-orange-600 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
