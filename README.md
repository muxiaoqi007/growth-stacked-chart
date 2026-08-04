# Growth Stacked Chart - Power BI Custom Visual

Grouped stacked bar chart with segment percentage/value labels, growth rate annotations and connecting lines. Ideal for year-over-year comparison across categories.

## Features

- Stacked bars with percentage and absolute value labels
- Auto-calculated growth rate annotations with dashed connecting lines
- Configurable format pane (X/Y axis, data labels, growth annotation, legend, sort order, colors)
- Tooltips, selection / cross-filtering, context menu
- Landing page, accessibility (aria labels + keyboard focus), high contrast mode
- Localization (en-US, zh-CN) and respect for model format strings
- Up to 10 stack segments with customizable color palette

## Data Fields

| Field | Description |
|-------|-------------|
| Category | Primary group on X-axis (e.g., region, product line) |
| Sub-Category | Secondary category compared side-by-side (e.g., year, quarter) |
| Stack Segment | Breakdown dimension stacked within each bar |
| Value | Numeric measure |

## Build

Requires [powerbi-visuals-tools](https://www.npmjs.com/package/powerbi-visuals-tools):

```bash
npm install -g powerbi-visuals-tools
npm install
npm run package
```

Output: `dist/*.pbiviz`

A standalone webpack build (no global CLI) is also available: `npm run build`.

## Quality checks

```bash
npm run lint    # eslint with eslint-plugin-powerbi-visuals
npm audit       # must report no high/moderate vulnerabilities
```

## Compatibility

Built against Power BI visuals API **5.9.0**, compatible with current Power BI Desktop and Power BI service releases.

## Install in Power BI

1. Download the latest `.pbiviz` file from the [Releases page](../../releases) (or build it yourself, see above)
2. Open Power BI Desktop
3. Visualizations pane > "..." > "Import a visual from a file"
4. Select the `.pbiviz` file

## License

MIT
