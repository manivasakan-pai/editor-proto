// Renders the editor's REAL assets (react-charts-lib / react-diagrams-lib, pastel mood,
// dev-CDN theme + font CSS) into plain DOM containers. Mirrors SlideCreator's
// createReactChartAssets / createDiagramAssets / createTableAssets call shapes.
import * as RC from './react-charts-lib.esm.js';
import * as RD from './react-diagrams-lib.esm.js';

export const CDN = 'https://devcdn.presentations.ai/docs/htmlAssets/assets/resources/';
let menus, np, fm, cg;
let uid = 0;

export async function init() {
  if (menus) return;
  const j = u => fetch(u).then(r => r.json());
  [menus, np, fm, cg] = await Promise.all([
    j('lib/menus.json'), j('lib/node-pattern.json'),
    j(CDN + 'moods/pastel/pastel-font-class-mapping.json'),
    j('lib/complex-grid.json').catch(() => null)
  ]);
}
export const menu = name => menus[name];

const clone = o => JSON.parse(JSON.stringify(o));
const nextId = p => p + '-' + (++uid);

/* ---------- Charts ---------- */
export function renderChart(el, name, { rows, title }, scale = 1) {
  const m = clone(menus[name]);
  const props = clone(m.template.propertyConfig || {});
  if (props.xAxis) props.xAxis.showTitle = false;
  if (props.yAxis) props.yAxis.showTitle = false;
  const matrix = rows.map(([l, v], i) => ({ matrix: [
    { data: { id: 'label-' + i }, value: String(l), type: 'text' },
    { data: { id: 'value-' + i + '_0' }, value: String(v), type: 'text' }
  ] }));
  el.id = el.id || nextId('chart');
  const cc = el.classList.contains('th-sections-theme-multiple') ? 'th-sections-theme-multiple' : 'th-sections-theme1';
  el.setAttribute('data-sections-color-class', cc);
  return new Promise(res => {
    try {
      RC.createReactChart(el, {
        menu: m, template: m.template, renderType: 'react_chart',
        elementData: { data: { matrix, properties: props, chartTextContent: title ? { charttitlename: { text: title } } : {} } },
        objCommonData: { staticServerURL: CDN, numSlideScale: scale, moodsData: {}, fontDetails: fm.chart, isTempSlide: true, slideId: 's1', graphicIndex: 0, graphicId: el.id, colorClass: cc }
      }, r => res(r));
      setTimeout(res, 2500);
    } catch (e) { console.error(e); res(null); }
  });
}

/* ---------- Diagrams ---------- */
// The lib takes a node matrix in its own shape. We render the stock template once
// (off screen), keep its node tree, write our copy into it, then render for real.
const tmplCache = {};
let host;
function offscreen(w, h) {
  if (!host) {
    host = document.createElement('div');
    host.className = 'th-light pastel PlusJakartaSans_IBMPlexSans commonLayout';
    host.style.cssText = 'position:fixed;left:-12000px;top:0;pointer-events:none;';
    document.body.appendChild(host);
  }
  const d = document.createElement('div');
  d.className = 'th-sections-theme1';
  d.style.cssText = `position:relative;width:${w}px;height:${h}px;`;
  host.appendChild(d);
  return d;
}
function diagramOpts(m, el, matrix, scale) {
  const T = m.template;
  const cp = k => T[k] ? np.primary[T[k].id] : null;
  return {
    menu: m, template: T, nodePattern: np.primary[T.primary && T.primary.id], nodePatterns: null,
    nodePatternCommonPoint: { start: cp('commonpoint-start'), end: cp('commonpoint-end') }, secondaryJson: np.secondary,
    objCommonData: { staticServerURL: CDN, numSlideScale: scale, moodsData: {}, fontData: fm.diagram, slideId: 's1', languageHelperFunc: k => k, graphicId: el.id, graphicIndex: '0', isTempSlide: true, complexGridJson: cg, defaultContentData: null, commonImagePrompt: { prompt: '', needAssetUpdate: false }, gptType: '' },
    elementData: { data: { matrix } }, renderType: 'diagram'
  };
}
function render(el, opts) {
  return new Promise(res => {
    try { RD.createDiagram(el, opts, r => res(r), () => {}); setTimeout(res, 2500); }
    catch (e) { console.error(e); res(null); }
  });
}
async function templateNodes(name, count) {
  const key = name + '|' + count;
  if (!tmplCache[key]) {
    tmplCache[key] = (async () => {
      const m = clone(menus[name]);
      if (m.template.nodecount) m.template.nodecount.default = count;
      const d = offscreen(1200, 700); d.id = nextId('tmpl');
      const r = await render(d, diagramOpts(m, d, [], 1));
      return r && r.nodes ? r.nodes : null;
    })();
  }
  const n = await tmplCache[key];
  return n ? clone(n) : null;
}
// items: [[heading, body, value?]] → written into heading / body / data-driven text slots
function writeCopy(nodes, items) {
  const walk = e => {
    if (!e) return;
    if (e.type === 'text' && e.data && 'content' in e.data) {
      const it = items[e.data.nodeId];
      if (it) {
        if (e.subtype === 'heading' || e.subtype === 'label') e.data.content = it[0];
        else if (e.subtype === 'body') e.data.content = it[1];
        else if (e.subtype === 'data-driven') e.data.content = it[2] || it[0];
      }
    }
    (e.elements || []).forEach(walk);
  };
  nodes.forEach(n => walk(n.data));
  return nodes;
}
export async function renderDiagram(el, name, items, scale = 1) {
  const m = clone(menus[name]);
  const nc = m.template.nodecount;
  let count = items.length;
  if (nc) count = Math.max(+nc.min || 1, Math.min(+nc.max || count, count));
  if (nc) m.template.nodecount.default = count;
  const nodes = await templateNodes(name, count);
  el.id = el.id || nextId('diagram');
  return render(el, diagramOpts(m, el, nodes ? writeCopy(nodes, items) : [], scale));
}

/* ---------- Table ---------- */
export async function renderTable(el, rows, scale = 1, name = 'cfg-standard-table') {
  const m = clone(menus[name]);
  const T = m.template;
  const tnp = np.table[T.table.id].map(row => row.map(cell => { const node = clone(np.primary[cell.id]); node.pattern = cell.id; return { node, ...cell }; }));
  el.id = el.id || nextId('table');
  const opts = {
    menu: m, template: T, nodePattern: tnp, nodePatternCommonPoint: { start: null, end: null }, secondaryJson: np.secondary,
    objCommonData: { staticServerURL: CDN, numSlideScale: scale, moodsData: {}, fontData: fm.diagram, slideId: 's1', graphicId: el.id, graphicIndex: '0', isTempSlide: true, sequenceNodePattern: np.primary[T.table.sequenceId || 'table-sequence'] },
    elementData: { data: { matrix: [] } }, renderType: 'diagram'
  };
  const r = await render(el, opts);
  // The stock table renders placeholder copy; write our rows into the cells.
  fillTable(el, rows);
  return r;
}
export function fillTable(el, rows) {
  el.querySelectorAll('td.ci-table-cell').forEach(td => {
    const r = +td.dataset.row, c = +td.dataset.col;
    const t = td.querySelector('.ci-text-content');
    const tr = td.closest('tr');
    if (!rows[r]) { if (tr) tr.style.display = 'none'; return; }
    if (rows[r][c] === undefined) { td.style.display = 'none'; return; }
    if (t) t.textContent = rows[r][c];
  });
}
