# ADR-002: Use Assam as the V1 Pilot Region

## Status

Accepted

## Context

ClimateTwin requires a constrained geographic pilot for validating the complete
digital twin workflow before pan-India expansion.

## Decision

Version 1 will use Assam as the pilot region.

The software architecture will remain region-agnostic and configuration-driven.

## Rationale

Assam provides a meaningful context for:

- monsoon rainfall variability,
- extreme rainfall analysis,
- climate anomaly exploration,
- future flood-context intelligence.

## Constraints

Rainfall and temperature sources may have different spatial resolutions.

The system must preserve source resolution and avoid implying unsupported
district-level precision.

## Future Direction

Later versions will extend the platform toward pan-India coverage.