/**
 * DEVELOPMENT FIXTURES ONLY
 * 
 * Replaces the previous client-side explainability computations.
 * The backend API (GET /api/v1/wards/{ward_id}/explanation) is the sole source 
 * of truth for explanations, drivers, and causal summaries.
 */

import { ExplanationContract } from './types';

export function getMockExplanationContract(wardId: number): ExplanationContract {
  // Mock fixture replacing all client-side logic
  return {
    risk: 0.72,
    heat_hazard: 0.85,
    exposure: 0.90,
    vulnerability: 0.65,
    drivers: [
      {
        factor: 'Thermal Stress',
        contribution: '45.0%',
        impact: 'High UTCI drives primary thermal load.'
      },
      {
        factor: 'Population Exposure',
        contribution: '35.0%',
        impact: 'High population density amplifies risk.'
      },
      {
        factor: 'Vulnerability',
        contribution: '20.0%',
        impact: 'Limited healthcare access.'
      }
    ],
    summary: 'Mock Development Fixture: Ward is experiencing significant thermal stress amplified by high population density.'
  };
}
