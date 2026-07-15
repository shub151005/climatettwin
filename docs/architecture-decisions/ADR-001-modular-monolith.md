# ADR-001: Use a Modular Monolith for V1

## Status

Accepted

## Context

ClimateTwin V1 requires clear separation between climate-domain logic,
forecasting, scenarios, analytics, storage, and API concerns.

The project does not yet have operational scale that justifies independent
microservices.

## Decision

The V1 backend will use a modular monolith.

Domain modules will maintain explicit boundaries, while the backend remains
a single deployable application.

Offline data and ML pipelines remain separately executable workloads.

## Consequences

### Positive

- simpler local development,
- lower deployment complexity,
- easier debugging,
- clear internal boundaries,
- future service extraction remains possible.

### Negative

- modules share one application runtime,
- boundaries require discipline,
- independent scaling is deferred.

## Future Review

This decision should be reconsidered only when actual operational requirements
justify independent deployment or scaling.