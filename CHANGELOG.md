# Changelog

## 1.4.0.0 — 2026-08-05

Standard tooltip support, aligned with native visuals.

### Added

- **Tooltips field bucket** (new "Tooltips" data role, up to 5 measures): extra measures added there appear as additional rows in the tooltip, formatted with their own model format strings
- Report page tooltip support (`supportedTypes.canvas`) — hovering passes the data point identity (selectionId) so report-page tooltips and drill actions work
- Modern (enhanced) tooltips enabled (`supportEnhancedTooltips`)

## 1.3.0.0 — 2026-08-05

### Added

- Tooltips settings card (show toggle) — tooltips can now be switched off from the format pane

### Changed

- Format pane fully localized: every card, group, slice and dropdown item now resolves through string resources — zh-CN displays all-Chinese names, en-US stays English (no more mixed language UI)
- FormattingSettingsService is now constructed with the visual's localization manager so displayNameKeys take effect

## 1.2.0.0 — 2026-08-05

Format pane restructured to follow the native Power BI axis settings (per standard chart spec).

### Added

- Y-Axis **Range** group: Minimum / Maximum (Auto by default), Log Scale, Reverse Range, Round Range, Grid Lines
- Y-Axis **Values** group: Display Units (Auto/None/Thousands/Millions/Billions), Decimal Places (Auto/0–4), font size & color
- X-Axis / Y-Axis **Title** groups with their own show toggle, title text, font size and color
- Localized group/slice names (en-US, zh-CN) for all axis settings

### Changed

- X-Axis and Y-Axis cards are now composite cards with collapsible groups (native pane layout)
- Axis titles are off by default and driven by the Title group toggle (replaces the old free-text title behavior)
- Replaced the old "Short Format (K/M/B)" Y-axis toggle with standard Display Units + Decimal Places

## 1.1.1.0 — 2026-08-05

### Changed

- X-axis label layout now matches native Power BI density: sub-category labels sit close to the axis line, category labels follow on a tighter second row, and the bottom margin adapts to the actual label rows (plot area gains back ~6-20px)
- Category labels use normal font weight and default size 11 (was bold 12), consistent with native visuals
- Long category labels are ellipsized to their group slot width instead of overflowing into neighbors
- Growth-annotation drop lines start higher so they no longer touch the total labels above bars

## 1.1.0.0 — 2026-08-04

Certification-readiness release. Targets Power BI visuals API 5.9.0.

### Added

- Selection & cross-filtering: click / Ctrl+click bar segments to filter other visuals; click empty area to clear
- Context menu on segments and plot background
- Landing page (localized) shown while the visual has no data
- Accessibility: `role="img"` with dynamic `aria-label` on the chart, keyboard-focusable segments (Tab + Enter/Space) with visible focus style, `supportsKeyboardFocus` capability
- Localization via `createLocalizationManager()` with en-US and zh-CN string resources (`stringResources/<locale>/resources.resjson`)
- Capabilities: `dataReductionAlgorithm` (large data sets), `supportsLandingPage`, `supportsMultiVisualSelection`, `sorting: custom`, `tooltips`
- ESLint toolchain required for certification: `eslint` + `eslint-plugin-powerbi-visuals` (flat config), `npm run lint`
- `CHANGELOG.md`, README compatibility/install notes

### Changed

- Value formatting now uses the official `valueFormatter` service and honors the measure's format string from the data model (data labels, axis ticks, tooltips)
- Negative values are handled correctly (Y-domain includes negatives, segment heights computed with absolute deltas)
- Tooltip labels ("Total", "Share") localized; division-by-zero guards added
- `pbiviz.json` is now the single source of truth for visual metadata (webpack config reads it instead of duplicating values)
- Unified version number (1.1.0.0) across `package.json` / `pbiviz.json`
- Dependency alignment to the API 5.9 generation: `powerbi-visuals-utils-formattingmodel` 6.0.4, `powerbi-visuals-utils-formattingutils` 6.1.1, `powerbi-visuals-utils-colorutils` 6.0.6, `powerbi-visuals-utils-tooltiputils` 6.0.5

### Removed

- Unused `powerbi-visuals-utils-chartutils` dependency
- Legacy `.eslintrc.json` (replaced by `eslint.config.mjs`)

### Verification

- `npm audit`: 0 vulnerabilities
- `npm run lint`: 0 errors (official recommended rules)
- `pbiviz package` (powerbi-visuals-tools 7.x): builds cleanly, lint passes
- `pbiviz package --certification-audit`: no external requests found

## 1.0.11.0 and earlier

Initial releases: grouped stacked bars with segment percentage/value labels, growth-rate annotations with connecting lines, configurable format pane (axes, data labels, growth annotation, legend, sort order, 10-color palette), tooltips, high contrast support.
