/* Smoke Watch card: smoke detectors at a glance.
 *
 * Three styles:
 *   device - one detector drawn as a device, ring and LED in the state colour
 *   alert  - one detector as a slim line, a coloured alert block when something is wrong
 *   rooms  - all detectors in one list, problems highlighted
 *
 * Each detector is given by its smoke entity. Battery, connection, sensor fault
 * and end of life are found on the same device; they can be set by hand too.
 */

const CARD_VERSION = "0.1.1";
const STYLES = ["device", "alert", "rooms"];

const TEXT = {
  de: {
    smoke: "Rauch", fault: "Sensor", online: "Verbindung", battery: "Batterie", eol: "Lebensdauer",
    smoke_ok: "Kein Rauch", smoke_bad: "Rauch erkannt", fault_ok: "OK", fault_bad: "Störung",
    online_ok: "Online", online_bad: "Offline", battery_ok: "OK", battery_bad: "Schwach",
    eol_ok: "OK", eol_bad: "Erreicht",
    ok_h: "Alles in Ordnung", ok_s: "Kein Rauch · Gerät bereit",
    crit_h: "Rauch erkannt", crit_s: "Sofort prüfen und Raum verlassen",
    fault_h: "Sensorstörung", fault_s: "Rauchkammer prüfen oder Gerät tauschen",
    off_h: "Nicht erreichbar", off_s: "Verbindung / Gateway prüfen",
    battery_h: "Batterie schwach", battery_s: "Batterie zeitnah tauschen",
    eol_h: "Lebensdauer erreicht", eol_s: "Rauchmelder austauschen",
    detector: "Rauchmelder", detectors: "Rauchmelder", ok: "OK",
    all_ok: "Alle {n} OK", n_bad: "{b} von {n} mit Problem", checks_ok: "{o}/{n} OK",
    no_entities: "Noch kein Rauchmelder gewählt", not_found: "Entität nicht gefunden",
    entities: "Rauchmelder (Rauch-Entitäten)", title: "Titel", style: "Stil",
    style_device: "Gerät (ein Melder)", style_alert: "Alarm zuerst (ein Melder)", style_rooms: "Raumliste (alle Melder)",
    battery_threshold: "Batterie schwach unter (%)",
  },
  en: {
    smoke: "Smoke", fault: "Sensor", online: "Connection", battery: "Battery", eol: "Lifetime",
    smoke_ok: "No smoke", smoke_bad: "Smoke detected", fault_ok: "OK", fault_bad: "Fault",
    online_ok: "Online", online_bad: "Offline", battery_ok: "OK", battery_bad: "Low",
    eol_ok: "OK", eol_bad: "Reached",
    ok_h: "All clear", ok_s: "No smoke · device ready",
    crit_h: "Smoke detected", crit_s: "Check at once and leave the room",
    fault_h: "Sensor fault", fault_s: "Check the smoke chamber or replace the device",
    off_h: "Not reachable", off_s: "Check the connection / gateway",
    battery_h: "Battery low", battery_s: "Replace the battery soon",
    eol_h: "End of life", eol_s: "Replace the smoke detector",
    detector: "Smoke detector", detectors: "Smoke detectors", ok: "OK",
    all_ok: "All {n} OK", n_bad: "{b} of {n} with a problem", checks_ok: "{o}/{n} OK",
    no_entities: "No smoke detector chosen yet", not_found: "Entity not found",
    entities: "Smoke detectors (smoke entities)", title: "Title", style: "Style",
    style_device: "Device (one detector)", style_alert: "Alert first (one detector)", style_rooms: "Room list (all detectors)",
    battery_threshold: "Battery low below (%)",
  },
};

/* Checks in order of priority: the first one that is bad sets the state. */
const CHECKS = [
  { k: "smoke", icon: "flame", sev: "crit" },
  { k: "fault", icon: "shield", iconBad: "shieldx", sev: "fault" },
  { k: "online", icon: "wifi", iconBad: "wifioff", sev: "off" },
  { k: "battery", icon: "battery", sev: "warn" },
  { k: "eol", icon: "cal", sev: "warn" },
];

const ICONS = {
  flame: '<path d="M12 3c1 3 4.5 4.8 4.5 9.2a4.5 4.5 0 0 1-9 0c0-2.2 1.1-3.4 2.2-4.4 0 1.6.9 2.7 2.1 2.7 0-3-1-5.1.2-7.5z"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21.5 10.5v3"/><path d="M6 10v4M9 10v4"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.8 16a4.8 4.8 0 0 1 6.4 0"/><circle cx="12" cy="19.3" r=".9"/>',
  wifioff: '<path d="M3 3l18 18M5.5 12.5a9.5 9.5 0 0 1 4-2.2M8.8 16a4.8 4.8 0 0 1 6.4 0M2.5 9A14 14 0 0 1 8 6"/><circle cx="12" cy="19.3" r=".9"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  shieldx: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>',
  det: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2"/>',
  alert: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.3v.2"/>',
};

function lang(hass) {
  const l = (hass && (hass.locale?.language || hass.language)) || document.documentElement.lang || "en";
  return l.startsWith("de") ? "de" : "en";
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function fmt(text, values) {
  return text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
}

function icon(name, cls = "") {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

const ON_STATES = ["on", "detected", "alarm", "true", "smoke", "problem"];
const isOn = (s) => Boolean(s) && ON_STATES.includes(String(s.state).toLowerCase());
const isGone = (s) => !s || s.state === "unavailable";

function batteryLow(state, threshold) {
  if (!state || isGone(state) || state.state === "unknown") return false;
  if (state.entity_id.startsWith("binary_sensor.")) return isOn(state);
  const value = parseFloat(state.state);
  if (Number.isFinite(value)) return value < threshold;
  return String(state.state).toLowerCase() === "low";
}

/** Find battery, connection, fault and end-of-life entities on the smoke entity's device. */
function findSiblings(hass, smokeId) {
  const found = {};
  const device = hass.entities?.[smokeId]?.device_id;
  if (!device) return found;
  for (const [id, entry] of Object.entries(hass.entities)) {
    if (entry.device_id !== device || id === smokeId || entry.hidden) continue;
    const state = hass.states[id];
    if (!state) continue;
    const key = `${id} ${entry.translation_key || ""}`.toLowerCase();
    const dc = state.attributes?.device_class;
    const binary = id.startsWith("binary_sensor.");
    if (/fault|st(oe|ö)rung/.test(key)) {
      found.fault ??= id;
    } else if (/end_of_life|lifecycle|lifetime|lebensdauer/.test(key)) {
      found.end_of_life ??= id;
    } else if (/online|connectivity/.test(key) || dc === "connectivity") {
      found.online ??= id;
    } else if (/batter/.test(key) || dc === "battery") {
      // A binary "battery low" wins over a percentage.
      if (!found.battery || (binary && !found.battery.startsWith("binary_sensor."))) found.battery = id;
    }
  }
  return found;
}

/** The name to show: given, else the area, else the device, else the entity. */
function detectorName(hass, smokeId) {
  const entry = hass.entities?.[smokeId];
  const device = entry?.device_id && hass.devices?.[entry.device_id];
  const areaId = entry?.area_id || device?.area_id;
  const area = areaId && hass.areas?.[areaId]?.name;
  return area || device?.name_by_user || device?.name
    || hass.states[smokeId]?.attributes?.friendly_name || smokeId;
}

function normaliseEntities(list) {
  return (list || [])
    .map((e) => (typeof e === "string" ? { entity: e } : { ...e }))
    .filter((e) => e.entity);
}

class SmokeWatchCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._renderKey = "";
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
  }

  static getStubConfig(hass) {
    const ids = Object.keys(hass.states).filter((id) => id.startsWith("binary_sensor.")
      && hass.states[id].attributes?.device_class === "smoke");
    return { style: ids.length > 1 ? "rooms" : "device", entities: ids.slice(0, 6) };
  }

  static getConfigForm() {
    const t = TEXT[lang(null)];
    return {
      schema: [
        {
          name: "entities", required: true,
          selector: { entity: { multiple: true, filter: { domain: "binary_sensor", device_class: "smoke" } } },
        },
        {
          name: "style",
          selector: { select: { mode: "dropdown", options: STYLES.map((v) => ({ value: v, label: t[`style_${v}`] })) } },
        },
        { name: "title", selector: { text: {} } },
        { name: "battery_threshold", selector: { number: { min: 1, max: 100, mode: "box", unit_of_measurement: "%" } } },
      ],
      computeLabel: (schema) => t[schema.name] || schema.name,
      // Detectors written as objects (own names, own entities) or alert buttons
      // only fit the YAML editor.
      assertConfig: (config) => {
        if ((config.entities || []).some((e) => typeof e !== "string")) {
          throw new Error("entities with options are edited in YAML");
        }
        if (config.actions) throw new Error("actions are edited in YAML");
      },
    };
  }

  setConfig(config) {
    if (!config) throw new Error("invalid configuration");
    const entities = normaliseEntities(config.entities || (config.entity ? [config.entity] : []));
    const style = STYLES.includes(config.style) ? config.style : (entities.length > 1 ? "rooms" : "device");
    this._config = { battery_threshold: 20, ...config, style };
    this._entities = entities;
    this._renderKey = "";
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    const style = this._config?.style;
    if (style === "device") return 4;
    if (style === "alert") return 1;
    return 1 + (this._entities?.length || 1);
  }

  getGridOptions() {
    const style = this._config?.style;
    if (style === "device") return { columns: 6, rows: "auto", min_columns: 4, min_rows: 3 };
    if (style === "alert") return { columns: 12, rows: "auto", min_columns: 6, min_rows: 1 };
    return { columns: 12, rows: "auto", min_columns: 6, min_rows: 2 };
  }

  // -- data ---------------------------------------------------------------------

  _detector(spec) {
    const hass = this._hass;
    const found = findSiblings(hass, spec.entity);
    const pick = (k) => (spec[k] === null || spec[k] === false ? null : spec[k] || found[k] || null);
    return {
      entity: spec.entity,
      name: spec.name || detectorName(hass, spec.entity),
      fault: pick("fault"), online: pick("online"), battery: pick("battery"), end_of_life: pick("end_of_life"),
    };
  }

  _evaluate(d) {
    const hass = this._hass;
    const st = (id) => (id ? hass.states[id] : undefined);
    const smoke = st(d.entity);
    const online = d.online ? st(d.online) : null;
    const values = {
      smoke: isOn(smoke),
      fault: d.fault ? isOn(st(d.fault)) : null,
      online: isGone(smoke) || (online ? online.state === "off" || isGone(online) : false),
      battery: d.battery ? batteryLow(st(d.battery), Number(this._config.battery_threshold) || 20) : null,
      eol: d.end_of_life ? isOn(st(d.end_of_life)) : null,
    };
    const checks = CHECKS.filter((c) => values[c.k] !== null).map((c) => ({ ...c, bad: values[c.k] }));
    const bad = checks.filter((c) => c.bad);
    const top = bad[0];
    const sev = top ? top.sev : "ok";
    const msgKey = !top ? "ok" : top.sev === "warn" ? top.k : top.sev;
    return { checks, bad, sev, msgKey, missing: !smoke };
  }

  // -- rendering ----------------------------------------------------------------

  _render() {
    if (!this._config || !this._hass) return;
    const hass = this._hass;
    const t = TEXT[lang(hass)];
    const detectors = this._entities.map((spec) => this._detector(spec));
    const ids = detectors.flatMap((d) => [d.entity, d.fault, d.online, d.battery, d.end_of_life]).filter(Boolean);
    const key = [lang(hass), ...ids.map((id) => `${id}=${hass.states[id]?.state}`), ...detectors.map((d) => d.name)].join("|");
    if (key === this._renderKey) return;
    this._renderKey = key;

    let body;
    if (!detectors.length) body = `<div class="empty">${esc(t.no_entities)}</div>`;
    else if (this._config.style === "rooms") body = this._rooms(detectors, t);
    else {
      const d = detectors[0];
      const e = this._evaluate(d);
      if (e.missing) body = `<div class="empty">${esc(t.not_found)}: ${esc(d.entity)}</div>`;
      else body = this._config.style === "alert" ? this._alert(d, e, t) : this._device(d, e, t);
    }
    this.shadowRoot.innerHTML = `${STYLE}<ha-card>${body}</ha-card>`;
  }

  _headline(e, t) {
    const extra = e.bad.length > 1 ? ` (+${e.bad.length - 1})` : "";
    return [t[`${e.msgKey}_h`] + extra, t[`${e.msgKey}_s`]];
  }

  /** "Smoke detector Hallway", but not "Smoke detector Smoke detector Shed" when the device name says it already. */
  _title(d, t) {
    if (this._config.title) return this._config.title;
    const name = String(d.name);
    const says = [TEXT.de.detector, TEXT.en.detector, "smoke", "rauch"]
      .some((w) => name.toLowerCase().includes(w.toLowerCase()));
    return says ? name : `${t.detector} ${name}`;
  }

  _checkIcon(c) {
    return icon(c.bad && c.iconBad ? c.iconBad : c.icon);
  }

  _badgeIcon(sev) {
    return icon(sev === "crit" ? "flame" : sev === "ok" ? "det" : sev === "off" ? "wifioff" : "alert");
  }

  _device(d, e, t) {
    const [head, sub] = this._headline(e, t);
    const slots = [...Array(12)].map((_, i) => {
      const a = (i * 30 * Math.PI) / 180;
      return `<line class="slot" x1="${60 + Math.cos(a) * 30}" y1="${60 + Math.sin(a) * 30}" x2="${60 + Math.cos(a) * 40}" y2="${60 + Math.sin(a) * 40}"/>`;
    }).join("");
    const title = this._title(d, t);
    const chips = e.checks.map((c) => {
      const label = `${t[c.k]}: ${t[`${c.k}_${c.bad ? "bad" : "ok"}`]}`;
      return `<span class="chip c-${c.bad ? c.sev : "ok"}" title="${esc(label)}" role="img" aria-label="${esc(label)}">${this._checkIcon(c)}</span>`;
    }).join("");
    return `<button type="button" class="device tap" data-sev="${e.sev}" data-entity="${esc(d.entity)}">
      <svg class="det" viewBox="0 0 120 120" aria-hidden="true"><circle class="body" cx="60" cy="60" r="54"/><circle class="ring" cx="60" cy="60" r="50"/>${slots}<circle class="body" cx="60" cy="60" r="20"/><circle class="led" cx="60" cy="60" r="5"/></svg>
      <span class="dtext"><span class="dtitle">${esc(title)}</span><span class="dstatus">${esc(head)}</span><span class="dsub">${esc(sub)}</span></span>
      <span class="chips">${chips}</span></button>`;
  }

  _alert(d, e, t) {
    const title = this._title(d, t);
    if (e.sev === "ok") {
      const score = fmt(t.checks_ok, { o: e.checks.length, n: e.checks.length });
      const checks = e.checks.map((c) => {
        const label = `${t[c.k]}: ${t[`${c.k}_ok`]}`;
        return `<span class="c-ok" title="${esc(label)}" role="img" aria-label="${esc(label)}">${this._checkIcon(c)}</span>`;
      }).join("");
      return `<button type="button" class="slim tap" data-sev="ok" data-entity="${esc(d.entity)}">
        <span class="badge">${icon("det")}</span><span class="n">${esc(title)}</span>
        <span class="mini">${checks}</span><span class="meta">${esc(score)}</span></button>`;
    }
    const [head, sub] = this._headline(e, t);
    const actions = (this._config.actions || [])
      .filter((a) => !a.severity || [].concat(a.severity).includes(e.sev))
      .map((a, i) => `<button type="button" class="act" data-action="${i}">${esc(a.name)}</button>`).join("");
    return `<div class="alert" data-sev="${e.sev}">
      <button type="button" class="top tap" data-entity="${esc(d.entity)}">${this._badgeIcon(e.sev)}
        <span><span class="h">${esc(head)}</span><span class="s">${esc(d.name)} · ${esc(sub)}</span></span></button>
      ${actions ? `<div class="actions">${actions}</div>` : ""}
      <div class="foot">${e.checks.map((c) => `<span title="${esc(t[c.k])}">${this._checkIcon(c)}</span>`).join("")}</div></div>`;
  }

  _rooms(detectors, t) {
    const rows = detectors.map((d) => ({ d, e: this._evaluate(d) }));
    const nBad = rows.filter((r) => r.e.sev !== "ok").length;
    const order = ["crit", "fault", "off", "warn"];
    const worst = order.find((s) => rows.some((r) => r.e.sev === s)) || "ok";
    const title = this._config.title || t.detectors;
    const score = nBad ? fmt(t.n_bad, { b: nBad, n: rows.length }) : fmt(t.all_ok, { n: rows.length });
    const list = rows.map(({ d, e }) => {
      const sub = e.missing ? t.not_found : e.sev === "ok" ? t.ok : this._headline(e, t)[1];
      const mini = e.sev === "ok"
        ? `<span class="mini">${e.checks.filter((c) => c.k !== "smoke").map((c) => `<span class="c-mute" title="${esc(t[c.k])}">${this._checkIcon(c)}</span>`).join("")}</span>`
        : "";
      const issues = e.bad.length
        ? `<div class="issues">${e.bad.map((c) => `<span class="pill c-${c.sev}">${esc(t[c.k])}: ${esc(t[`${c.k}_bad`])}</span>`).join("")}</div>`
        : "";
      return `<div class="room" data-sev="${e.sev}"><button type="button" class="tile tap" data-entity="${esc(d.entity)}">
        <span class="badge">${this._badgeIcon(e.sev)}</span>
        <span class="txt"><span class="n">${esc(d.name)}</span><span class="st">${esc(sub)}</span></span>${mini}</button>${issues}</div>`;
    }).join("");
    return `<div class="rooms" data-sev="${worst}"><div class="head"><span class="n">${esc(title)}</span><span class="score">${esc(score)}</span></div>${list}</div>`;
  }

  // -- interaction ------------------------------------------------------------

  _onClick(ev) {
    const act = ev.target.closest("[data-action]");
    if (act) {
      const action = (this._config.actions || [])[Number(act.dataset.action)];
      if (!action) return;
      const entity = action.entity || this._entities[0]?.entity;
      this.dispatchEvent(new CustomEvent("hass-action", {
        bubbles: true, composed: true,
        detail: { config: { entity, tap_action: action.tap_action || { action: "more-info" } }, action: "tap" },
      }));
      return;
    }
    const tap = ev.target.closest("[data-entity]");
    if (tap) {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        bubbles: true, composed: true, detail: { entityId: tap.dataset.entity },
      }));
    }
  }
}

const STYLE = `<style>
  :host {
    --sw-ok: var(--success-color, #2e9e5b); --sw-warn: var(--warning-color, #c98200);
    --sw-fault: #e0601a; --sw-crit: var(--error-color, #d6342b); --sw-off: var(--disabled-color, #8a909b);
    --sw-line: var(--divider-color, #e1e4e9); --sw-muted: var(--secondary-text-color, #69707c);
    --sw-bg: var(--secondary-background-color, #eef0f3);
  }
  ha-card { display: block; overflow: hidden; height: 100%; box-sizing: border-box;
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border-radius: var(--ha-card-border-radius, 12px); color: var(--primary-text-color); }
  [data-sev] { --s: var(--sw-ok); }
  [data-sev="crit"] { --s: var(--sw-crit); } [data-sev="warn"] { --s: var(--sw-warn); }
  [data-sev="fault"] { --s: var(--sw-fault); } [data-sev="off"] { --s: var(--sw-off); }
  .ico { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8;
    stroke-linecap: round; stroke-linejoin: round; flex: none; display: block; }
  .c-ok { color: var(--sw-ok); } .c-warn { color: var(--sw-warn); } .c-crit { color: var(--sw-crit); }
  .c-fault { color: var(--sw-fault); } .c-off { color: var(--sw-off); } .c-mute { color: var(--sw-muted); }
  button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; text-align: inherit; }
  .tap { cursor: pointer; width: 100%; }
  .tap:focus-visible, .act:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: -2px; }
  .empty { padding: 16px; color: var(--sw-muted); }

  /* device */
  .device { padding: 20px 16px; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; box-sizing: border-box; }
  .det { width: 116px; height: 116px; }
  .det .body { fill: var(--sw-bg); stroke: var(--sw-line); stroke-width: 2; }
  .det .ring { fill: none; stroke: var(--s); stroke-width: 5; opacity: .9; }
  .det .slot { stroke: var(--sw-line); stroke-width: 3; stroke-linecap: round; }
  .det .led { fill: var(--s); }
  [data-sev="crit"] .det .led { animation: sw-blink .6s steps(2, start) infinite; }
  [data-sev="crit"] .det .ring { animation: sw-glow 1.2s ease-in-out infinite; }
  @keyframes sw-blink { to { opacity: .15; } }
  @keyframes sw-glow { 50% { stroke-width: 9; opacity: .5; } }
  .dtext { display: flex; flex-direction: column; }
  .dtitle { font-size: 12px; color: var(--sw-muted); letter-spacing: .04em; text-transform: uppercase; }
  .dstatus { font-size: 20px; font-weight: 700; color: var(--s); margin-top: 2px; }
  .dsub { color: var(--sw-muted); font-size: 13px; }
  .chips { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  .chip { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center;
    background: color-mix(in srgb, currentColor 12%, transparent); }

  /* alert */
  .slim { display: flex; align-items: center; gap: 10px; padding: 12px 16px; box-sizing: border-box; }
  .slim .badge { width: 32px; height: 32px; }
  .slim .n { flex: 1; min-width: 0; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .slim .mini .ico { width: 18px; height: 18px; }
  .slim .meta { font-size: 12px; font-weight: 500; color: var(--sw-muted); font-variant-numeric: tabular-nums; }
  .alert { padding: 18px; color: #fff; background: var(--s); display: flex; flex-direction: column; gap: 12px; }
  .alert[data-sev="crit"] { background: linear-gradient(135deg, var(--sw-crit), color-mix(in srgb, var(--sw-crit) 70%, #000)); }
  .alert[data-sev="off"] { background: color-mix(in srgb, var(--sw-off) 75%, #000); }
  .alert .top { display: flex; align-items: center; gap: 12px; color: #fff; }
  .alert .top > span { display: flex; flex-direction: column; }
  .alert .top .ico { width: 34px; height: 34px; stroke-width: 2; }
  .alert[data-sev="crit"] .top .ico { animation: sw-shake .5s ease-in-out infinite; }
  @keyframes sw-shake { 25% { transform: rotate(-8deg); } 75% { transform: rotate(8deg); } }
  .alert .h { font-size: 19px; font-weight: 700; }
  .alert .s { opacity: .9; font-size: 13px; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .act { font-size: 12.5px; font-weight: 500; padding: 7px 12px; border-radius: 8px; background: rgba(255,255,255,.2); color: #fff; cursor: pointer; }
  .act:hover { background: rgba(255,255,255,.3); }
  .foot { display: flex; gap: 6px; opacity: .85; }
  .foot .ico { width: 16px; height: 16px; }

  /* rooms */
  .head { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid var(--sw-line); }
  .head .n { font-weight: 500; font-size: 15px; }
  .score { font-size: 12px; font-weight: 500; padding: 3px 8px; border-radius: 999px; color: var(--s);
    background: color-mix(in srgb, var(--s) 14%, transparent); white-space: nowrap; }
  .room + .room { border-top: 1px solid var(--sw-line); }
  .room:not([data-sev="ok"]) { background: color-mix(in srgb, var(--s) 6%, transparent); }
  .tile { display: flex; align-items: center; gap: 12px; padding: 12px 14px; box-sizing: border-box; }
  .badge { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none;
    color: var(--s); background: color-mix(in srgb, var(--s) 15%, transparent); }
  .txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .txt .n { font-weight: 500; }
  .txt .st { font-size: 12.5px; color: var(--sw-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .room:not([data-sev="ok"]) .txt .st { color: var(--s); font-weight: 500; }
  .mini { display: flex; gap: 4px; }
  .mini .ico { width: 16px; height: 16px; }
  .issues { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 12px 66px; }
  .pill { font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 999px;
    background: color-mix(in srgb, currentColor 13%, transparent); white-space: nowrap; }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>`;

customElements.define("smoke-watch-card", SmokeWatchCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "smoke-watch-card")) {
  window.customCards.push({
    type: "smoke-watch-card",
    name: "Smoke Watch",
    description: "Rauchmelder auf einen Blick: Rauch, Batterie, Verbindung, Störung, Lebensdauer",
    preview: true,
    documentationURL: "https://github.com/berwil84afk/ha-smoke-watch",
  });
}

console.info(`%c SMOKE-WATCH-CARD %c ${CARD_VERSION} `, "background:#d6342b;color:#fff", "");
