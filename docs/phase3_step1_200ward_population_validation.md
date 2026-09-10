# Phase 3 Step 1D — GCC 200-Ward Population and Household Schedule Validation

## 1. Conclusion

**NO AUTHORITATIVE CURRENT-200-WARD DATA FOUND.** GCC's official *Draft Proposal* contains a complete schedule for proposed wards 1–200 with Census-2011 population, households, and residential-building counts. It cannot be joined to final/current wards: the final 2018 delimitation followed objections, modified 119 division boundaries, and changed division numbering. The final Gazette provides no revised population/household schedule or official draft-to-final crosswalk.

## 2. Best source

The strongest candidate is the GCC `DELIMITATION OF WARDS DRAFT PROPOSAL`, Annexure I(d), labelled “DATA ON DRAFT WARD DELIMITATION PROPOSAL.” It expressly covers “WARD 1 TO 200” and its column headings identify `Proposed Ward No.`, `No. of Household in the proposed Ward as per Census 2011`, and `Population of proposed Ward as per Census 2011`. The original official PDF is preserved under `data/raw/gis/gcc/` without modification.

## 3. Coverage

Extraction produced exactly 200 records, with unique proposed ward identifiers 1–200, zero missing/extra IDs, zero duplicate IDs, non-negative population and household values, and a numeric-ID match to all 200 `ward` values in official `EDP_wardBoundary_2025.geojson`. The extracted schedule totals 6,672,103 population and 1,657,808 households.

This is an **identifier match only**: the PDF says *proposed* ward, while the current geometry is a 2025 official layer. A shared 1–200 sequence is not geographic equivalence. Contemporaneous GCC reporting states that 119 division boundaries were modified and division numbers changed during the December 2018 finalization; the final Gazette is controlling for boundaries and contains no revised statistical schedule.

## 4. Variables

| Variable | Available? | Geography | Vintage | Usable? |
| --- | --- | --- | --- | --- |
| Population | Yes, draft schedule | Proposed wards 1–200 | Census 2011 | Not yet production-usable |
| Households | Yes, draft schedule | Proposed wards 1–200 | Census 2011 | Not yet production-usable |
| Residential buildings | Yes, draft schedule | Proposed wards 1–200 | Census 2011 | Not yet production-usable |
| Age/literacy/workers/amenities | No | — | — | No |

## 5. Provenance

- Publisher: Greater Chennai Corporation
- Source: `DELIMITATION_OF_WARDS_DRAFT_PROPOSAL_ENGLISH.pdf`, Annexure I(d)
- URL: `https://www.chennaicorporation.gov.in/delimitation_draft/pdf/DELIMITATION_OF_WARDS_DRAFT_PROPOSAL_ENGLISH.pdf`
- Value vintage: Census 2011
- Publication date: not stated in the downloaded PDF; it is labelled a draft proposal and must not be substituted for the 2018 final Gazette without confirming equivalence.
- Finalization evidence: GCC's 2018 final Gazette follows the objection/finalization process; contemporaneous reporting records that 119 division boundaries and division numbers changed during finalization: `https://www.dtnext.in/amp/story/news/chennai/delimitation-redraws-city-ward-map`.

## 6. Validation

The reproducible extractor reads Annexure I(d) directly from the preserved PDF and rejects output unless it contains each integer ward 1–200 exactly once. The generated `data/validation/gis/200ward_population_qc.csv` records the source population/households, geometry ID match, duplicate/missing flags, vintage, identifier caveat, and non-production status. No records are joined to the master dataset and no existing ERA5 or thermal output changes.

## 7. Files

- `data/raw/gis/gcc/DELIMITATION_OF_WARDS_DRAFT_PROPOSAL_ENGLISH.pdf` — preserved official raw source
- `scripts/phase3_step1_200ward_population_validation.py`
- `data/validation/gis/200ward_population_qc.csv`
- `data/validation/gis/200ward_population_qc_summary.json`
- `docs/phase3_step1_200ward_population_validation.md`
- `tests/test_phase3_step1_200ward_population_validation.py`

## 8. Tests

Tests verify 200 IDs, absence of duplicates/missing IDs, non-negative source fields, geometry numeric-ID compatibility, documented Census-2011 vintage, and the non-production classification.

## 9. Decision

Do not build the population/exposure foundation from this schedule. Retain it only as a rejected historical draft/reference source; a defensible derived population method or a direct final-current official statistical source is required.
