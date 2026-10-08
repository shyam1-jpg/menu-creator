/* Vedanta paste parser.
   Blank-line blocks follow the v18 page: the first line is the dish or
   section name, "Contains:" is an allergen line, and a lone diet word is a tag.
   Inside a block, a new dish name after a description or allergen line starts
   another dish, so a paste with no blank line does not swallow the next dish.
   Typed capitals are kept. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.VedantaParse = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SMALL = new Set(["a", "an", "the", "and", "or", "of", "with", "for", "to", "in", "on", "de", "da", "&", "-", "—", "–"]);

  function clean(s) {
    return String(s ?? "").replace(/[\u200b\ufeff]/g, "").replace(/\s+/g, " ").trim();
  }
  function normalizePaste(text) {
    return String(text ?? "")
      .replace(/\u00a0|\u202f|\u2007|\u2009|\u200a/g, " ")
      .replace(/\u2028|\u2029/g, "\n")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
  }
  function looksContains(s) {
    return /^contains\s*:/i.test(clean(s));
  }
  function looksDiet(s) {
    return /^(vegan|vegetarian|jain|ekadashi|gluten[- ]free|dairy[- ]free)$/i.test(clean(s));
  }
  function looksLikeDishName(line) {
    const t = clean(line);
    if (!t || looksContains(t) || looksDiet(t)) return false;
    if (/[.!?]$/.test(t)) return false;
    const words = t.split(/\s+/).filter(Boolean);
    if (!words.length || words.length > 14 || t.length > 90) return false;
    if (/,/.test(t) && words.length >= 8) return false;
    let significant = 0;
    let titled = 0;
    for (const word of words) {
      const core = word.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
      if (!core || core.length <= 1 || SMALL.has(core.toLowerCase())) continue;
      significant++;
      const first = core[0];
      if (first === first.toUpperCase() && first !== first.toLowerCase()) titled++;
    }
    return significant > 0 && titled / significant >= 0.8;
  }
  function startDish(name) {
    return { name: clean(name), desc: "", contains: "", diet: [], closed: false };
  }
  function finish(dish) {
    return {
      name: dish.name,
      desc: clean(dish.desc),
      contains: clean(dish.contains),
      diet: dish.diet.slice()
    };
  }
  function parseMenu(text) {
    const blocks = normalizePaste(text).split(/\n\s*\n+/).map(block => block.trim()).filter(Boolean);
    const out = [];
    for (const block of blocks) {
      const lines = block.split("\n").map(clean).filter(Boolean);
      if (!lines.length) continue;
      let current = startDish(lines[0]);
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (looksContains(line)) {
          current.contains = line;
          current.closed = true;
          continue;
        }
        if (looksDiet(line)) {
          current.diet.push(line);
          current.closed = true;
          continue;
        }
        if ((current.desc || current.closed) && looksLikeDishName(line)) {
          out.push(finish(current));
          current = startDish(line);
          continue;
        }
        current.desc = current.desc ? current.desc + " " + line : line;
      }
      out.push(finish(current));
    }
    return out;
  }
  function normalizeStoredDate(value) {
    const raw = clean(value);
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const named = raw.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    const parsed = named ? new Date(named[2] + " " + named[1] + ", " + named[3]) : new Date(raw);
    if (Number.isNaN(parsed.getTime())) return "";
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return parsed.getFullYear() + "-" + month + "-" + day;
  }
  function dishesToPaste(dishes) {
    return (dishes || []).map(dish => {
      const lines = [dish && dish.name ? String(dish.name) : ""];
      if (dish && dish.desc) lines.push(String(dish.desc));
      if (dish && dish.contains) lines.push(String(dish.contains));
      if (dish && Array.isArray(dish.diet)) lines.push(...dish.diet.map(String));
      return lines.map(clean).filter(Boolean).join("\n");
    }).filter(Boolean).join("\n\n");
  }
  function migrateSaved(saved) {
    if (!saved || typeof saved !== "object") return null;
    let paste = typeof saved.paste === "string" ? saved.paste : "";
    if (!clean(paste) && Array.isArray(saved.dishes) && saved.dishes.length) paste = dishesToPaste(saved.dishes);
    return {
      template: saved.template || "",
      venue: typeof saved.venue === "string" ? saved.venue : "",
      title: typeof saved.title === "string" ? saved.title : "",
      date: normalizeStoredDate(saved.date),
      paste
    };
  }
  return { parseMenu, normalizePaste, looksLikeDishName, normalizeStoredDate, dishesToPaste, migrateSaved, clean };
});
