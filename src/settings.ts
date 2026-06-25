/*
 * GrowthStackedChart — Formatting Settings Model (Modern API)
 * Replaces enumerateObjectInstances with getFormattingModel().
 * Follows powerbi-visuals-utils-formattingmodel v7 patterns.
 */

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

/* ================================================================== */
/*  Shared enum members                                                */
/* ================================================================== */

const valueFormatItems = [
  { value: "short", displayName: "Short (1.2M)" },
  { value: "full", displayName: "Full (1,234,567)" },
];

const lineStyleItems = [
  { value: "dashed", displayName: "Dashed" },
  { value: "solid", displayName: "Solid" },
  { value: "dotted", displayName: "Dotted" },
];

const legendPositionItems = [
  { value: "TopLeft", displayName: "Top Left" },
  { value: "TopCenter", displayName: "Top Center" },
  { value: "TopRight", displayName: "Top Right" },
  { value: "BottomLeft", displayName: "Bottom Left" },
  { value: "BottomCenter", displayName: "Bottom Center" },
  { value: "BottomRight", displayName: "Bottom Right" },
];

const yearOrderItems = [
  { value: "asc", displayName: "Ascending (A → Z)" },
  { value: "desc", displayName: "Descending (Z → A)" },
  { value: "data", displayName: "Data Order" },
];

const stackOrderItems = [
  { value: "data", displayName: "Data Order" },
  { value: "asc", displayName: "Ascending by Value" },
  { value: "desc", displayName: "Descending by Value" },
];

/* ================================================================== */
/*  Card: X-Axis                                                       */
/* ================================================================== */

export class XAxisCard extends formattingSettings.SimpleCard {
  name = "xAxis";
  displayName = "X-Axis";

  show = new formattingSettings.ToggleSwitch({
    name: "show", displayName: "Show", value: true,
  } as formattingSettings.ToggleSwitch);
  title = new formattingSettings.TextInput({
    name: "title", displayName: "Title", value: "", placeholder: "",
  } as formattingSettings.TextInput);
  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize", displayName: "Category Font Size", value: 12,
  } as formattingSettings.NumUpDown);
  fontColor = new formattingSettings.ColorPicker({
    name: "fontColor", displayName: "Font Color", value: { value: "#555555" },
  } as formattingSettings.ColorPicker);
  yearLabelSize = new formattingSettings.NumUpDown({
    name: "yearLabelSize", displayName: "Sub-Category Font Size", value: 11,
  } as formattingSettings.NumUpDown);

  slices = [this.show, this.title, this.fontSize, this.fontColor, this.yearLabelSize];
}

/* ================================================================== */
/*  Card: Y-Axis                                                       */
/* ================================================================== */

export class YAxisCard extends formattingSettings.SimpleCard {
  name = "yAxis";
  displayName = "Y-Axis";

  show = new formattingSettings.ToggleSwitch({
    name: "show", displayName: "Show", value: true,
  } as formattingSettings.ToggleSwitch);
  title = new formattingSettings.TextInput({
    name: "title", displayName: "Title", value: "", placeholder: "",
  } as formattingSettings.TextInput);
  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize", displayName: "Font Size", value: 11,
  } as formattingSettings.NumUpDown);
  fontColor = new formattingSettings.ColorPicker({
    name: "fontColor", displayName: "Font Color", value: { value: "#666666" },
  } as formattingSettings.ColorPicker);
  shortFormat = new formattingSettings.ToggleSwitch({
    name: "shortFormat", displayName: "Short Format (K/M/B)", value: true,
  } as formattingSettings.ToggleSwitch);
  gridLines = new formattingSettings.ToggleSwitch({
    name: "gridLines", displayName: "Grid Lines", value: true,
  } as formattingSettings.ToggleSwitch);

  slices = [this.show, this.title, this.fontSize, this.fontColor, this.shortFormat, this.gridLines];
}

/* ================================================================== */
/*  Card: Data Labels                                                   */
/* ================================================================== */

export class DataLabelsCard extends formattingSettings.SimpleCard {
  name = "dataLabels";
  displayName = "Data Labels";

  show = new formattingSettings.ToggleSwitch({
    name: "show", displayName: "Show Labels", value: true,
  } as formattingSettings.ToggleSwitch);
  showPercentage = new formattingSettings.ToggleSwitch({
    name: "showPercentage", displayName: "Show Percentage", value: true,
  } as formattingSettings.ToggleSwitch);
  showValue = new formattingSettings.ToggleSwitch({
    name: "showValue", displayName: "Show Value", value: true,
  } as formattingSettings.ToggleSwitch);
  showTotal = new formattingSettings.ToggleSwitch({
    name: "showTotal", displayName: "Show Total Above Bar", value: true,
  } as formattingSettings.ToggleSwitch);
  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize", displayName: "Font Size", value: 10,
  } as formattingSettings.NumUpDown);
  minSegmentHeight = new formattingSettings.NumUpDown({
    name: "minSegmentHeight", displayName: "Min Segment Height (px)", value: 18,
  } as formattingSettings.NumUpDown);
  valueFormat = new formattingSettings.ItemDropdown({
    name: "valueFormat", displayName: "Value Format",
    value: valueFormatItems[1], items: valueFormatItems,
  } as formattingSettings.ItemDropdown);

  slices = [this.show, this.showPercentage, this.showValue, this.showTotal, this.fontSize, this.minSegmentHeight, this.valueFormat];
}

/* ================================================================== */
/*  Card: Growth Annotation                                             */
/* ================================================================== */

export class GrowthAnnotationCard extends formattingSettings.SimpleCard {
  name = "growthAnnotation";
  displayName = "Growth Annotation";

  show = new formattingSettings.ToggleSwitch({
    name: "show", displayName: "Show", value: true,
  } as formattingSettings.ToggleSwitch);
  labelColor = new formattingSettings.ColorPicker({
    name: "labelColor", displayName: "Label Color", value: { value: "#E8800A" },
  } as formattingSettings.ColorPicker);
  lineColor = new formattingSettings.ColorPicker({
    name: "lineColor", displayName: "Line Color", value: { value: "#E8800A" },
  } as formattingSettings.ColorPicker);
  dotColor = new formattingSettings.ColorPicker({
    name: "dotColor", displayName: "Dot Color", value: { value: "#E8800A" },
  } as formattingSettings.ColorPicker);
  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize", displayName: "Label Font Size", value: 14,
  } as formattingSettings.NumUpDown);
  lineStyle = new formattingSettings.ItemDropdown({
    name: "lineStyle", displayName: "Line Style",
    value: lineStyleItems[0], items: lineStyleItems,
  } as formattingSettings.ItemDropdown);
  lineGap = new formattingSettings.NumUpDown({
    name: "lineGap", displayName: "Gap Above Bars (px)", value: 28,
  } as formattingSettings.NumUpDown);
  showDots = new formattingSettings.ToggleSwitch({
    name: "showDots", displayName: "Show Endpoint Dots", value: true,
  } as formattingSettings.ToggleSwitch);

  slices = [this.show, this.labelColor, this.lineColor, this.dotColor, this.fontSize, this.lineStyle, this.lineGap, this.showDots];
}

/* ================================================================== */
/*  Card: Legend                                                        */
/* ================================================================== */

export class LegendCard extends formattingSettings.SimpleCard {
  name = "legend";
  displayName = "Legend";

  show = new formattingSettings.ToggleSwitch({
    name: "show", displayName: "Show", value: true,
  } as formattingSettings.ToggleSwitch);
  position = new formattingSettings.ItemDropdown({
    name: "position", displayName: "Position",
    value: legendPositionItems[0], items: legendPositionItems,
  } as formattingSettings.ItemDropdown);
  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize", displayName: "Font Size", value: 11,
  } as formattingSettings.NumUpDown);
  title = new formattingSettings.TextInput({
    name: "title", displayName: "Title", value: "", placeholder: "",
  } as formattingSettings.TextInput);

  slices = [this.show, this.position, this.fontSize, this.title];
}

/* ================================================================== */
/*  Card: Sort Order                                                    */
/* ================================================================== */

export class SortSettingsCard extends formattingSettings.SimpleCard {
  name = "sortSettings";
  displayName = "Sort Order";

  yearOrder = new formattingSettings.ItemDropdown({
    name: "yearOrder", displayName: "Sub-Category Order",
    value: yearOrderItems[0], items: yearOrderItems,
  } as formattingSettings.ItemDropdown);
  stackOrder = new formattingSettings.ItemDropdown({
    name: "stackOrder", displayName: "Stack Order",
    value: stackOrderItems[0], items: stackOrderItems,
  } as formattingSettings.ItemDropdown);

  slices = [this.yearOrder, this.stackOrder];
}

/* ================================================================== */
/*  Card: Stack Colors (10 palette slots)                               */
/* ================================================================== */

const PALETTE_DEFAULTS = [
  "#E05252", "#F0C230", "#4DB856", "#98D960",
  "#4A90D9", "#8B5CF6", "#E88BC5", "#38BDF8", "#F97316", "#14B8A6",
];

export class ColorPaletteCard extends formattingSettings.SimpleCard {
  name = "colorPalette";
  displayName = "Stack Colors";

  color1  = new formattingSettings.ColorPicker({ name: "color1",  displayName: "Color 1",  value: { value: PALETTE_DEFAULTS[0] } } as formattingSettings.ColorPicker);
  color2  = new formattingSettings.ColorPicker({ name: "color2",  displayName: "Color 2",  value: { value: PALETTE_DEFAULTS[1] } } as formattingSettings.ColorPicker);
  color3  = new formattingSettings.ColorPicker({ name: "color3",  displayName: "Color 3",  value: { value: PALETTE_DEFAULTS[2] } } as formattingSettings.ColorPicker);
  color4  = new formattingSettings.ColorPicker({ name: "color4",  displayName: "Color 4",  value: { value: PALETTE_DEFAULTS[3] } } as formattingSettings.ColorPicker);
  color5  = new formattingSettings.ColorPicker({ name: "color5",  displayName: "Color 5",  value: { value: PALETTE_DEFAULTS[4] } } as formattingSettings.ColorPicker);
  color6  = new formattingSettings.ColorPicker({ name: "color6",  displayName: "Color 6",  value: { value: PALETTE_DEFAULTS[5] } } as formattingSettings.ColorPicker);
  color7  = new formattingSettings.ColorPicker({ name: "color7",  displayName: "Color 7",  value: { value: PALETTE_DEFAULTS[6] } } as formattingSettings.ColorPicker);
  color8  = new formattingSettings.ColorPicker({ name: "color8",  displayName: "Color 8",  value: { value: PALETTE_DEFAULTS[7] } } as formattingSettings.ColorPicker);
  color9  = new formattingSettings.ColorPicker({ name: "color9",  displayName: "Color 9",  value: { value: PALETTE_DEFAULTS[8] } } as formattingSettings.ColorPicker);
  color10 = new formattingSettings.ColorPicker({ name: "color10", displayName: "Color 10", value: { value: PALETTE_DEFAULTS[9] } } as formattingSettings.ColorPicker);

  slices = [this.color1, this.color2, this.color3, this.color4, this.color5, this.color6, this.color7, this.color8, this.color9, this.color10];
}

/* ================================================================== */
/*  Model                                                               */
/* ================================================================== */

export class VisualFormattingSettingsModel extends formattingSettings.Model {
  xAxisCard = new XAxisCard();
  yAxisCard = new YAxisCard();
  dataLabelsCard = new DataLabelsCard();
  growthAnnotationCard = new GrowthAnnotationCard();
  legendCard = new LegendCard();
  sortSettingsCard = new SortSettingsCard();
  colorPaletteCard = new ColorPaletteCard();

  cards = [
    this.xAxisCard,
    this.yAxisCard,
    this.dataLabelsCard,
    this.growthAnnotationCard,
    this.legendCard,
    this.sortSettingsCard,
    this.colorPaletteCard,
  ];
}
