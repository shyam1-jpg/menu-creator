/* Vedanta paste parser.
   A line is a description when it reads as a sentence. A line that does not
   end with sentence punctuation, and whose next line is a description, is a
   dish name. A line followed directly by another name is a section heading.
   "Contains:" always belongs to the dish above it. Typed capitals are kept. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.VedantaParse = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
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
  function wordCount(t) {
    return clean(t).split(/\s+/).filter(Boolean).length;
  }
  function endsSentence(t) {
    return /[.!?]["')\]]*$/.test(clean(t));
  }
  function looksContains(s) {
    return /^contains\s*:/i.test(clean(s));
  }
  function looksDiet(s) {
    return /^(vegan|vegetarian|jain|ekadashi|gluten[- ]free|dairy[- ]free)$/i.test(clean(s));
  }
  /* A long line that reads as prose: over 12 words, with a comma or a
     verb-shaped word (a structural ending, not a list of verbs). */
  function isLongProse(t) {
    const text = clean(t);
    const words = wordCount(text);
    if (words <= 12) return false;
    if (/[,;]/.test(text)) return true;
    return /\b[A-Za-z]{3,}(?:ed|ing|ly)\b/.test(text);
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
    const lines = normalizePaste(text).split("\n").map(line => {
      const value = clean(line);
      return value ? { blank: false, text: value } : { blank: true };
    });
    const memo = new Array(lines.length);
    function kindAt(i) {
      if (memo[i]) return memo[i];
      const line = lines[i];
      if (line.blank) return memo[i] = "blank";
      const t = line.text;
      if (looksContains(t)) return memo[i] = "contains";
      if (looksDiet(t)) return memo[i] = "diet";
      const words = wordCount(t);
      const sentence = endsSentence(t);
      const prose = isLongProse(t);
      const nxt = i + 1 < lines.length && !lines[i + 1].blank ? i + 1 : -1;
      if (!sentence && words > 0 && words <= 20 && nxt !== -1) {
        const nextKind = kindAt(nxt);
        if (nextKind === "description") return memo[i] = "dish";
        if ((nextKind === "contains" || nextKind === "diet") && !prose) return memo[i] = "dish";
        if ((nextKind === "dish" || nextKind === "section") && !prose) return memo[i] = "section";
      }
      if (sentence || prose || words > 20) return memo[i] = "description";
      if (words > 0) return memo[i] = "section";
      return memo[i] = "blank";
    }
    const out = [];
    let current = null;
    function flush() {
      if (!current) return;
      out.push(finish(current));
      current = null;
    }
    function attach(field, value) {
      const target = current || out[out.length - 1];
      if (!target) return;
      if (field === "diet") target.diet.push(value);
      else target[field] = value;
    }
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].blank) {
        flush();
        continue;
      }
      const text = lines[i].text;
      const kind = kindAt(i);
      if (kind === "contains") {
        attach("contains", text);
        continue;
      }
      if (kind === "diet") {
        attach("diet", text);
        continue;
      }
      if (kind === "section") {
        flush();
        out.push({ name: text, desc: "", contains: "", diet: [] });
        continue;
      }
      if (kind === "dish") {
        flush();
        current = { name: text, desc: "", contains: "", diet: [] };
        continue;
      }
      if (current && !current.desc) current.desc = text;
      else if (current) current.desc = current.desc + " " + text;
      else out.push({ name: text, desc: "", contains: "", diet: [] });
    }
    flush();
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
      const parts = [dish && dish.name ? String(dish.name) : ""];
      if (dish && dish.desc) parts.push(String(dish.desc));
      if (dish && dish.contains) parts.push(String(dish.contains));
      if (dish && Array.isArray(dish.diet)) parts.push(...dish.diet.map(String));
      return parts.map(clean).filter(Boolean).join("\n");
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
  return { parseMenu, normalizePaste, normalizeStoredDate, dishesToPaste, migrateSaved, clean };
});
