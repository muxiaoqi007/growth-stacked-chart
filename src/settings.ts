/*
 * GrowthStackedChart — Formatting Settings Model (Modern API)
 * Replaces enumerateObjectInstances with getFormattingModel().
 * Uses AutoDropdown (not ItemDropdown) for enum properties —
 * dropdown items come from capabilities.json, values are plain strings.
 */

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

/* ================================================================== */
/*  Card: X-Axis (native-style: Values / Title groups)                 */
/* ================================================================== */

export class XAxisCard extends formattingSettings.CompositeCard {
  name = "xAxis";
  displayName = "X-Axis";
  displayNameKey = "Visual_Object_XAxis";

  show = new formattingSettings.ToggleSwitch({
    name: "show", displayName: "Show", displayNameKey: "Visual_Slice_Show", value: true,
  } as formattingSettings.ToggleSwitch);

  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize", displayName: "Category Font Size", displayNameKey: "Visual_Slice_FontSize", value: 11,
  } as formattingSettings.NumUpDown);
  fontColor = new formattingSettings.ColorPicker({
    name: "fontColor", displayName: "Font Color", displayNameKey: "Visual_Slice_FontColor", value: { value: "#555555" },
  } as formattingSettings.ColorPicker);
  yearLabelSize = new formattingSettings.NumUpDown({
    name: "yearLabelSize", displayName: "Sub-Category Font Size", displayNameKey: "Visual_Slice_YearLabelSize", value: 11,
  } as formattingSettings.NumUpDown);

  titleShow = new formattingSettings.ToggleSwitch({
    name: "titleShow", displayName: "Show Title", displayNameKey: "Visual_Slice_ShowTitle", value: false,
  } as formattingSettings.ToggleSwitch);
  titleText = new formattingSettings.TextInput({
    name: "titleText", displayName: "Title Text", displayNameKey: "Visual_Slice_TitleText", value: "", placeholder: "",
  } as formattingSettings.TextInput);
  titleFontSize = new formattingSettings.NumUpDown({
    name: "titleFontSize", displayName: "Title Font Size", displayNameKey: "Visual_Slice_TitleFontSize", value: 12,
  } as formattingSettings.NumUpDown);
  titleFontColor = new formattingSettings.ColorPicker({
    name: "titleFontColor", displayName: "Title Font Color", displayNameKey: "Visual_Slice_TitleFontColor", value: { value: "#555555" },
  } as formattingSettings.ColorPicker);

  topLevelSlice = this.show;
  groups = [
    new formattingSettings.Group({
      name: "xAxisValues",
      displayName: "Values",
      displayNameKey: "Visual_Group_Values",
      collapsible: true,
      slices: [this.fontSize, this.fontColor, this.yearLabelSize],
    }),
    new formattingSettings.Group({
      name: "xAxisTitle",
      displayName: "Title",
      displayNameKey: "Visual_Group_Title",
      collapsible: true,
      topLevelSlice: this.titleShow,
      slices: [this.titleText, this.titleFontSize, this.titleFontColor],
    }),
  ];
}

/* ================================================================== */
/*  Card: Y-Axis (native-style: Range / Values / Title groups)         */
/* ================================================================== */

export class YAxisCard extends formattingSettings.CompositeCard {
  name = "yAxis";
  displayName = "Y-Axis";
  displayNameKey = "Visual_Object_YAxis";

  show = new formattingSettings.ToggleSwitch({
    name: "show", displayName: "Show", displayNameKey: "Visual_Slice_Show", value: true,
  } as formattingSettings.ToggleSwitch);

  // Range group
  minimum = new formattingSettings.NumUpDown({
    name: "minimum", displayName: "Minimum", displayNameKey: "Visual_Slice_Minimum",
    value: null, placeholder: "Auto",
  } as unknown as formattingSettings.NumUpDown);
  maximum = new formattingSettings.NumUpDown({
    name: "maximum", displayName: "Maximum", displayNameKey: "Visual_Slice_Maximum",
    value: null, placeholder: "Auto",
  } as unknown as formattingSettings.NumUpDown);
  logScale = new formattingSettings.ToggleSwitch({
    name: "logScale", displayName: "Log Scale", displayNameKey: "Visual_Slice_LogScale", value: false,
  } as formattingSettings.ToggleSwitch);
  reverseRange = new formattingSettings.ToggleSwitch({
    name: "reverseRange", displayName: "Reverse Range", displayNameKey: "Visual_Slice_ReverseRange", value: false,
  } as formattingSettings.ToggleSwitch);
  roundRange = new formattingSettings.ToggleSwitch({
    name: "roundRange", displayName: "Round Range", displayNameKey: "Visual_Slice_RoundRange", value: true,
  } as formattingSettings.ToggleSwitch);
  gridLines = new formattingSettings.ToggleSwitch({
    name: "gridLines", displayName: "Grid Lines", displayNameKey: "Visual_Slice_GridLines", value: true,
  } as formattingSettings.ToggleSwitch);

  // Values group
  displayUnits = new formattingSettings.AutoDropdown({
    name: "displayUnits", displayName: "Display Units", displayNameKey: "Visual_Slice_DisplayUnits", value: "auto",
  } as formattingSettings.AutoDropdown);
  decimalPlaces = new formattingSettings.AutoDropdown({
    name: "decimalPlaces", displayName: "Decimal Places", displayNameKey: "Visual_Slice_DecimalPlaces", value: "auto",
  } as formattingSettings.AutoDropdown);
  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize", displayName: "Font Size", displayNameKey: "Visual_Slice_FontSize", value: 11,
  } as formattingSettings.NumUpDown);
  fontColor = new formattingSettings.ColorPicker({
    name: "fontColor", displayName: "Font Color", displayNameKey: "Visual_Slice_FontColor", value: { value: "#666666" },
  } as formattingSettings.ColorPicker);

  // Title group
  titleShow = new formattingSettings.ToggleSwitch({
    name: "titleShow", displayName: "Show Title", displayNameKey: "Visual_Slice_ShowTitle", value: false,
  } as formattingSettings.ToggleSwitch);
  titleText = new formattingSettings.TextInput({
    name: "titleText", displayName: "Title Text", displayNameKey: "Visual_Slice_TitleText", value: "", placeholder: "",
  } as formattingSettings.TextInput);
  titleFontSize = new formattingSettings.NumUpDown({
    name: "titleFontSize", displayName: "Title Font Size", displayNameKey: "Visual_Slice_TitleFontSize", value: 12,
  } as formattingSettings.NumUpDown);
  titleFontColor = new formattingSettings.ColorPicker({
    name: "titleFontColor", displayName: "Title Font Color", displayNameKey: "Visual_Slice_TitleFontColor", value: { value: "#666666" },
  } as formattingSettings.ColorPicker);

  topLevelSlice = this.show;
  groups = [
    new formattingSettings.Group({
      name: "yAxisRange",
      displayName: "Range",
      displayNameKey: "Visual_Group_Range",
      collapsible: true,
      slices: [this.minimum, this.maximum, this.logScale, this.reverseRange, this.roundRange, this.gridLines],
    }),
    new formattingSettings.Group({
      name: "yAxisValues",
      displayName: "Values",
      displayNameKey: "Visual_Group_Values",
      collapsible: true,
      slices: [this.displayUnits, this.decimalPlaces, this.fontSize, this.fontColor],
    }),
    new formattingSettings.Group({
      name: "yAxisTitle",
      displayName: "Title",
      displayNameKey: "Visual_Group_Title",
      collapsible: true,
      topLevelSlice: this.titleShow,
      slices: [this.titleText, this.titleFontSize, this.titleFontColor],
    }),
  ];
}

/* ================================================================== */
/*  Card: Data Labels                                                   */
/* ================================================================== */

export class DataLabelsCard extends formattingSettings.SimpleCard {
  name = "dataLabels";
  displayName = "Data Labels";
  displayNameKey = "Visual_Object_DataLabels";

  show = new formattingSettings.ToggleSwitch({
    name: "show", displayName: "Show Labels", displayNameKey: "Visual_Slice_ShowLabels", value: true,
  } as formattingSettings.ToggleSwitch);
  showPercentage = new formattingSettings.ToggleSwitch({
    name: "showPercentage", displayName: "Show Percentage", displayNameKey: "Visual_Slice_ShowPercentage", value: true,
  } as formattingSettings.ToggleSwitch);
  showValue = new formattingSettings.ToggleSwitch({
    name: "showValue", displayName: "Show Value", displayNameKey: "Visual_Slice_ShowValue", value: true,
  } as formattingSettings.ToggleSwitch);
  showTotal = new formattingSettings.ToggleSwitch({
    name: "showTotal", displayName: "Show Total Above Bar", displayNameKey: "Visual_Slice_ShowTotal", value: true,
  } as formattingSettings.ToggleSwitch);
  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize", displayName: "Font Size", displayNameKey: "Visual_Slice_FontSize", value: 10,
  } as formattingSettings.NumUpDown);
  minSegmentHeight = new formattingSettings.NumUpDown({
    name: "minSegmentHeight", displayName: "Min Segment Height (px)", displayNameKey: "Visual_Slice_MinSegmentHeight", value: 18,
  } as formattingSettings.NumUpDown);
  valueFormat = new formattingSettings.AutoDropdown({
    name: "valueFormat", displayName: "Value Format", displayNameKey: "Visual_Slice_ValueFormat", value: "full",
  } as formattingSettings.AutoDropdown);

  slices = [this.show, this.showPercentage, this.showValue, this.showTotal, this.fontSize, this.minSegmentHeight, this.valueFormat];
}

/* ================================================================== */
/*  Card: Growth Annotation                                             */
/* ================================================================== */

export class GrowthAnnotationCard extends formattingSettings.SimpleCard {
  name = "growthAnnotation";
  displayName = "Growth Annotation";
  displayNameKey = "Visual_Object_GrowthAnnotation";

  show = new formattingSettings.ToggleSwitch({
    name: "show", displayName: "Show", displayNameKey: "Visual_Slice_Show", value: true,
  } as formattingSettings.ToggleSwitch);
  labelColor = new formattingSettings.ColorPicker({
    name: "labelColor", displayName: "Label Color", displayNameKey: "Visual_Slice_LabelColor", value: { value: "#E8800A" },
  } as formattingSettings.ColorPicker);
  lineColor = new formattingSettings.ColorPicker({
    name: "lineColor", displayName: "Line Color", displayNameKey: "Visual_Slice_LineColor", value: { value: "#E8800A" },
  } as formattingSettings.ColorPicker);
  dotColor = new formattingSettings.ColorPicker({
    name: "dotColor", displayName: "Dot Color", displayNameKey: "Visual_Slice_DotColor", value: { value: "#E8800A" },
  } as formattingSettings.ColorPicker);
  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize", displayName: "Label Font Size", displayNameKey: "Visual_Slice_LabelFontSize", value: 14,
  } as formattingSettings.NumUpDown);
  lineStyle = new formattingSettings.AutoDropdown({
    name: "lineStyle", displayName: "Line Style", displayNameKey: "Visual_Slice_LineStyle", value: "dashed",
  } as formattingSettings.AutoDropdown);
  lineGap = new formattingSettings.NumUpDown({
    name: "lineGap", displayName: "Gap Above Bars (px)", displayNameKey: "Visual_Slice_LineGap", value: 28,
  } as formattingSettings.NumUpDown);
  showDots = new formattingSettings.ToggleSwitch({
    name: "showDots", displayName: "Show Endpoint Dots", displayNameKey: "Visual_Slice_ShowDots", value: true,
  } as formattingSettings.ToggleSwitch);

  slices = [this.show, this.labelColor, this.lineColor, this.dotColor, this.fontSize, this.lineStyle, this.lineGap, this.showDots];
}

/* ================================================================== */
/*  Card: Legend                                                        */
/* ================================================================== */

export class LegendCard extends formattingSettings.SimpleCard {
  name = "legend";
  displayName = "Legend";
  displayNameKey = "Visual_Object_Legend";

  show = new formattingSettings.ToggleSwitch({
    name: "show", displayName: "Show", displayNameKey: "Visual_Slice_Show", value: true,
  } as formattingSettings.ToggleSwitch);
  position = new formattingSettings.AutoDropdown({
    name: "position", displayName: "Position", displayNameKey: "Visual_Slice_Position", value: "TopCenter",
  } as formattingSettings.AutoDropdown);
  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize", displayName: "Font Size", displayNameKey: "Visual_Slice_FontSize", value: 11,
  } as formattingSettings.NumUpDown);
  title = new formattingSettings.TextInput({
    name: "title", displayName: "Title", displayNameKey: "Visual_Slice_Title", value: "", placeholder: "",
  } as formattingSettings.TextInput);

  slices = [this.show, this.position, this.fontSize, this.title];
}

/* ================================================================== */
/*  Card: Sort Order                                                    */
/* ================================================================== */

export class SortSettingsCard extends formattingSettings.SimpleCard {
  name = "sortSettings";
  displayName = "Sort Order";
  displayNameKey = "Visual_Object_SortSettings";

  yearOrder = new formattingSettings.AutoDropdown({
    name: "yearOrder", displayName: "Sub-Category Order", displayNameKey: "Visual_Slice_YearOrder", value: "asc",
  } as formattingSettings.AutoDropdown);
  stackOrder = new formattingSettings.AutoDropdown({
    name: "stackOrder", displayName: "Stack Order", displayNameKey: "Visual_Slice_StackOrder", value: "data",
  } as formattingSettings.AutoDropdown);

  slices = [this.yearOrder, this.stackOrder];
}

/* ================================================================== */
/*  Card: Tooltips                                                      */
/* ================================================================== */

export class TooltipsCard extends formattingSettings.SimpleCard {
  name = "tooltips";
  displayName = "Tooltips";
  displayNameKey = "Visual_Object_Tooltips";

  show = new formattingSettings.ToggleSwitch({
    name: "show", displayName: "Show", displayNameKey: "Visual_Slice_Show", value: true,
  } as formattingSettings.ToggleSwitch);

  slices = [this.show];
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
  displayNameKey = "Visual_Object_ColorPalette";

  color1  = new formattingSettings.ColorPicker({ name: "color1",  displayName: "Color 1",  displayNameKey: "Visual_Slice_Color1",  value: { value: PALETTE_DEFAULTS[0] } } as formattingSettings.ColorPicker);
  color2  = new formattingSettings.ColorPicker({ name: "color2",  displayName: "Color 2",  displayNameKey: "Visual_Slice_Color2",  value: { value: PALETTE_DEFAULTS[1] } } as formattingSettings.ColorPicker);
  color3  = new formattingSettings.ColorPicker({ name: "color3",  displayName: "Color 3",  displayNameKey: "Visual_Slice_Color3",  value: { value: PALETTE_DEFAULTS[2] } } as formattingSettings.ColorPicker);
  color4  = new formattingSettings.ColorPicker({ name: "color4",  displayName: "Color 4",  displayNameKey: "Visual_Slice_Color4",  value: { value: PALETTE_DEFAULTS[3] } } as formattingSettings.ColorPicker);
  color5  = new formattingSettings.ColorPicker({ name: "color5",  displayName: "Color 5",  displayNameKey: "Visual_Slice_Color5",  value: { value: PALETTE_DEFAULTS[4] } } as formattingSettings.ColorPicker);
  color6  = new formattingSettings.ColorPicker({ name: "color6",  displayName: "Color 6",  displayNameKey: "Visual_Slice_Color6",  value: { value: PALETTE_DEFAULTS[5] } } as formattingSettings.ColorPicker);
  color7  = new formattingSettings.ColorPicker({ name: "color7",  displayName: "Color 7",  displayNameKey: "Visual_Slice_Color7",  value: { value: PALETTE_DEFAULTS[6] } } as formattingSettings.ColorPicker);
  color8  = new formattingSettings.ColorPicker({ name: "color8",  displayName: "Color 8",  displayNameKey: "Visual_Slice_Color8",  value: { value: PALETTE_DEFAULTS[7] } } as formattingSettings.ColorPicker);
  color9  = new formattingSettings.ColorPicker({ name: "color9",  displayName: "Color 9",  displayNameKey: "Visual_Slice_Color9",  value: { value: PALETTE_DEFAULTS[8] } } as formattingSettings.ColorPicker);
  color10 = new formattingSettings.ColorPicker({ name: "color10", displayName: "Color 10", displayNameKey: "Visual_Slice_Color10", value: { value: PALETTE_DEFAULTS[9] } } as formattingSettings.ColorPicker);

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
  tooltipsCard = new TooltipsCard();
  sortSettingsCard = new SortSettingsCard();
  colorPaletteCard = new ColorPaletteCard();

  cards = [
    this.xAxisCard,
    this.yAxisCard,
    this.dataLabelsCard,
    this.growthAnnotationCard,
    this.legendCard,
    this.tooltipsCard,
    this.sortSettingsCard,
    this.colorPaletteCard,
  ];
}
