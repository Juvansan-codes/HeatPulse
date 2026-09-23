'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '../components/Header';
import { Sidebar, ScreenId } from '../components/Sidebar';
import { MobileNavDrawer } from '../components/MobileNavDrawer';
import { SettingsModal, SettingsConfig } from '../components/SettingsModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { WardExplainabilityPanel } from '../components/WardExplainabilityPanel';
import { PrototypeController, ViewportMode } from '../components/PrototypeController';
import { HomeDashboardView } from '../views/HomeDashboardView';
import { HeatMapView } from '../views/HeatMapView';
import { ForecastView } from '../views/ForecastView';
import { WardDetailsView } from '../views/WardDetailsView';
import { AlertsView } from '../views/AlertsView';
import { MethodologyView } from '../views/MethodologyView';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { MobileHomeView } from '../views/MobileHomeView';
import { MobileMapView } from '../views/MobileMapView';
import { MobileWardView } from '../views/MobileWardView';
import { MobileForecastView } from '../views/MobileForecastView';
import { MobileAlertsView } from '../views/MobileAlertsView';
import { WARDS_DATA } from '../lib/data';
import { useWards, useForecastByDay, IS_MOCK } from '../lib/api/hooks';
import { buildWardRecords } from '../lib/api/adapter';
import { Search, X, ArrowRight, Smartphone, Loader2, AlertTriangle } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';
import { useHeatPulseStore } from '../store/heatpulse-store';
import { StaleBadge } from '../components/ui/StaleBadge';
import type { WardRecord } from '../lib/types';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  
  // Zustand Client Store Slices
  const selectedWardId = useHeatPulseStore((s) => s.selectedWardId);
  const setSelectedWardId = useHeatPulseStore((s) => s.setSelectedWardId);
  const explainWardId = useHeatPulseStore((s) => s.explainWardId);
  const isExplainOpen = useHeatPulseStore((s) => s.isExplainOpen);
  const setExplainOpen = useHeatPulseStore((s) => s.setExplainOpen);
  const searchQuery = useHeatPulseStore((s) => s.searchQuery);
  const setSearchQuery = useHeatPulseStore((s) => s.setSearchQuery);
  const isSearchOpen = useHeatPulseStore((s) => s.isSearchModalOpen);
  const setIsSearchOpen = useHeatPulseStore((s) => s.setSearchModalOpen);
  const staleTimestamp = useHeatPulseStore((s) => s.staleTimestamp);

  // ── API Data Hooks ──
  const wardsApi = useWards();
  const forecastApi = useForecastByDay(1);

  // Build WardRecord[] from API data, or use fixtures in mock mode
  const ACTIVE_WARDS: WardRecord[] = useMemo(() => {
    if (IS_MOCK) return WARDS_DATA;
    if (wardsApi.data && forecastApi.data) {
      return buildWardRecords(wardsApi.data, forecastApi.data.forecasts);
    }
    return [];
  }, [wardsApi.data, forecastApi.data]);

  const apiLoading = !IS_MOCK && (wardsApi.loading || forecastApi.loading);
  const apiError = !IS_MOCK ? (wardsApi.error || forecastApi.error) : null;

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('GCC Disaster Authority');
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [viewKey, setViewKey] = useState<number>(0);

  // Application Shell Phase F1 modals and states
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('responsive');
  const [showHotspots, setShowHotspots] = useState<boolean>(false);

  const [settingsConfig, setSettingsConfig] = useState<SettingsConfig>({
    tempUnit: 'C',
    windUnit: 'kmh',
    mapStyle: 'obsidian',
    alertAudio: true,
    autoRefreshInterval: 60,
    showGridOverlay: true,
    extremePulseAnimation: true,
    highContrastMode: false
  });

  // Open explainability drawer callback
  const handleOpenExplainability = useCallback((wardId?: number) => {
    if (wardId) {
      setSelectedWardId(wardId);
    }
    setExplainOpen(true, wardId ?? selectedWardId);
  }, [selectedWardId, setSelectedWardId, setExplainOpen]);


  // Keyboard shortcut for Cmd+K / Ctrl+K search & ESC to close explainability
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
        setIsMobileNavOpen(false);
        setExplainOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen, setExplainOpen]);


  const screenTitles: Record<ScreenId, string> = {
    dashboard: 'Executive Command Dashboard',
    map: 'Spatial Heat Impact GIS Map (200 Wards)',
    forecast: '5-Day Calibrated Thermal Forecast',
    'ward-details': 'Ward Analysis Dossier',
    alerts: 'Public Health Action Matrix & Advisories',
    methodology: 'Scientific Methodology & Architecture'
  };

  const handleNavigate = useCallback((screen: ScreenId) => {
    setCurrentScreen(screen);
    setViewKey((prev) => prev + 1);
  }, []);

  const handleSelectWard = useCallback((wardId: number) => {
    setSelectedWardId(wardId);
    setCurrentScreen('ward-details');
    setViewKey((prev) => prev + 1);
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  // Search filter — uses API-backed wards
  const searchResults = searchQuery.trim()
    ? ACTIVE_WARDS.filter((w) => {
        const q = searchQuery.toLowerCase();
        return (
          w.ward_name.toLowerCase().includes(q) ||
          w.ward_id.toString().includes(q) ||
          w.zone_name.toLowerCase().includes(q)
        );
      }).slice(0, 20)
    : [];

  const headerAlertText = useMemo(() => {
    if (ACTIVE_WARDS.length === 0) return 'Loading risk analysis...';
    const veryHighWards = ACTIVE_WARDS.filter(w => w.risk_level === 'Very High' || w.risk_level === 'Extreme');
    const affectedZones = [...new Set(veryHighWards.map(w => w.zone_name))];
    const maxUtci = Math.max(...ACTIVE_WARDS.map(w => w.utci));
    
    if (veryHighWards.length === 0) {
      return `0 Wards under VERY HIGH risk. Normal conditions expected. Max UTCI ${maxUtci.toFixed(1)}°C.`;
    }
    
    const zonesStr = affectedZones.length > 0 ? ` (${affectedZones.slice(0, 3).join(', ')})` : '';
    return (
      <>
        {veryHighWards.length} Wards under <strong className="text-red-900">VERY HIGH</strong> risk
        {zonesStr}. Max UTCI {maxUtci.toFixed(1)}°C.
      </>
    ) as unknown as string; // ReactNode passed as string prop works if Header handles it, wait, Header expects string in TS but we can pass ReactNode. Let's just pass string.
  }, [ACTIVE_WARDS]);

  const mainAppShell = (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#F47C20] selection:text-white relative">
      {/* Top Header Command Bar */}
      <Header
        activeScreenTitle={screenTitles[currentScreen]}
        onOpenSearch={() => setIsSearchOpen(true)}
        selectedRole={userRole}
        onChangeRole={setUserRole}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'ta' : 'en'))}
        onOpenMobileMenu={() => setIsMobileNavOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        showHotspots={showHotspots}
        alertText={headerAlertText as any}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Collapsible Desktop) */}
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          showHotspots={showHotspots}
        />

        {/* Dynamic View Canvas with smooth transition: Optimized for GIS and high-density dashboard */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-slate-50 pb-24">
          <div key={viewKey} className="animate-fadeIn">
            {/* Global API Loading State */}
            {apiLoading && (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
                <span className="text-slate-500">Loading HeatPulse data from API...</span>
              </div>
            )}
            {/* Global API Error State */}
            {apiError && !apiLoading && (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-lg font-bold text-slate-900 mb-2">API Unavailable</h2>
                <p className="text-sm text-slate-500 max-w-md">{apiError}</p>
                <p className="text-xs text-slate-400 mt-2">The backend may be starting up. Please try refreshing.</p>
              </div>
            )}
            {!apiLoading && !apiError && currentScreen === 'dashboard' && (
              <HomeDashboardView
                wards={ACTIVE_WARDS}
                onSelectWard={handleSelectWard}
                onNavigateToMap={() => handleNavigate('map')}
                onNavigateToForecast={() => handleNavigate('forecast')}
                onNavigateToAlerts={() => handleNavigate('alerts')}
                onOpenExplainability={handleOpenExplainability}
              />
            )}

            {!apiLoading && !apiError && currentScreen === 'map' && (
              <HeatMapView
                wards={ACTIVE_WARDS}
                onSelectWard={handleSelectWard}
                onOpenExplainability={handleOpenExplainability}
              />
            )}

            {currentScreen === 'forecast' && <ForecastView />}

            {currentScreen === 'ward-details' && (
              <WardDetailsView
                selectedWardId={selectedWardId}
                onSelectWard={(id) => setSelectedWardId(id)}
                onOpenExplainability={handleOpenExplainability}
                wards={ACTIVE_WARDS}
              />
            )}

            {currentScreen === 'alerts' && <AlertsView />}

            {currentScreen === 'methodology' && (
              <MethodologyView onOpenExplainability={handleOpenExplainability} />
            )}

          </div>
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentScreen={currentScreen}
        onNavigate={(screen) => handleNavigate(screen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'ta' : 'en'))}
        userRole={userRole}
      />

      {/* Settings & About Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={settingsConfig}
        onSaveConfig={(newConfig) => setSettingsConfig(newConfig)}
      />

      {/* User Profile & Role Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        selectedRole={userRole}
        onChangeRole={setUserRole}
      />

      {/* Phase F7 — Explainability "Why This Ward?" Slide-over Panel */}
      <WardExplainabilityPanel
        wardId={explainWardId ?? selectedWardId}
        isOpen={isExplainOpen}
        onClose={() => setExplainOpen(false)}
        onSelectWard={(id) => handleSelectWard(id)}
        wards={ACTIVE_WARDS}
      />


      {/* Global Cmd+K Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-start justify-center pt-16 sm:pt-20 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            {/* Input row */}
            <div className="p-3.5 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search by Ward Name, ID (1-200), or Zone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {searchQuery.trim() === '' ? (
                <div className="p-5 text-center text-xs text-slate-500 space-y-2">
                  <p>Type a ward number (e.g. &quot;114&quot;), area (&quot;Royapuram&quot;, &quot;Adyar&quot;), or zone.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {['Royapuram', 'Anna Nagar', 'Tondiarpet', '114', 'Adyar'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSearchQuery(q === '114' ? '114' : q)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] border border-slate-200 cursor-pointer"
                      >
                        {q === '114' ? 'Ward 114' : q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No wards found matching &quot;<span className="text-slate-900 font-medium">{searchQuery}</span>&quot;.
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((w) => (
                    <button
                      key={w.ward_id}
                      type="button"
                      onClick={() => handleSelectWard(w.ward_id)}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#F47C20] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          W{w.ward_id}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 group-hover:text-[#F47C20] transition-colors">
                            {w.ward_name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Zone {w.zone_id} • {w.zone_name} ({w.region})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <RiskBadge level={w.risk_level} size="sm" />
                        <span className="text-slate-400 group-hover:text-slate-700 transition-colors">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                Press <kbd className="px-1.5 py-0.5 rounded bg-white font-mono text-slate-600 border border-slate-200">ESC</kbd> to exit
              </span>
              <span className="font-medium text-slate-600">200 GCC Wards Indexed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const mobileAppShell = (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative pb-16 selection:bg-[#F47C20] selection:text-white">
      <main className="flex-1 p-3 bg-slate-50 overflow-y-auto">
        <div key={viewKey} className="animate-fadeIn">
          {currentScreen === 'dashboard' && (
            <MobileHomeView
              onNavigateToMap={() => handleNavigate('map')}
              onNavigateToForecast={() => handleNavigate('forecast')}
              onNavigateToAlerts={() => handleNavigate('alerts')}
              onSelectWard={handleSelectWard}
              onOpenExplainability={handleOpenExplainability}
            />
          )}

          {currentScreen === 'map' && (
            <MobileMapView
              onSelectWardDetails={handleSelectWard}
              onOpenExplainability={handleOpenExplainability}
              wards={ACTIVE_WARDS}
            />
          )}

          {currentScreen === 'forecast' && <MobileForecastView />}

          {currentScreen === 'ward-details' && (
            <MobileWardView
              selectedWardId={selectedWardId}
              onSelectWard={(id) => setSelectedWardId(id)}
              onOpenExplainability={handleOpenExplainability}
              wards={ACTIVE_WARDS}
            />
          )}

          {currentScreen === 'alerts' && (
            <MobileAlertsView
              onSelectWardDetails={handleSelectWard}
              onOpenExplainability={handleOpenExplainability}
              wards={ACTIVE_WARDS}
            />
          )}

          {currentScreen === 'methodology' && (
            <MethodologyView onOpenExplainability={handleOpenExplainability} />
          )}
        </div>
      </main>

      <WardExplainabilityPanel
        wardId={explainWardId ?? selectedWardId}
        isOpen={isExplainOpen}
        onClose={() => setExplainOpen(false)}
        onSelectWard={(id) => handleSelectWard(id)}
        wards={ACTIVE_WARDS}
      />


      {/* Mobile Navigation Drawer (For More / Settings / Profile) */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentScreen={currentScreen}
        onNavigate={(screen) => handleNavigate(screen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'ta' : 'en'))}
        userRole={userRole}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={settingsConfig}
        onSaveConfig={(newConfig) => setSettingsConfig(newConfig)}
      />

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        selectedRole={userRole}
        onChangeRole={setUserRole}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenMore={() => setIsMobileNavOpen(true)}
        isMoreOpen={isMobileNavOpen}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Device Frame Wrapper if in mobile simulated mode */}
      {viewportMode === 'mobile' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-200 overflow-y-auto">
          <div className="mb-3 flex items-center gap-2 text-xs font-mono text-slate-600">
            <Smartphone className="w-4 h-4 text-[#F47C20]" />
            <span>Figma Prototype Mobile Viewport Simulation (iPhone 15 Pro • 390px)</span>
          </div>
          {/* Smartphone Bezel */}
          <div className="w-full max-w-[390px] h-[844px] bg-slate-50 rounded-[48px] border-[10px] border-slate-800 shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-slate-300">
            {/* Dynamic Island / Notch */}
            <div className="h-7 bg-slate-900 flex items-center justify-center relative shrink-0 z-40">
              <div className="w-24 h-4 bg-black rounded-full" />
            </div>
            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {mobileAppShell}
            </div>
          </div>
        </div>
      ) : viewportMode === 'desktop' ? (
        <div className="flex-1 flex flex-col items-center bg-slate-200 overflow-x-auto">
          <div className="w-full max-w-[1560px] flex-1 shadow-xl border-x border-slate-300 flex flex-col">
            {mainAppShell}
          </div>
        </div>
      ) : (
        <>
          <div className="hidden lg:block">{mainAppShell}</div>
          <div className="block lg:hidden">{mobileAppShell}</div>
        </>
      )}

      {/* Floating Clickable Prototype Controller & Tour Bar */}
      <PrototypeController
        currentScreen={currentScreen}
        onNavigate={(screen) => handleNavigate(screen)}
        viewportMode={viewportMode}
        onChangeViewportMode={(mode) => setViewportMode(mode)}
        showHotspots={showHotspots}
        onToggleHotspots={() => setShowHotspots(!showHotspots)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />
    </div>
  );
}

