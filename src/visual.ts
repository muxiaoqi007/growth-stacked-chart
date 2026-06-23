/*
 * GrowthStackedChart — Power BI Custom Visual v4
 * Fixes: growth calculation, tooltips, spacing, separate colors, legend
 * Built with D3.js v7 + powerbi-visuals-api 5.x
 */

import powerbi from "powerbi-visuals-api";
import * as d3 from "d3";
import IVisual = powerbi.extensibility.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import "../style/visual.less";

/* ================================================================== */
/*  Settings                                                           */
/* ================================================================== */

interface VisualSettings {
  xShow: boolean; xTitle: string; xFontSize: number; xFontColor: string; xYearSize: number;
  yShow: boolean; yTitle: string; yFontSize: number; yFontColor: string; yShortFormat: boolean; yGridLines: boolean;
  dlShow: boolean; dlShowPct: boolean; dlShowVal: boolean; dlShowTotal: boolean;
  dlFontSize: number; dlMinHeight: number; dlValueFormat: string;
  gaShow: boolean; gaLineColor: string; gaLabelColor: string; gaDotColor: string;
  gaFontSize: number; gaLineStyle: string; gaLineGap: number; gaShowDots: boolean;
  lgShow: boolean; lgFontSize: number; lgPosition: string;
  yearOrder: string; stackOrder: string;
  palette: string[];
}

/* ================================================================== */
/*  Data                                                               */
/* ================================================================== */

interface SegmentDatum { location: string; value: number; }
interface BarDatum { group: string; year: string; segments: SegmentDatum[]; total: number; }
interface GroupAggregate {
  group: string; years: string[];
  totals: Record<string, number>; growthPct: number | null;
  barX: Record<string, number>; barTop: Record<string, number>;
}

/* ================================================================== */
/*  Defaults                                                           */
/* ================================================================== */

const DEFAULTS: VisualSettings = {
  xShow: true, xTitle: "", xFontSize: 12, xFontColor: "#555", xYearSize: 11,
  yShow: true, yTitle: "", yFontSize: 11, yFontColor: "#666", yShortFormat: true, yGridLines: true,
  dlShow: true, dlShowPct: true, dlShowVal: true, dlShowTotal: true,
  dlFontSize: 10, dlMinHeight: 18, dlValueFormat: "full",
  gaShow: true, gaLineColor: "#E8800A", gaLabelColor: "#E8800A", gaDotColor: "#E8800A",
  gaFontSize: 14, gaLineStyle: "dashed", gaLineGap: 28, gaShowDots: true,
  lgShow: true, lgFontSize: 11, lgPosition: "top",
  yearOrder: "asc", stackOrder: "data",
  palette: [
    "#E05252", "#F0C230", "#4DB856", "#98D960",
    "#4A90D9", "#8B5CF6", "#E88BC5", "#38BDF8", "#F97316", "#14B8A6"
  ]
};

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function textColorFor(hex: string): string {
  const c = d3.color(hex); if (!c) return "#fff";
  const rgb = c.rgb();
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) > 140 ? "#333" : "#fff";
}
function fmtFull(n: number): string { return d3.format(",")(Math.round(n)); }
function fmtShort(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (a >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (a >= 1e4) return (n / 1e3).toFixed(1) + "K";
  return d3.format(",")(Math.round(n));
}
function fmtNum(n: number, mode: string): string { return mode === "short" ? fmtShort(n) : fmtFull(n); }
function fmtPct(n: number): string { return (n >= 0 ? "+" : "") + n.toFixed(1) + "%"; }
function readFill(obj: Record<string, unknown>, key: string, fallback: string): string {
  const f = obj[key] as powerbi.Fill | undefined;
  return f?.solid?.color || fallback;
}

/* ================================================================== */
/*  Visual                                                             */
/* ================================================================== */

export class Visual implements IVisual {
  private host: IVisualHost;
  private tooltipService: ITooltipServiceWrapper;
  private root: d3.Selection<HTMLElement, unknown, null, undefined>;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private s: VisualSettings;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.tooltipService = createTooltipServiceWrapper(
      this.host.tooltipService, options.element as HTMLElement
    );
    this.root = d3.select(options.element).classed("growthStackedChart", true);
    this.svg = this.root.append("svg");
    this.s = { ...DEFAULTS, palette: [...DEFAULTS.palette] };
  }

  /* ================================================================ */
  /*  enumerateObjectInstances                                         */
  /* ================================================================ */

  public enumerateObjectInstances(
    options: EnumerateVisualObjectInstancesOptions
  ): VisualObjectInstance[] {
    const s = this.s;
    const obj = options.objectName;

    if (obj === "xAxis") return [{
      objectName: "xAxis", selector: undefined,
      properties: { show: s.xShow, title: s.xTitle, fontSize: s.xFontSize, fontColor: s.xFontColor, yearLabelSize: s.xYearSize }
    }];
    if (obj === "yAxis") return [{
      objectName: "yAxis", selector: undefined,
      properties: { show: s.yShow, title: s.yTitle, fontSize: s.yFontSize, fontColor: s.yFontColor, shortFormat: s.yShortFormat, gridLines: s.yGridLines }
    }];
    if (obj === "dataLabels") return [{
      objectName: "dataLabels", selector: undefined,
      properties: { show: s.dlShow, showPercentage: s.dlShowPct, showValue: s.dlShowVal, showTotal: s.dlShowTotal, fontSize: s.dlFontSize, minSegmentHeight: s.dlMinHeight, valueFormat: s.dlValueFormat }
    }];
    if (obj === "growthAnnotation") return [{
      objectName: "growthAnnotation", selector: undefined,
      properties: {
        show: s.gaShow,
        lineColor: s.gaLineColor,
        labelColor: s.gaLabelColor,
        dotColor: s.gaDotColor,
        fontSize: s.gaFontSize, lineStyle: s.gaLineStyle,
        lineGap: s.gaLineGap, showDots: s.gaShowDots
      }
    }];
    if (obj === "legend") return [{
      objectName: "legend", selector: undefined,
      properties: { show: s.lgShow, fontSize: s.lgFontSize, position: s.lgPosition }
    }];
    if (obj === "sortSettings") return [{
      objectName: "sortSettings", selector: undefined,
      properties: { yearOrder: s.yearOrder, stackOrder: s.stackOrder }
    }];
    if (obj === "colorPalette") {
      const props: Record<string, string> = {};
      for (let i = 0; i < 10; i++) props[`color${i + 1}`] = s.palette[i] || DEFAULTS.palette[i] || "#ccc";
      return [{ objectName: "colorPalette", selector: undefined, properties: props }];
    }
    return [];
  }

  /* ================================================================ */
  /*  update                                                           */
  /* ================================================================ */

  public update(options: VisualUpdateOptions): void {
    const { width, height } = options.viewport;
    if (width < 50 || height < 50) return;
    this.readSettings(options.dataViews);
    const bars = this.parseData(options.dataViews?.[0]);
    if (!bars.length) { this.svg.selectAll("*").remove(); return; }
    this.render(bars, width, height, options.dataViews?.[0]);
  }

  /* ================================================================ */
  /*  readSettings                                                     */
  /* ================================================================ */

  private readSettings(dvs: DataView[] | undefined): void {
    this.s = { ...DEFAULTS, palette: [...DEFAULTS.palette] };
    if (!dvs?.[0]?.metadata?.objects) return;
    const objs = dvs[0].metadata.objects;
    type O = Record<string, unknown>;
    const r = (n: string) => objs[n] as O | undefined;

    const x = r("xAxis");
    if (x) {
      if (x["show"] !== undefined) this.s.xShow = x["show"] as boolean;
      if (typeof x["title"] === "string") this.s.xTitle = x["title"];
      if (x["fontSize"] !== undefined) this.s.xFontSize = x["fontSize"] as number;
      this.s.xFontColor = readFill(x, "fontColor", DEFAULTS.xFontColor);
      if (x["yearLabelSize"] !== undefined) this.s.xYearSize = x["yearLabelSize"] as number;
    }

    const y = r("yAxis");
    if (y) {
      if (y["show"] !== undefined) this.s.yShow = y["show"] as boolean;
      if (typeof y["title"] === "string") this.s.yTitle = y["title"];
      if (y["fontSize"] !== undefined) this.s.yFontSize = y["fontSize"] as number;
      this.s.yFontColor = readFill(y, "fontColor", DEFAULTS.yFontColor);
      if (y["shortFormat"] !== undefined) this.s.yShortFormat = y["shortFormat"] as boolean;
      if (y["gridLines"] !== undefined) this.s.yGridLines = y["gridLines"] as boolean;
    }

    const dl = r("dataLabels");
    if (dl) {
      if (dl["show"] !== undefined) this.s.dlShow = dl["show"] as boolean;
      if (dl["showPercentage"] !== undefined) this.s.dlShowPct = dl["showPercentage"] as boolean;
      if (dl["showValue"] !== undefined) this.s.dlShowVal = dl["showValue"] as boolean;
      if (dl["showTotal"] !== undefined) this.s.dlShowTotal = dl["showTotal"] as boolean;
      if (dl["fontSize"] !== undefined) this.s.dlFontSize = dl["fontSize"] as number;
      if (dl["minSegmentHeight"] !== undefined) this.s.dlMinHeight = dl["minSegmentHeight"] as number;
      if (typeof dl["valueFormat"] === "string") this.s.dlValueFormat = dl["valueFormat"];
    }

    const ga = r("growthAnnotation");
    if (ga) {
      if (ga["show"] !== undefined) this.s.gaShow = ga["show"] as boolean;
      this.s.gaLineColor  = readFill(ga, "lineColor",  DEFAULTS.gaLineColor);
      this.s.gaLabelColor = readFill(ga, "labelColor", DEFAULTS.gaLabelColor);
      this.s.gaDotColor   = readFill(ga, "dotColor",   DEFAULTS.gaDotColor);
      if (ga["fontSize"] !== undefined) this.s.gaFontSize = ga["fontSize"] as number;
      if (typeof ga["lineStyle"] === "string") this.s.gaLineStyle = ga["lineStyle"];
      if (ga["lineGap"] !== undefined) this.s.gaLineGap = ga["lineGap"] as number;
      if (ga["showDots"] !== undefined) this.s.gaShowDots = ga["showDots"] as boolean;
    }

    const lg = r("legend");
    if (lg) {
      if (lg["show"] !== undefined) this.s.lgShow = lg["show"] as boolean;
      if (lg["fontSize"] !== undefined) this.s.lgFontSize = lg["fontSize"] as number;
      if (typeof lg["position"] === "string") this.s.lgPosition = lg["position"];
    }

    const so = r("sortSettings");
    if (so) {
      if (typeof so["yearOrder"] === "string") this.s.yearOrder = so["yearOrder"];
      if (typeof so["stackOrder"] === "string") this.s.stackOrder = so["stackOrder"];
    }

    const cp = r("colorPalette");
    if (cp) {
      for (let i = 0; i < 10; i++) {
        const fill = cp[`color${i + 1}`] as powerbi.Fill | undefined;
        if (fill?.solid?.color) this.s.palette[i] = fill.solid.color;
      }
    }
  }

  /* ================================================================ */
  /*  parseData                                                        */
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
      bar.segments.push({ location: loc, value: val });
      bar.total += val;
    }
    return Array.from(map.values());
  }

  /* ================================================================ */
  /*  sortYears                                                        */
  /* ================================================================ */

  private sortYears(years: string[]): string[] {
    const arr = [...years];
    if (this.s.yearOrder === "asc") {
      arr.sort((a, b) => { const na = parseFloat(a), nb = parseFloat(b); return (!isNaN(na) && !isNaN(nb)) ? na - nb : a.localeCompare(b); });
    } else if (this.s.yearOrder === "desc") {
      arr.sort((a, b) => { const na = parseFloat(a), nb = parseFloat(b); return (!isNaN(na) && !isNaN(nb)) ? nb - na : b.localeCompare(a); });
    }
    return arr;
  }

  /* ================================================================ */
  /*  sortLocations                                                    */
  /* ================================================================ */

  private sortLocations(locations: string[], bars: BarDatum[]): string[] {
    if (this.s.stackOrder === "data") return locations;
    const totals = new Map<string, number>();
    for (const loc of locations) totals.set(loc, 0);
    for (const bar of bars) for (const seg of bar.segments) totals.set(seg.location, (totals.get(seg.location) || 0) + seg.value);
    const arr = [...locations];
    arr.sort((a, b) => this.s.stackOrder === "asc"
      ? (totals.get(a) || 0) - (totals.get(b) || 0)
      : (totals.get(b) || 0) - (totals.get(a) || 0));
    return arr;
  }

  /* ================================================================ */
  /*  render                                                           */
  /* ================================================================ */

  private render(bars: BarDatum[], width: number, height: number, dv?: DataView): void {
    this.svg.selectAll("*").remove();
    this.svg.attr("width", width).attr("height", height);

    const s = this.s;
    const groups = [...new Set(bars.map(b => b.group))];
    const years  = this.sortYears([...new Set(bars.map(b => b.year))]);
    const rawLocs = [...new Set(bars.flatMap(b => b.segments.map(seg => seg.location)))];
    const locations = this.sortLocations(rawLocs, bars);

    const locColor = d3.scaleOrdinal<string, string>().domain(locations).range(s.palette);

    const legendH = s.lgShow ? (s.lgPosition === "top" ? 40 : 0) : 0;
    const bottomLegendH = s.lgShow ? (s.lgPosition === "bottom" ? 44 : 0) : 0;
    const margin = { top: 80 + legendH, right: 30, bottom: 80 + bottomLegendH, left: 80 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;
    if (chartW < 60 || chartH < 60) return;

    const maxTotal = d3.max(bars, b => b.total) || 1;
    const mag = Math.pow(10, Math.floor(Math.log10(maxTotal)));
    const yMax = Math.ceil(maxTotal / mag) * mag || maxTotal * 1.1;

    const x0 = d3.scaleBand().domain(groups).range([0, chartW]).paddingInner(0.25).paddingOuter(0.15);
    const x1 = d3.scaleBand().domain(years).range([0, x0.bandwidth()]).paddingInner(0.12);
    const y  = d3.scaleLinear().domain([0, yMax]).nice().range([chartH, 0]);

    const g = this.svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // ---- grid ----
    if (s.yGridLines) {
      g.selectAll(".grid-line").data(y.ticks(5)).enter().append("line")
        .attr("class", "grid-line")
        .attr("x1", 0).attr("x2", chartW).attr("y1", d => y(d)).attr("y2", d => y(d));
    }

    // ---- X axis ----
    if (s.xShow) {
      g.append("line").attr("x1", 0).attr("x2", chartW)
        .attr("y1", chartH).attr("y2", chartH).attr("stroke", "#ccc");
      for (const grp of groups) {
        g.append("text").attr("x", (x0(grp) ?? 0) + x0.bandwidth() / 2).attr("y", chartH + 44)
          .attr("text-anchor", "middle").style("font-size", `${s.xFontSize}px`)
          .style("font-weight", "600").style("fill", s.xFontColor).text(grp);
      }
      if (s.xTitle) {
        g.append("text").attr("x", chartW / 2).attr("y", chartH + 62)
          .attr("text-anchor", "middle").style("font-size", `${s.xFontSize + 1}px`)
          .style("fill", s.xFontColor).text(s.xTitle);
      }
    }

    // ---- Y axis ----
    if (s.yShow) {
      const fmt = s.yShortFormat
        ? (d: d3.NumberValue) => fmtShort(Number(d))
        : (d: d3.NumberValue) => d3.format(",")(d);
      const yAx = g.append("g").attr("class", "axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(fmt));
      yAx.select(".domain").attr("stroke", "#ccc");
      yAx.selectAll("text").style("font-size", `${s.yFontSize}px`).style("fill", s.yFontColor);
      if (s.yTitle) {
        yAx.append("text").attr("transform", "rotate(-90)")
          .attr("x", -chartH / 2).attr("y", -60).attr("text-anchor", "middle")
          .style("font-size", `${s.yFontSize + 1}px`).style("fill", s.yFontColor).text(s.yTitle);
      }
    }

    // ---- stack ----
    const stackGen = d3.stack<Record<string, number>>().keys(locations).value((d, key) => d[key] || 0);

    // ---- bars ----
    const barLookup = new Map<string, BarDatum>();
    bars.forEach(b => barLookup.set(`${b.group}||${b.year}`, b));

    const groupAggs: GroupAggregate[] = groups.map(grp => ({
      group: grp, years, totals: {} as Record<string, number>, growthPct: null,
      barX: {} as Record<string, number>, barTop: {} as Record<string, number>
    }));

    const tooltipSvc = this.tooltipService;

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
        for (const loc of locations) row[loc] = bar.segments.find(seg => seg.location === loc)?.value || 0;
        const series = stackGen([row]);

        const segMap = new Map(bar.segments.map(seg => [seg.location, seg]));
        const barG = g.append("g").attr("transform", `translate(${bx},0)`);

        for (const layer of series) {
          const loc = layer.key;
          if (!loc) continue;
          const seg = segMap.get(loc);
          if (!seg || seg.value <= 0) continue;

          const y0v = layer[0][0], y1v = layer[0][1];
          const segH = y(y0v) - y(y1v);

          const rect = barG.append("rect")
            .attr("class", "bar-rect")
            .attr("x", 0).attr("width", bw)
            .attr("y", y(y1v)).attr("height", Math.max(segH, 0))
            .attr("fill", locColor(loc));

          // ---- Tooltip (via addTooltip API) ----
          const segLabel = loc;
          const segVal = seg.value;
          const barTotal = bar.total;
          const grpYear = `${ga.group} / ${yr}`;

          tooltipSvc.addTooltip(
            d3.select(rect.node()),
            () => [
              { displayName: grpYear, value: "" },
              { displayName: segLabel, value: fmtFull(segVal) },
              { displayName: "Total", value: fmtFull(barTotal) },
              { displayName: "Share", value: `${(segVal / barTotal * 100).toFixed(1)}%` }
            ],
            () => null
          );

          // ---- segment labels ----
          if (s.dlShow && segH >= s.dlMinHeight) {
            const tc = textColorFor(locColor(loc));
            const midY = (y(y1v) + y(y0v)) / 2;
            const cls = `segment-label ${tc === "#333" ? "segment-label-dark" : ""}`;
            if (s.dlShowPct) {
              barG.append("text").attr("class", cls).attr("x", bw / 2)
                .attr("y", midY - (s.dlShowVal ? 6 : 0)).attr("dy", "0.35em")
                .style("font-size", `${s.dlFontSize}px`)
                .text(`${(seg.value / bar.total * 100).toFixed(1)}%`);
            }
            if (s.dlShowVal) {
              barG.append("text").attr("class", cls).attr("x", bw / 2)
                .attr("y", midY + (s.dlShowPct ? 8 : 0)).attr("dy", "0.35em")
                .style("font-size", `${s.dlFontSize}px`)
                .text(fmtNum(seg.value, s.dlValueFormat));
            }
          }
        }

        // ---- total label above bar ----
        const barTopY = y(bar.total);
        ga.barTop[yr] = barTopY;

        if (s.dlShow && s.dlShowTotal) {
          barG.append("text").attr("class", "total-label")
            .attr("x", bw / 2).attr("y", barTopY - 8)
            .text(fmtNum(bar.total, s.dlValueFormat));
        }

        // ---- year label below bar ----
        if (s.xShow) {
          barG.append("text").attr("class", "year-label")
            .attr("x", bw / 2).attr("y", chartH + 18)
            .style("font-size", `${s.xYearSize}px`)
            .attr("text-anchor", "middle").text(yr);
        }
      }
    }

    // ---- growth annotations (auto-calculated) ----
    if (s.gaShow) {
      for (const ga of groupAggs) {
        // Auto-calculate growth from bar totals
        let growth: number | null = null;
        if (years.length >= 2) {
          const t0 = ga.totals[years[0]] || 0;
          const t1 = ga.totals[years[years.length - 1]] || 0;
          if (t0 > 0) growth = ((t1 - t0) / t0) * 100;
        }
        ga.growthPct = growth;
        if (growth === null) continue;

        const cx = (x0(ga.group) ?? 0) + x0.bandwidth() / 2;

        // Compute the highest total-label position across all bars in this group.
        // Total labels sit at barTopY − 8 (baseline); the visible top of the text
        // is ~12 px above that.  The connecting line must clear ALL labels.
        const labelTops = years.map(yr => {
          const bt = ga.barTop[yr];
          return bt !== undefined && bt < chartH ? bt - 8 : chartH;
        });
        const highestLabelTop = Math.min(...labelTops);
        // Horizontal connecting line, gap above the highest label's visible top
        const connY = highestLabelTop - s.gaLineGap;

        // Growth % label centred above the connecting line
        g.append("text").attr("class", "growth-label")
          .attr("x", cx).attr("y", connY - s.gaFontSize * 0.6)
          .style("font-size", `${s.gaFontSize}px`)
          .attr("fill", s.gaLabelColor)
          .text(fmtPct(growth));

        // Connecting line with vertical drops to each bar's total-label area
        if (years.length >= 2) {
          const xA = ga.barX[years[0]], xB = ga.barX[years[years.length - 1]];
          const tA = ga.barTop[years[0]], tB = ga.barTop[years[years.length - 1]];

          if (xA != null && xB != null && tA != null && tB != null && tA < chartH && tB < chartH) {
            const dash = s.gaLineStyle === "solid" ? "none" : s.gaLineStyle === "dotted" ? "2,4" : "6,4";
            const lineGen = d3.line<[number, number]>().x(d => d[0]).y(d => d[1]);

            // Vertical drops start just above each total label (barTop − 20 ≈ label top)
            const pts: [number, number][] = [
              [xA, tA - 20], [xA, connY], [xB, connY], [xB, tB - 20]
            ];

            g.append("path").attr("d", lineGen(pts))
              .attr("stroke", s.gaLineColor).attr("stroke-width", 2)
              .attr("stroke-dasharray", dash).attr("fill", "none");

            if (s.gaShowDots) {
              for (const pt of [pts[0], pts[3]]) {
                g.append("circle").attr("cx", pt[0]).attr("cy", pt[1])
                  .attr("r", 3).attr("fill", s.gaDotColor);
              }
            }
          }
        }
      }
    }

    // ---- legend ----
    if (s.lgShow) this.drawLegend(g, locations, locColor, chartW, chartH);
  }

  /* ================================================================ */
  /*  drawLegend — improved spacing                                    */
  /* ================================================================ */

  private drawLegend(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    locations: string[],
    colorScale: d3.ScaleOrdinal<string, string>,
    chartW: number, chartH: number
  ): void {
    const s = this.s;
    const isTop = s.lgPosition === "top";
    const yPos = isTop ? -26 : chartH + 32;

    const legendG = g.append("g").attr("class", "legend")
      .attr("transform", `translate(0, ${yPos})`);

    // Dynamic item width based on text length
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const baseItemW = 24;  // rect + gap
    let maxTextW = 0;
    if (ctx) {
      ctx.font = `${s.lgFontSize}px "Segoe UI", sans-serif`;
      for (const loc of locations) {
        const tw = ctx.measureText(loc).width;
        if (tw > maxTextW) maxTextW = tw;
      }
    }
    const itemW = baseItemW + maxTextW + 16;  // rect + gap + text + padding
    const totalW = locations.length * itemW;
    const startX = Math.max(0, (chartW - totalW) / 2);

    const items = legendG.selectAll(".legend-item")
      .data(locations).enter().append("g").attr("class", "legend-item")
      .attr("transform", (_, i) => `translate(${startX + i * itemW}, 0)`);

    items.append("rect")
      .attr("width", 16).attr("height", 16).attr("rx", 3)
      .attr("fill", d => colorScale(d));

    items.append("text")
      .attr("x", 22).attr("y", 12)
      .style("font-size", `${s.lgFontSize}px`)
      .text(d => d);
  }
}
