import { AlertProtocol, ForecastDay, WardRecord, ZoneSummary } from './types';
import { ALL_200_WARDS } from './wards200';

export const CHENNAI_ZONES: ZoneSummary[] = [
  { zone_id: 1, zone_name: 'Thiruvottiyur', region: 'North', total_wards: 14, total_derived_pop: 274800, max_risk_level: 'High', avg_htsi: 61.4, hwc_count: 8 },
  { zone_id: 2, zone_name: 'Manali', region: 'North', total_wards: 7, total_derived_pop: 138500, max_risk_level: 'Moderate', avg_htsi: 58.2, hwc_count: 5 },
  { zone_id: 3, zone_name: 'Madhavaram', region: 'North', total_wards: 12, total_derived_pop: 242000, max_risk_level: 'Moderate', avg_htsi: 59.5, hwc_count: 7 },
  { zone_id: 4, zone_name: 'Tondiarpet', region: 'North', total_wards: 15, total_derived_pop: 384000, max_risk_level: 'Very High', avg_htsi: 69.8, hwc_count: 12 },
  { zone_id: 5, zone_name: 'Royapuram', region: 'North', total_wards: 15, total_derived_pop: 442000, max_risk_level: 'Very High', avg_htsi: 72.1, hwc_count: 14 },
  { zone_id: 6, zone_name: 'Thiru-Vi-Ka Nagar', region: 'Central', total_wards: 15, total_derived_pop: 410000, max_risk_level: 'Very High', avg_htsi: 70.4, hwc_count: 13 },
  { zone_id: 7, zone_name: 'Ambattur', region: 'North', total_wards: 15, total_derived_pop: 360000, max_risk_level: 'High', avg_htsi: 64.2, hwc_count: 10 },
  { zone_id: 8, zone_name: 'Anna Nagar', region: 'Central', total_wards: 15, total_derived_pop: 395000, max_risk_level: 'High', avg_htsi: 65.8, hwc_count: 11 },
  { zone_id: 9, zone_name: 'Teynampet', region: 'Central', total_wards: 18, total_derived_pop: 480000, max_risk_level: 'Very High', avg_htsi: 71.0, hwc_count: 15 },
  { zone_id: 10, zone_name: 'Kodambakkam', region: 'Central', total_wards: 16, total_derived_pop: 375000, max_risk_level: 'High', avg_htsi: 66.5, hwc_count: 11 },
  { zone_id: 11, zone_name: 'Valasaravakkam', region: 'South', total_wards: 13, total_derived_pop: 228000, max_risk_level: 'Moderate', avg_htsi: 59.8, hwc_count: 7 },
  { zone_id: 12, zone_name: 'Alandur', region: 'South', total_wards: 12, total_derived_pop: 215000, max_risk_level: 'Moderate', avg_htsi: 58.4, hwc_count: 6 },
  { zone_id: 13, zone_name: 'Adyar', region: 'South', total_wards: 13, total_derived_pop: 278000, max_risk_level: 'Moderate', avg_htsi: 60.1, hwc_count: 9 },
  { zone_id: 14, zone_name: 'Perungudi', region: 'South', total_wards: 11, total_derived_pop: 182000, max_risk_level: 'Moderate', avg_htsi: 57.6, hwc_count: 6 },
  { zone_id: 15, zone_name: 'Sholinganallur', region: 'South', total_wards: 9, total_derived_pop: 142204, max_risk_level: 'Normal', avg_htsi: 52.3, hwc_count: 6 }
];

export const ERA5_GRIDS = [
  { grid_id: 'grid_13.2_80.2', lat: 13.2, lon: 80.2, label: 'North Suburbs (Thiruvottiyur/Manali)', status: 'Land Active' },
  { grid_id: 'grid_13.1_80.2', lat: 13.1, lon: 80.2, label: 'North Urban Core (Royapuram/Tondiarpet)', status: 'Land Active' },
  { grid_id: 'grid_13.0_80.2', lat: 13.0, lon: 80.2, label: 'Central Urban Core (Anna Nagar/Teynampet)', status: 'Land Active' },
  { grid_id: 'grid_12.9_80.2', lat: 12.9, lon: 80.2, label: 'South Urban (Adyar/Alandur/Velachery)', status: 'Land Active' },
  { grid_id: 'grid_12.8_80.2', lat: 12.8, lon: 80.2, label: 'South Coastal (Sholinganallur/OMR)', status: 'Land Active' }
];

export const WARDS_DATA: WardRecord[] = ALL_200_WARDS;

// Today's current conditions for the forecast strip
export const FORECAST_TODAY: ForecastDay = {
  day_offset: 0,
  date: '10 Sep 2026',
  day_name: 'Today',
  max_temperature: 38.2,
  min_temperature: 28.4,
  avg_rh: 71.5,
  max_wind_speed: 2.4,
  max_utci: 43.6,
  max_wbgt: 33.4,
  max_htsi: 76.8,
  risk_level: 'Very High',
  nighttime_stress_flag: true,
  ml_lead_mae_temp: 0.0,
  ml_lead_mae_htsi: 0.0,
  human_heat_risk: 0.72
};

export const FORECAST_DAYS: ForecastDay[] = [
  {
    day_offset: 1,
    date: '11 Sep 2026',
    day_name: 'Tomorrow',
    max_temperature: 38.4,
    min_temperature: 28.2,
    avg_rh: 72.4,
    max_wind_speed: 2.8,
    max_utci: 43.1,
    max_wbgt: 33.2,
    max_htsi: 75.4,
    risk_level: 'Very High',
    nighttime_stress_flag: true,
    ml_lead_mae_temp: 0.85,
    ml_lead_mae_htsi: 3.02,
    human_heat_risk: 0.68
  },
  {
    day_offset: 2,
    date: '12 Sep 2026',
    day_name: 'Saturday',
    max_temperature: 39.1,
    min_temperature: 28.6,
    avg_rh: 70.1,
    max_wind_speed: 2.4,
    max_utci: 44.5,
    max_wbgt: 33.8,
    max_htsi: 77.2,
    risk_level: 'Very High',
    nighttime_stress_flag: true,
    ml_lead_mae_temp: 0.88,
    ml_lead_mae_htsi: 3.18,
    human_heat_risk: 0.74
  },
  {
    day_offset: 3,
    date: '13 Sep 2026',
    day_name: 'Sunday',
    max_temperature: 39.8,
    min_temperature: 29.1,
    avg_rh: 68.5,
    max_wind_speed: 2.1,
    max_utci: 45.8,
    max_wbgt: 34.4,
    max_htsi: 79.5,
    risk_level: 'Very High',
    nighttime_stress_flag: true,
    ml_lead_mae_temp: 0.92,
    ml_lead_mae_htsi: 3.36,
    human_heat_risk: 0.78
  },
  {
    day_offset: 4,
    date: '14 Sep 2026',
    day_name: 'Monday',
    max_temperature: 37.6,
    min_temperature: 27.9,
    avg_rh: 74.8,
    max_wind_speed: 3.5,
    max_utci: 41.2,
    max_wbgt: 32.1,
    max_htsi: 68.9,
    risk_level: 'High',
    nighttime_stress_flag: false,
    ml_lead_mae_temp: 0.93,
    ml_lead_mae_htsi: 3.39,
    human_heat_risk: 0.52
  },
  {
    day_offset: 5,
    date: '15 Sep 2026',
    day_name: 'Tuesday',
    max_temperature: 36.2,
    min_temperature: 27.4,
    avg_rh: 77.2,
    max_wind_speed: 4.1,
    max_utci: 39.5,
    max_wbgt: 31.2,
    max_htsi: 61.2,
    risk_level: 'Moderate',
    nighttime_stress_flag: false,
    ml_lead_mae_temp: 0.95,
    ml_lead_mae_htsi: 3.45,
    human_heat_risk: 0.38
  }
];

export const ALERT_PROTOCOLS: AlertProtocol[] = [
  {
    level: 'Normal',
    color_hex: '#10b981',
    htsi_range: 'HTSI < 50.0 (Below P50)',
    utci_range: 'UTCI < 26.0°C (No Thermal Stress)',
    status_summary: 'Normal baseline thermal conditions. Standard municipal operations and public activity permitted without restriction.',
    gcc_administration: [
      'Maintain standard civic water points at bus termini and transit junctions.',
      'Regular routine maintenance of park misting stations and public fountains.'
    ],
    uphc_healthcare: [
      'Standard surveillance for routine dehydration in maternal and infant clinics.',
      'Stock ORS replenishment per monthly quota.'
    ],
    labor_contractors: [
      'Standard 8-hour construction shifts with regular hydration breaks.',
      'Ensure basic on-site clean potable water availability.'
    ],
    vulnerable_public: [
      'Standard daily fluid intake (2 to 2.5 litres).',
      'Normal outdoor movement.'
    ],
    tamil_summary: 'வழக்கமான வெப்பநிலை சூழல். இயல்பான பொதுப் பணிகள் தொடரலாம்.'
  },
  {
    level: 'Moderate',
    color_hex: '#f59e0b',
    htsi_range: 'HTSI 50.0 – 65.0 (P50 to P75)',
    utci_range: 'UTCI 26.0°C – 32.0°C (Moderate Heat Stress)',
    status_summary: 'Elevated thermal discomfort. Precautionary monitoring for outdoor laborers and geriatric residents across urban heat islands.',
    gcc_administration: [
      'Deploy inspection squads to ensure worksite shade and drinking water in construction corridors.',
      'Increase inspection of municipal water distribution tankers across high-density wards.'
    ],
    uphc_healthcare: [
      'Alert urban health nurses to monitor elderly patients with cardiovascular conditions during home visits.',
      'Verify buffer stocks of zinc and rehydration salts in UPHC dispensaries.'
    ],
    labor_contractors: [
      'Mandate 15-minute shaded rest breaks every 2 hours of heavy outdoor exertion.',
      'Provide covered rest tarpaulins on construction scaffolding.'
    ],
    vulnerable_public: [
      'Increase hydration to 3 litres daily; carry umbrella or head covering between 11:00 and 15:00 IST.',
      'Limit high-intensity sports or jogging during midday peak hours.'
    ],
    tamil_summary: 'மிதமான வெப்ப அழுத்தம். முதியவர்கள் மற்றும் வெளிப்புறப் பணியாளர்கள் தகுந்த நீர் அருந்தி எச்சரிக்கையுடன் செயல்படவும்.'
  },
  {
    level: 'High',
    color_hex: '#f97316',
    htsi_range: 'HTSI 65.0 – 72.0 (P75 to P90)',
    utci_range: 'UTCI 32.0°C – 38.0°C (Strong Heat Stress)',
    status_summary: 'Strong physiological strain. Heightened risk of heat cramps and exhaustion. Active intervention required in dense urban wards.',
    gcc_administration: [
      'Activate designated public air-cooled shelters (community halls, library reading rooms) 11:00 to 17:00 IST.',
      'Operate mobile water misting tankers along high-pedestrian corridors (Ranganathan Street, Broadway, Central Station).',
      'Display real-time HTSI heat advisories on all electronic Variable Message Signs (VMS) on city arterial roads.'
    ],
    uphc_healthcare: [
      'Establish a designated heat-triage bed in each UPHC equipped with cooling fans and oral rehydration supplies.',
      'Ensure 108 Emergency Ambulance service has pre-positioned ice packs and IV normal saline.'
    ],
    labor_contractors: [
      'Mandatory suspension of direct-sun unshaded manual labor between 12:00 and 15:00 IST.',
      'Supply chilled electrolyte/butter-milk solutions to site workers at contractor expense.'
    ],
    vulnerable_public: [
      'Senior citizens (65+) and infants must stay indoors in ventilated or shaded rooms.',
      'Avoid caffeinated, alcoholic, or heavy sugary beverages that accelerate dehydration.'
    ],
    tamil_summary: 'அதிக வெப்ப அழுத்தம். நண்பகல் 12 மணி முதல் பிற்பகல் 3 மணி வரை கடுமையான வெயிலில் வேலை செய்வதை தவிர்க்கவும்.'
  },
  {
    level: 'Very High',
    color_hex: '#ef4444',
    htsi_range: 'HTSI 72.0 – 80.0 (P90 to P97.5)',
    utci_range: 'UTCI 38.0°C – 46.0°C (Very Strong Heat Stress)',
    status_summary: 'Severe municipal heat hazard. High probability of heat exhaustion and impending heat stroke across exposed populations.',
    gcc_administration: [
      'Issue emergency municipal order enforcing complete halt of outdoor construction and road surfacing 11:30 to 15:30 IST.',
      'Deploy GCC water-sprinkling tankers across dense wards in Royapuram, Tondiarpet, and Thiru-Vi-Ka Nagar.',
      'Extend open hours of major city parks (Semmozhi Poonga, Nageswara Rao Park) until 22:00 IST for night cooling relief.'
    ],
    uphc_healthcare: [
      'Mobilize rapid medical response teams at GCC regional dispensaries; 24/7 staffing of heat stroke emergency beds.',
      'Track daily ward-level heat exhaustion admissions and upload data to the HeatPulse surveillance dashboard.'
    ],
    labor_contractors: [
      'Enforce full work stoppage during midday hours without wage deduction under GCC Disaster Management regulations.',
      'Conduct mandatory morning vital checks (pulse, dizziness check) for all industrial and sanitation workers.'
    ],
    vulnerable_public: [
      'Strictly avoid direct sunlight; use wet cloths/sponges for cooling if air conditioning is unavailable.',
      'Immediately report signs of heat stroke (cessation of sweating, confusion, nausea, body temp > 103°F) to 108.'
    ],
    tamil_summary: 'மிக அதிக வெப்ப அபாயம்! அவசர சுகாதார எச்சரிக்கை. வெளிப்புற உடலுழைப்பு மதிய வேளையில் முழுமையாக தடை செய்யப்படுகிறது.'
  },
  {
    level: 'Extreme',
    color_hex: '#7c3aed',
    htsi_range: 'HTSI > 80.0 (Above P97.5) or UTCI ≥ 46.0°C',
    utci_range: 'UTCI ≥ 46.0°C (Extreme Thermal Strain)',
    status_summary: 'Catastrophic thermal strain. Life-threatening physiological heat load with rapid onset of hyperthermia and circulatory failure.',
    gcc_administration: [
      'Activate Municipal Disaster Management Heat Emergency Protocol under District Collector & GCC Commissioner.',
      'Deploy civil defense volunteers and home guards for emergency door-to-door welfare checks on isolated elderly.',
      'Coordinate with TANGEDCO to guarantee uninterrupted power supply to primary medical centers and pumping stations.',
      'Public transport buses instructed to operate shaded holding points.'
    ],
    uphc_healthcare: [
      'Declare Level 1 Mass Casualty triage readiness across all GCC tertiary and district hospitals (Rajiv Gandhi GH, Kilpauk, Stanley).',
      'Immediate whole-body ice-water immersion capabilities active for admitted heat hyperpyrexia cases.'
    ],
    labor_contractors: [
      'Complete, legally mandated cessation of all non-emergency outdoor labor; violators subject to immediate municipal penal action.'
    ],
    vulnerable_public: [
      'Code Red Emergency: All citizens instructed to remain in coolest accessible indoor spaces.',
      'Contact GCC Emergency Helpline 1913 or Health Hotline 104 immediately for assistance.'
    ],
    tamil_summary: 'தீவிர பெருவெப்ப அவசரநிலை! உயிருக்கு ஆபத்தான வெப்ப சூழல். பொதுமக்கள் அனைவரும் பாதுகாப்பான குளிர்ந்த இடங்களில் இருக்கவும்.'
  }
];
