/*
 * GrowthStackedChart — Power BI Custom Visual
 * Modern API: getFormattingModel + rendering events + ColorHelper
 * Selection / context menu / localization / accessibility / landing page
 * Built with D3.js v7 + powerbi-visuals-api 5.11
 */

import powerbi from "powerbi-visuals-api";
import * as d3 from "d3";

import IVisual = powerbi.extensibility.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import FormattingModel = powerbi.visuals.FormattingModel;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualFormattingSettingsModel } from "./settings";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import "../style/visual.less";

type IValueFormatter = ReturnType<typeof valueFormatter.create>;

/* ================================================================== */
/*  Data interfaces                                                     */
/* ================================================================== */

interface SegmentDatum { location: string; value: number; selectionId: ISelectionId; }
interface BarDatum { group: string; year: string; segments: SegmentDatum[]; total: number; }
interface GroupAggregate {
  group: string; years: string[];
  totals: Record<string, number>; growthPct: number | null;
  barX: Record<string, number>; barTop: Record<string, number>;
}

/* ================================================================== */
/*  Constants                                                           */
/* ================================================================== */

const LEGEND_HEIGHT = 14;
const LEGEND_ICON_RADIUS = 5;
const LEGEND_ICON_TEXT_GAP = 6;  // icon -> its label
const LEGEND_ITEM_GAP = 15;      // between consecutive items (native PBI-like)
const TOP_LEGEND_Y = 6;
const TOP_PLOT_MARGIN = 32;
const BOTTOM_LEGEND_GAP = 10;

const PALETTE = [
  "#E05252", "#F0C230", "#4DB856", "#98D960",
  "#4A90D9", "#8B5CF6", "#E88BC5", "#38BDF8", "#F97316", "#14B8A6",
];

/* Native Power BI-like X-axis label geometry (tight rows under the axis) */
const X_YEAR_LABEL_Y = 15;    // sub-category row baseline below axis line
const X_CAT_LABEL_Y = 32;     // category row baseline below axis line
const X_TITLE_Y = 50;         // axis title baseline below axis line
const X_AXIS_H = 38;          // bottom space needed without a title
const X_AXIS_H_TITLE = 56;    // bottom space needed with a title

/* Shared canvas context for text measurement (CJK-safe) */
let measureCtx: CanvasRenderingContext2D | null | undefined;
function measureText(text: string, fontSize: number): number {
  if (measureCtx === undefined) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (measureCtx) {
    measureCtx.font = `${fontSize}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    return measureCtx.measureText(text).width;
  }
  return text.length * fontSize; // fallback: ~1em per char
}
function truncateText(text: string, fontSize: number, maxWidth: number): string {
  if (measureText(text, fontSize) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && measureText(`${t}…`, fontSize) > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}

/* ================================================================== */
/*  Helpers                                                             */
/* ================================================================== */

function textColorFor(hex: string): string {
  const c = d3.color(hex); if (!c) return "#fff";
  const rgb = c.rgb();
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) > 140 ? "#333" : "#fff";
}
function fmtPct(n: number): string { return (n >= 0 ? "+" : "") + n.toFixed(1) + "%"; }

/** Word-wrapping that also handles CJK text (no spaces between words). */
function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    while (current.length > maxChars) {
      lines.push(current.slice(0, maxChars));
      current = current.slice(maxChars);
    }
  }
  if (current) lines.push(current);
  return lines;
}

/* -- Settings accessor helpers for FormattingSettingsModel ---------- */

function bool(card: Record<string, unknown>, key: string, fb: boolean): boolean {
  const s = card[key] as { value?: boolean } | undefined;
  return s?.value ?? fb;
}
function num(card: Record<string, unknown>, key: string, fb: number): number {
  const s = card[key] as { value?: number } | undefined;
  return s?.value ?? fb;
}
function txt(card: Record<string, unknown>, key: string, fb: string): string {
  const s = card[key] as { value?: string } | undefined;
  return s?.value ?? fb;
}
function clr(card: Record<string, unknown>, key: string, fb: string): string {
  const s = card[key] as { value?: { value?: string } } | undefined;
  return s?.value?.value ?? fb;
}
function dd(card: Record<string, unknown>, key: string, fb: string): string {
  const s = card[key] as { value?: string } | undefined;
  return s?.value ?? fb;
}

/* ================================================================== */
/*  Visual                                                              */
/* ================================================================== */

export class Visual implements IVisual {
  private host: IVisualHost;
  private tooltipService: ITooltipServiceWrapper;
  private root: d3.Selection<HTMLElement, unknown, null, undefined>;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  private formattingSettingsService: FormattingSettingsService;
  private formattingModel: VisualFormattingSettingsModel;
  private colorHelper: ColorHelper;
  private events: IVisualEventService;
  private lastDataView: DataView | undefined;

  private selectionManager: ISelectionManager;
  private localizationManager: ILocalizationManager;
  private allowInteractions = true;
  private measureFormat: string | undefined;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.tooltipService = createTooltipServiceWrapper(
      this.host.tooltipService, options.element as HTMLElement
    );
    this.root = d3.select(options.element).classed("growthStackedChart", true);
    this.svg = this.root.append("svg");

    // Modern API services
    this.formattingSettingsService = new FormattingSettingsService();
    this.formattingModel = new VisualFormattingSettingsModel();
    this.colorHelper = new ColorHelper(this.host.colorPalette);
    this.events = options.host.eventService;

    // Selection & localization
    this.selectionManager = this.host.createSelectionManager();
    this.localizationManager = this.host.createLocalizationManager();
    this.allowInteractions = this.host.hostCapabilities?.allowInteractions ?? true;

    // Click on an empty plot area clears the selection
    this.svg.on("click", () => {
      if (!this.allowInteractions) return;
      this.selectionManager.clear().then(() => this.updateSelectionStyle());
    });
    // Context menu on an empty plot area
    this.svg.on("contextmenu", (event: MouseEvent) => {
      event.preventDefault();
      if (!this.allowInteractions) return;
      const emptyId = this.host.createSelectionIdBuilder().createSelectionId();
      this.selectionManager.showContextMenu(emptyId, { x: event.clientX, y: event.clientY });
    });
  }

  /* ================================================================ */
  /*  Localization helper                                              */
  /* ================================================================ */

  private loc(key: string, fallback: string): string {
    try {
      return this.localizationManager.getDisplayName(key) || fallback;
    } catch {
      return fallback;
    }
  }

  /* ================================================================ */
  /*  getFormattingModel — replaces enumerateObjectInstances           */
  /* ================================================================ */

  public getFormattingModel(): FormattingModel {
    if (this.lastDataView) {
      this.formattingModel = this.formattingSettingsService.populateFormattingSettingsModel(
        VisualFormattingSettingsModel, this.lastDataView
      );
    }
    return this.formattingSettingsService.buildFormattingModel(this.formattingModel);
  }

  /* ================================================================ */
  /*  update                                                            */
  /* ================================================================ */

  public update(options: VisualUpdateOptions): void {
    const { width, height } = options.viewport;
    if (width < 50 || height < 50) return;

    // Signal rendering started
    this.events.renderingStarted(options);

    try {
      // Store dataView for getFormattingModel()
      this.lastDataView = options.dataViews?.[0];

      // Resolve current settings from DataView
      if (this.lastDataView) {
        this.formattingModel = this.formattingSettingsService.populateFormattingSettingsModel(
          VisualFormattingSettingsModel, this.lastDataView
        );
      }

      const bars = this.parseData(this.lastDataView);
      if (!bars.length) {
        this.renderLandingPage(width, height);
        this.events.renderingFinished(options);
        return;
      }
      this.render(bars, width, height);
      this.events.renderingFinished(options);
    } catch (e) {
      this.events.renderingFailed(options, (e as Error).message);
    }
  }

  /* ================================================================ */
  /*  parseData                                                         */
  /* ================================================================ */

  private parseData(dv: DataView | undefined): BarDatum[] {
    if (!dv?.categorical) return [];
    const cats = dv.categorical.categories;
    const vals = dv.categorical.values;
    if (!cats?.length || !vals?.length) return [];

    const iG = cats.findIndex(c => c.source.roles?.["group"]);
    const iY = cats.findIndex(c => c.source.roles?.["year"]);
    const iL = cats.findIndex(c => c.source.roles?.["location"]);
    const iV = vals.findIndex(v => v.source.roles?.["value"]);
    if (iG < 0 || iY < 0 || iL < 0 || iV < 0) return [];

    // Respect the format string defined in the data model
    this.measureFormat = vals[iV].source.format;
    const measureQueryName = vals[iV].source.queryName;

    const n = cats[iG].values.length;
    const map = new Map<string, BarDatum>();
    for (let r = 0; r < n; r++) {
      const grp = String(cats[iG].values[r]);
      const yr  = String(cats[iY].values[r]);
      const loc = String(cats[iL].values[r]);
      const val = Number(vals[iV].values[r]) || 0;
      const key = `${grp}||${yr}`;
      if (!map.has(key)) map.set(key, { group: grp, year: yr, segments: [], total: 0 });
      const bar = map.get(key)!;

      const selectionId = this.host.createSelectionIdBuilder()
        .withCategory(cats[iG], r)
        .withCategory(cats[iY], r)
        .withCategory(cats[iL], r)
        .withMeasure(measureQueryName)
        .createSelectionId();

      bar.segments.push({ location: loc, value: val, selectionId });
      bar.total += val;
    }
    return Array.from(map.values());
  }

  /* ================================================================ */
  /*  Sorting                                                           */
  /* ================================================================ */

  private sortYears(years: string[]): string[] {
    const order = dd(
      this.formattingModel.sortSettingsCard as unknown as Record<string, unknown>,
      "yearOrder", "asc"
    );
    const arr = [...years];
    if (order === "asc") {
      arr.sort((a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        return (!isNaN(na) && !isNaN(nb)) ? na - nb : a.localeCompare(b);
      });
    } else if (order === "desc") {
      arr.sort((a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        return (!isNaN(na) && !isNaN(nb)) ? nb - na : b.localeCompare(a);
      });
    }
    return arr;
  }

  private sortLocations(locations: string[], bars: BarDatum[]): string[] {
    const order = dd(
      this.formattingModel.sortSettingsCard as unknown as Record<string, unknown>,
      "stackOrder", "data"
    );
    if (order === "data") return locations;
    const totals = new Map<string, number>();
    for (const loc of locations) totals.set(loc, 0);
    for (const bar of bars)
      for (const seg of bar.segments)
        totals.set(seg.location, (totals.get(seg.location) || 0) + seg.value);
    const arr = [...locations];
    arr.sort((a, b) => order === "asc"
      ? (totals.get(a) || 0) - (totals.get(b) || 0)
      : (totals.get(b) || 0) - (totals.get(a) || 0));
    return arr;
  }

  /* ================================================================ */
  /*  Selection helpers                                                 */
  /* ================================================================ */

  private onSegmentClick(event: MouseEvent, seg: SegmentDatum): void {
    if (!this.allowInteractions) return;
    event.stopPropagation();
    this.selectionManager
      .select(seg.selectionId, event.ctrlKey || event.metaKey)
      .then(() => this.updateSelectionStyle());
  }

  private onSegmentKeyDown(event: KeyboardEvent, seg: SegmentDatum): void {
    if (!this.allowInteractions) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      this.selectionManager
        .select(seg.selectionId, event.ctrlKey || event.metaKey)
        .then(() => this.updateSelectionStyle());
    }
  }

  private onSegmentContextMenu(event: MouseEvent, seg: SegmentDatum): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.allowInteractions) return;
    this.selectionManager.showContextMenu(seg.selectionId, {
      x: event.clientX,
      y: event.clientY,
    });
  }

  private updateSelectionStyle(): void {
    const selected = this.selectionManager.getSelectionIds() as ISelectionId[];
    const hasSelection = selected.length > 0;
    this.svg.selectAll<SVGRectElement, SegmentDatum>(".bar-rect")
      .style("opacity", (d) =>
        !hasSelection || selected.some((id) => id.equals(d.selectionId)) ? null : 0.4
      );
  }

  /* ================================================================ */
  /*  Landing page (shown while the visual has no data)                 */
  /* ================================================================ */

  private renderLandingPage(width: number, height: number): void {
    this.svg.selectAll("*").remove();
    this.svg.attr("width", width).attr("height", height)
      .attr("role", "img")
      .attr("aria-label", this.loc("Visual_LandingTitle", "Growth Stacked Chart"));

    const hc = this.colorHelper.isHighContrast;
    const titleColor = hc ? this.colorHelper.getHighContrastColor("foreground", "#323130") : "#323130";
    const textColor = hc ? this.colorHelper.getHighContrastColor("foreground", "#605E5C") : "#605E5C";

    const title = this.loc("Visual_LandingTitle", "Growth Stacked Chart");
    const desc = this.loc(
      "Visual_LandingDescription",
      "Add Category, Sub-Category, Stack Segment and Value fields to build the chart."
    );

    const g = this.svg.append("g").attr("class", "landing-page");
    g.append("text")
      .attr("x", width / 2).attr("y", height / 2 - 12)
      .attr("text-anchor", "middle")
      .style("font-size", "14px").style("font-weight", "600")
      .style("fill", titleColor)
      .text(title);

    wrapText(desc, 48).forEach((line, i) => {
      g.append("text")
        .attr("x", width / 2).attr("y", height / 2 + 10 + i * 16)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", textColor)
        .text(line);
    });
  }

  /* ================================================================ */
  /*  render                                                            */
  /* ================================================================ */

  private render(bars: BarDatum[], width: number, height: number): void {
    this.svg.selectAll("*").remove();
    this.svg.attr("width", width).attr("height", height);

    const m = this.formattingModel;
    const xC = m.xAxisCard as unknown as Record<string, unknown>;
    const yC = m.yAxisCard as unknown as Record<string, unknown>;
    const dlC = m.dataLabelsCard as unknown as Record<string, unknown>;
    const gaC = m.growthAnnotationCard as unknown as Record<string, unknown>;
    const lgC = m.legendCard as unknown as Record<string, unknown>;
    const cpC = m.colorPaletteCard as unknown as Record<string, unknown>;

    // Read all settings via helpers
    const xShow = bool(xC, "show", true);
    const xTitle = txt(xC, "title", "");
    const xFontSize = num(xC, "fontSize", 11);
    const xFontColor = clr(xC, "fontColor", "#555555");
    const xYearSize = num(xC, "yearLabelSize", 11);

    const yShow = bool(yC, "show", true);
    const yTitle = txt(yC, "title", "");
    const yFontSize = num(yC, "fontSize", 11);
    const yFontColor = clr(yC, "fontColor", "#666666");
    const yShortFormat = bool(yC, "shortFormat", true);
    const yGridLines = bool(yC, "gridLines", true);

    const dlShow = bool(dlC, "show", true);
    const dlShowPct = bool(dlC, "showPercentage", true);
    const dlShowVal = bool(dlC, "showValue", true);
    const dlShowTotal = bool(dlC, "showTotal", true);
    const dlFontSize = num(dlC, "fontSize", 10);
    const dlMinHeight = num(dlC, "minSegmentHeight", 18);
    const dlValueFormat = dd(dlC, "valueFormat", "full");

    const gaShow = bool(gaC, "show", true);
    const gaLabelColor = clr(gaC, "labelColor", "#E8800A");
    const gaLineColor = clr(gaC, "lineColor", "#E8800A");
    const gaDotColor = clr(gaC, "dotColor", "#E8800A");
    const gaFontSize = num(gaC, "fontSize", 14);
    const gaLineStyle = dd(gaC, "lineStyle", "dashed");
    const gaLineGap = num(gaC, "lineGap", 28);
    const gaShowDots = bool(gaC, "showDots", true);

    const lgShow = bool(lgC, "show", true);
    const lgFontSize = num(lgC, "fontSize", 11);
    const lgPosition = dd(lgC, "position", "TopCenter");
    const lgTitle = txt(lgC, "title", "");

    // Build palette from color settings
    const palette: string[] = [];
    for (let i = 1; i <= 10; i++) {
      palette.push(clr(cpC, `color${i}`, PALETTE[i - 1]));
    }

    // High contrast overrides
    const hc = this.colorHelper.isHighContrast;
    const hcFg = hc ? this.colorHelper.getHighContrastColor("foreground", "#000000") : "";
    const hcBg = hc ? this.colorHelper.getHighContrastColor("background", "#FFFFFF") : "";

    // Data processing
    const groups = [...new Set(bars.map(b => b.group))];
    const years  = this.sortYears([...new Set(bars.map(b => b.year))]);
    const rawLocs = [...new Set(bars.flatMap(b => b.segments.map(seg => seg.location)))];
    const locations = this.sortLocations(rawLocs, bars);
    const locColor = d3.scaleOrdinal<string, string>().domain(locations).range(palette);

    // Layout
    // Native Power BI-like density: the visual host owns the title, so legend starts near
    // the top edge of the SVG and plot area follows tightly below it.
    const isTop = lgShow && lgPosition.startsWith("Top");
    const isBottom = lgShow && lgPosition.startsWith("Bottom");
    const xAxisH = !xShow ? 10 : (xTitle ? X_AXIS_H_TITLE : X_AXIS_H);
    const margin = {
      top: isTop ? TOP_PLOT_MARGIN : 24,
      right: 30,
      bottom: xAxisH + (isBottom ? LEGEND_HEIGHT + BOTTOM_LEGEND_GAP + 8 : 0),
      left: 80,
    };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;
    if (chartW < 60 || chartH < 60) return;

    // Value range (supports negative totals as well)
    const maxTotal = d3.max(bars, b => b.total) || 0;
    const minTotal = d3.min(bars, b => b.total) || 0;
    let yMax = 1;
    if (maxTotal > 0) {
      const mag = Math.pow(10, Math.floor(Math.log10(maxTotal)));
      yMax = Math.ceil(maxTotal / mag) * mag;
    }
    const yMin = Math.min(0, minTotal);

    const x0 = d3.scaleBand().domain(groups).range([0, chartW]).paddingInner(0.25).paddingOuter(0.15);
    const x1 = d3.scaleBand().domain(years).range([0, x0.bandwidth()]).paddingInner(0.12);
    const y  = d3.scaleLinear().domain([yMin, yMax]).nice().range([chartH, 0]);

    // Value formatters honour the measure's format string from the model
    const plainFmt: IValueFormatter = valueFormatter.create({
      format: this.measureFormat, allowFormatBeautification: true,
    });
    const shortFmt: IValueFormatter = valueFormatter.create({
      value: Math.max(Math.abs(yMax), Math.abs(yMin), 1),
      format: this.measureFormat, allowFormatBeautification: true,
    });
    const axisFmt = yShortFormat ? shortFmt : plainFmt;
    const labelFmt: IValueFormatter = dlValueFormat === "short"
      ? valueFormatter.create({
          value: Math.max(Math.abs(maxTotal), 1),
          format: this.measureFormat, allowFormatBeautification: true,
        })
      : plainFmt;

    const g = this.svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Accessibility: name the chart for assistive technologies
    this.svg
      .attr("role", "img")
      .attr("aria-label", `${this.loc("Visual_AriaDescription", "Grouped stacked bar chart")}. ` +
        `${groups.length} x ${years.length} x ${locations.length}`);

    // ---- Grid ----
    if (yGridLines) {
      g.selectAll(".grid-line").data(y.ticks(5)).enter().append("line")
        .attr("class", "grid-line")
        .attr("x1", 0).attr("x2", chartW)
        .attr("y1", d => y(d)).attr("y2", d => y(d))
        .attr("stroke", hc ? hcFg : undefined);
    }

    // ---- X axis ----
    if (xShow) {
      g.append("line").attr("x1", 0).attr("x2", chartW)
        .attr("y1", chartH).attr("y2", chartH)
        .attr("stroke", hc ? hcFg : "#ccc");
      const catMaxW = x0.step() - 6; // keep category labels inside their group slot
      for (const grp of groups) {
        g.append("text")
          .attr("x", (x0(grp) ?? 0) + x0.bandwidth() / 2)
          .attr("y", chartH + X_CAT_LABEL_Y)
          .attr("text-anchor", "middle")
          .style("font-size", `${xFontSize}px`)
          .style("fill", hc ? hcFg : xFontColor)
          .text(truncateText(grp, xFontSize, catMaxW));
      }
      if (xTitle) {
        g.append("text")
          .attr("x", chartW / 2).attr("y", chartH + X_TITLE_Y)
          .attr("text-anchor", "middle")
          .style("font-size", `${xFontSize + 1}px`)
          .style("fill", hc ? hcFg : xFontColor)
          .text(xTitle);
      }
    }

    // ---- Y axis ----
    if (yShow) {
      const yAx = g.append("g").attr("class", "axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => axisFmt.format(Number(d))));
      yAx.select(".domain").attr("stroke", hc ? hcFg : "#ccc");
      yAx.selectAll("text")
        .style("font-size", `${yFontSize}px`)
        .style("fill", hc ? hcFg : yFontColor);
      if (yTitle) {
        yAx.append("text").attr("transform", "rotate(-90)")
          .attr("x", -chartH / 2).attr("y", -60)
          .attr("text-anchor", "middle")
          .style("font-size", `${yFontSize + 1}px`)
          .style("fill", hc ? hcFg : yFontColor)
          .text(yTitle);
      }
    }

    // ---- Stack layout ----
    const stackGen = d3.stack<Record<string, number>>()
      .keys(locations)
      .value((d, key) => d[key] || 0);

    const barLookup = new Map<string, BarDatum>();
    bars.forEach(b => barLookup.set(`${b.group}||${b.year}`, b));

    const groupAggs: GroupAggregate[] = groups.map(grp => ({
      group: grp, years, totals: {} as Record<string, number>, growthPct: null,
      barX: {} as Record<string, number>, barTop: {} as Record<string, number>,
    }));

    const tooltipSvc = this.tooltipService;
    const totalLabel = this.loc("Visual_TotalLabel", "Total");
    const shareLabel = this.loc("Visual_ShareLabel", "Share");

    // ---- Bars ----
    for (const ga of groupAggs) {
      const grpX = x0(ga.group) ?? 0;

      for (const yr of years) {
        const bar = barLookup.get(`${ga.group}||${yr}`);
        if (!bar) continue;
        ga.totals[yr] = bar.total;

        const bx = grpX + (x1(yr) ?? 0);
        const bw = x1.bandwidth();
        ga.barX[yr] = bx + bw / 2;

        const row: Record<string, number> = {};
        for (const loc of locations)
          row[loc] = bar.segments.find(seg => seg.location === loc)?.value || 0;
        const series = stackGen([row]);

        const segMap = new Map(bar.segments.map(seg => [seg.location, seg]));
        const barG = g.append("g").attr("transform", `translate(${bx},0)`);

        for (const layer of series) {
          const loc = layer.key;
          if (!loc) continue;
          const seg = segMap.get(loc);
          if (!seg || seg.value === 0) continue;

          const y0v = layer[0][0], y1v = layer[0][1];
          const top = Math.min(y(y0v), y(y1v));
          const segH = Math.abs(y(y0v) - y(y1v));
          const fillColor = hc ? hcBg : locColor(loc);

          const rect = barG.append("rect")
            .datum(seg)
            .attr("class", "bar-rect")
            .attr("tabindex", 0)
            .attr("aria-label", `${ga.group} / ${yr} / ${loc}: ${plainFmt.format(seg.value)}`)
            .attr("x", 0).attr("width", bw)
            .attr("y", top).attr("height", Math.max(segH, 0))
            .attr("fill", fillColor)
            .attr("stroke", hc ? hcFg : "none")
            .attr("stroke-width", hc ? 1 : 0)
            .on("click", (event: MouseEvent) => this.onSegmentClick(event, seg))
            .on("contextmenu", (event: MouseEvent) => this.onSegmentContextMenu(event, seg))
            .on("keydown", (event: KeyboardEvent) => this.onSegmentKeyDown(event, seg));

          // Tooltip
          tooltipSvc.addTooltip(
            d3.select(rect.node()),
            () => [
              { displayName: `${ga.group} / ${yr}`, value: "" },
              { displayName: loc, value: plainFmt.format(seg.value) },
              { displayName: totalLabel, value: plainFmt.format(bar.total) },
              { displayName: shareLabel, value: bar.total !== 0 ? `${(seg.value / bar.total * 100).toFixed(1)}%` : "" },
            ],
            () => null
          );

          // Segment labels
          if (dlShow && segH >= dlMinHeight) {
            const tc = hc ? hcFg : textColorFor(locColor(loc));
            const midY = top + segH / 2;
            const cls = `segment-label ${tc === "#333" ? "segment-label-dark" : ""}`;
            if (dlShowPct && bar.total !== 0) {
              barG.append("text").attr("class", cls)
                .attr("x", bw / 2)
                .attr("y", midY - (dlShowVal ? 6 : 0))
                .attr("dy", "0.35em")
                .style("font-size", `${dlFontSize}px`)
                .text(`${(seg.value / bar.total * 100).toFixed(1)}%`);
            }
            if (dlShowVal) {
              barG.append("text").attr("class", cls)
                .attr("x", bw / 2)
                .attr("y", midY + (dlShowPct && bar.total !== 0 ? 8 : 0))
                .attr("dy", "0.35em")
                .style("font-size", `${dlFontSize}px`)
                .text(labelFmt.format(seg.value));
            }
          }
        }

        // Total label above bar
        const barTopY = y(Math.max(bar.total, 0));
        ga.barTop[yr] = barTopY;

        if (dlShow && dlShowTotal) {
          barG.append("text").attr("class", "total-label")
            .attr("x", bw / 2).attr("y", barTopY - 8)
            .style("fill", hc ? hcFg : undefined)
            .text(labelFmt.format(bar.total));
        }

        // Year label below bar
        if (xShow) {
          barG.append("text").attr("class", "year-label")
            .attr("x", bw / 2).attr("y", chartH + X_YEAR_LABEL_Y)
            .style("font-size", `${xYearSize}px`)
            .style("fill", hc ? hcFg : undefined)
            .attr("text-anchor", "middle").text(yr);
        }
      }
    }

    // ---- Growth annotations (auto-calculated) ----
    if (gaShow) {
      for (const ga of groupAggs) {
        let growth: number | null = null;
        if (years.length >= 2) {
          const t0 = ga.totals[years[0]] || 0;
          const t1 = ga.totals[years[years.length - 1]] || 0;
          if (t0 > 0) growth = ((t1 - t0) / t0) * 100;
        }
        ga.growthPct = growth;
        if (growth === null) continue;

        const cx = (x0(ga.group) ?? 0) + x0.bandwidth() / 2;
        const labelTops = years.map(yr => {
          const bt = ga.barTop[yr];
          return bt !== undefined && bt < chartH ? bt - 8 : chartH;
        });
        const highestLabelTop = Math.min(...labelTops);
        const connY = highestLabelTop - gaLineGap;

        g.append("text").attr("class", "growth-label")
          .attr("x", cx).attr("y", connY - gaFontSize * 0.6)
          .style("font-size", `${gaFontSize}px`)
          .attr("fill", hc ? hcFg : gaLabelColor)
          .text(fmtPct(growth));

        if (years.length >= 2) {
          const xA = ga.barX[years[0]], xB = ga.barX[years[years.length - 1]];
          const tA = ga.barTop[years[0]], tB = ga.barTop[years[years.length - 1]];

          if (xA != null && xB != null && tA != null && tB != null && tA < chartH && tB < chartH) {
            const dash = gaLineStyle === "solid" ? "none" : gaLineStyle === "dotted" ? "2,4" : "6,4";
            const lineGen = d3.line<[number, number]>().x(d => d[0]).y(d => d[1]);
            const pts: [number, number][] = [
              [xA, tA - 24], [xA, connY], [xB, connY], [xB, tB - 24],
            ];

            g.append("path").attr("d", lineGen(pts))
              .attr("stroke", hc ? hcFg : gaLineColor)
              .attr("stroke-width", 2)
              .attr("stroke-dasharray", dash).attr("fill", "none");

            if (gaShowDots) {
              for (const pt of [pts[0], pts[3]]) {
                g.append("circle").attr("cx", pt[0]).attr("cy", pt[1])
                  .attr("r", 3).attr("fill", hc ? hcFg : gaDotColor);
              }
            }
          }
        }
      }
    }

    // ---- Legend ----
    if (lgShow) {
      this.drawLegend(g, locations, locColor, chartW, chartH, lgPosition, lgFontSize, lgTitle, margin.top, hc, hcFg);
    }

    // Apply current cross-filter selection state to the freshly rendered bars
    this.updateSelectionStyle();
  }

  /* ================================================================ */
  /*  drawLegend — native Power BI style with official constants        */
  /* ================================================================ */

  private drawLegend(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    locations: string[],
    colorScale: d3.ScaleOrdinal<string, string>,
    chartW: number, chartH: number,
    position: string, fontSize: number, title: string,
    plotTop: number,
    hc: boolean, hcFg: string,
  ): void {
    const isTop = position.startsWith("Top");

    // Use explicit absolute placement for top legends to avoid margin/y-offset cancellation.
    // Since `g` is translated by `plotTop`, yPos is relative to the plot area's top edge.
    const yPos = isTop
      ? TOP_LEGEND_Y - plotTop
      : chartH + BOTTOM_LEGEND_GAP;

    const legendG = g.append("g").attr("class", "legend")
      .attr("transform", `translate(0, ${yPos})`);

    // Measure each item's text width individually so items pack tightly
    // (native Power BI style: uniform gap between items, not equal-width slots)
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = `${fontSize}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    }
    const measure = (s: string) => ctx
      ? ctx.measureText(s).width
      : s.length * fontSize; // CJK-safe fallback: ~1em per char

    const iconW = LEGEND_ICON_RADIUS * 2 + LEGEND_ICON_TEXT_GAP;
    const textWidths = locations.map(measure);
    const itemsW = locations.reduce(
      (sum, _, i) => sum + iconW + textWidths[i], 0
    ) + LEGEND_ITEM_GAP * Math.max(0, locations.length - 1);
    const titleW = title ? measure(title) + LEGEND_ITEM_GAP : 0;
    const totalW = titleW + itemsW;

    // Horizontal alignment of the whole row
    let startX = 0;
    if (position.endsWith("Center")) {
      startX = Math.max(0, (chartW - totalW) / 2);
    } else if (position.endsWith("Right")) {
      startX = Math.max(0, chartW - totalW);
    }

    // Title
    let offsetX = startX;
    if (title) {
      legendG.append("text")
        .attr("x", offsetX).attr("y", 10)
        .style("font-size", `${fontSize}px`)
        .style("font-weight", "600")
        .style("fill", hc ? hcFg : undefined)
        .text(title);
      offsetX += titleW;
    }

    // Legend items with circular markers, placed at cumulative x positions
    let x = offsetX;
    locations.forEach((loc, i) => {
      const itemG = legendG.append("g").attr("class", "legend-item")
        .attr("transform", `translate(${x}, 0)`);

      itemG.append("circle")
        .attr("cx", LEGEND_ICON_RADIUS)
        .attr("cy", 7)
        .attr("r", LEGEND_ICON_RADIUS)
        .attr("fill", hc ? hcFg : colorScale(loc));

      itemG.append("text")
        .attr("x", iconW)
        .attr("y", 11)
        .style("font-size", `${fontSize}px`)
        .style("fill", hc ? hcFg : undefined)
        .text(loc);

      x += iconW + textWidths[i] + LEGEND_ITEM_GAP;
    });
  }

  /* ================================================================ */
  /*  destroy                                                           */
  /* ================================================================ */

  public destroy(): void {
    this.svg.on("click", null);
    this.svg.on("contextmenu", null);
    this.root.selectAll("*").remove();
  }
}
