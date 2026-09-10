import React, { useState } from 'react';
import { ALERT_PROTOCOLS } from '../lib/data';
import { AlertProtocol, SeverityLevel } from '../lib/types';
import { RiskBadge } from '../components/RiskBadge';
import {
  ShieldAlert,
  Building,
  HeartPulse,
  HardHat,
  Users,
  Copy,
  Check,
  Globe,
  Radio,
  Share2,
  FileText,
  Clock
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>('Very High');
  const [activeTab, setActiveTab] = useState<'gcc' | 'uphc' | 'labor' | 'public'>('gcc');
  const [copied, setCopied] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');

  const protocol = ALERT_PROTOCOLS.find((p) => p.level === selectedSeverity) || ALERT_PROTOCOLS[3];

  const handleCopyPressRelease = () => {
    const text = language === 'en'
      ? `[GREATER CHENNAI CORPORATION - HEAT EARLY WARNING]
Alert Status: ${protocol.level.toUpperCase()}
Criteria: ${protocol.htsi_range} | ${protocol.utci_range}
Summary: ${protocol.status_summary}
Mandatory Actions:
${protocol.gcc_administration.map((a) => `• ${a}`).join('\n')}
Emergency Contact: GCC Helpline 1913 | Medical Emergency 108`
      : `[பெருநகர சென்னை மாநகராட்சி - வெப்ப அவசர எச்சரிக்கை]
நிலை: ${protocol.level.toUpperCase()}
விவரம்: ${protocol.tamil_summary}
அவசர உதவி எண்: மாநகராட்சி 1913 | ஆம்புலன்ஸ் 108`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Severity Level Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold text-red-400 uppercase tracking-wider">
                OPERATIONAL EARLY WARNING SYSTEM
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Actionable Public Health Advisories & Escalation Protocols
            </h2>
            <p className="text-xs text-slate-400">
              Role-specific standard operating procedures mapped strictly to HeatPulse's 5-tier severity scale.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Select Severity:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(['Normal', 'Moderate', 'High', 'Very High', 'Extreme'] as SeverityLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedSeverity(lvl)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    selectedSeverity === lvl
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Tier Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <RiskBadge level={protocol.level} size="lg" />
              <span className="text-xs font-mono text-slate-400">
                {protocol.htsi_range} • {protocol.utci_range}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 font-medium leading-relaxed">
              {protocol.status_summary}
            </p>
            {protocol.tamil_summary && (
              <p className="text-xs text-amber-300/90 font-sans italic mt-1">
                தமிழ்: {protocol.tamil_summary}
              </p>
            )}
          </div>

          {/* Export Press Release Button */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'Switch to தமிழ்' : 'Switch to English'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyPressRelease}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Media Advisory'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stakeholder Role-Based Action Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        {/* Stakeholder Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'gcc', label: 'GCC Administration & Zonal Teams', icon: <Building className="w-4 h-4" /> },
            { id: 'uphc', label: 'Primary Healthcare (UPHC/HWC)', icon: <HeartPulse className="w-4 h-4" /> },
            { id: 'labor', label: 'Outdoor Labor & Contractors', icon: <HardHat className="w-4 h-4" /> },
            { id: 'public', label: 'Vulnerable Public & Citizens', icon: <Users className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Action Directives List */}
        <div className="space-y-3 py-2">
          {activeTab === 'gcc' && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Mandatory Directives for Greater Chennai Corporation (GCC)
              </h4>
              {protocol.gcc_administration.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{act}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'uphc' && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Clinical Directives for 140 Urban Primary Health Centres (UPHC / HWC)
              </h4>
              {protocol.uphc_healthcare.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{act}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'labor' && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Occupational Directives for Construction, Sanitation & Gig Workers
              </h4>
              {protocol.labor_contractors.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{act}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'public' && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Public Safety Guidelines for Citizens, Senior Residents & Families
              </h4>
              {protocol.vulnerable_public.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-mono text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{act}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. City Escalation Framework Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Chennai Citywide Severity Classification Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Level</th>
                <th className="py-2.5 px-3">HTSI Threshold</th>
                <th className="py-2.5 px-3">UTCI Biophysical Metric</th>
                <th className="py-2.5 px-3">Primary Physiological Risk</th>
                <th className="py-2.5 px-3">Statutory Municipal Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {ALERT_PROTOCOLS.map((p) => (
                <tr key={p.level} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3">
                    <RiskBadge level={p.level} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">{p.htsi_range}</td>
                  <td className="py-2.5 px-3 font-mono text-amber-300 font-semibold">{p.utci_range}</td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-xs leading-normal">
                    {p.status_summary}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                    {p.level === 'Extreme'
                      ? 'Sec 30 DMA 2005 Active'
                      : p.level === 'Very High'
                      ? 'Mandatory Work Stoppage'
                      : p.level === 'High'
                      ? 'Shelter Activations'
                      : 'Advisory Mode'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
