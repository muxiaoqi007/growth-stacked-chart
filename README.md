# Growth Stacked Chart - Power BI Custom Visual

Grouped stacked bar chart with segment percentage/value labels, growth rate annotations and connecting lines. Ideal for year-over-year comparison across categories.

## Features

- Stacked bars with percentage and absolute value labels
- Auto-calculated growth rate annotations with dashed connecting lines
- Configurable format pane (X/Y axis, data labels, growth annotation, legend, sort order, colors)
- Tooltip support
- Up to 10 stack segments with customizable color palette

## Data Fields

| Field | Description |
|-------|-------------|
| Category | Primary group on X-axis (e.g., region, product line) |
| Sub-Category | Secondary category compared side-by-side (e.g., year, quarter) |
| Stack Segment | Breakdown dimension stacked within each bar |
| Value | Numeric measure |

## Build

```bash
npm install
npx pbiviz package
```

Output: `dist/*.pbiviz`

## Install in Power BI

1. Open Power BI Desktop
2. Visualizations pane > "..." > "Import a visual from a file"
3. Select the `.pbiviz` file from `dist/`

## License

MIT
