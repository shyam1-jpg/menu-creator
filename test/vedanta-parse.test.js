"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { parseMenu, migrateSaved } = require("../vedanta-parse.js");

const pastePath = path.join(__dirname, "fixtures", "paste.txt");
const PASTE = fs.readFileSync(pastePath, "utf8");

function clean(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}
function parseV18(text) {
  const blocks = text.replace(/\r/g, "").split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);
  const out = [];
  for (const block of blocks) {
    const lines = block.split("\n").map(clean).filter(Boolean);
    if (!lines.length) continue;
    const name = lines.shift();
    const desc = [];
    let contains = "";
    const diet = [];
    for (const line of lines) {
      if (/^contains\s*:/i.test(line)) contains = line;
      else if (/^(vegan|vegetarian|jain|ekadashi|gluten[- ]free|dairy[- ]free)$/i.test(line)) diet.push(line);
      else desc.push(line);
    }
    out.push({ name, desc: desc.join(" "), contains, diet });
  }
  return out;
}

function names(items) {
  return items.map(item => item.name.toUpperCase());
}

const soup = [
  "SWEETCORN & LEMONGRASS SOUP",
  "A delicate, velvety sweetcorn soup infused with fragrant lemongrass, fresh ginger and subtle Asian seasonings.",
  "Miso-Maple Glazed Aubergine",
  "Tender roasted aubergine glazed with savoury miso and maple for a beautifully balanced sweet and umami finish.",
  "Contains: soya and nuts."
].join("\n");

{
  const items = parseMenu(soup);
  assert.strictEqual(items.length, 2, "soup and aubergine must be two dishes");
  assert.strictEqual(items[0].name, "SWEETCORN & LEMONGRASS SOUP");
  assert.strictEqual(items[0].desc, "A delicate, velvety sweetcorn soup infused with fragrant lemongrass, fresh ginger and subtle Asian seasonings.");
  assert.strictEqual(items[0].contains, "");
  assert.strictEqual(items[1].name, "Miso-Maple Glazed Aubergine");
  assert.ok(items[1].desc.startsWith("Tender roasted aubergine"));
  assert.strictEqual(items[1].contains, "Contains: soya and nuts.");
  assert.ok(!items[0].desc.includes("Aubergine"), "aubergine name must not sit inside the soup description");
}

{
  const items = parseMenu(soup.replace(/\n/g, "\r\n"));
  assert.deepStrictEqual(names(items), ["SWEETCORN & LEMONGRASS SOUP", "MISO-MAPLE GLAZED AUBERGINE"]);
}

{
  const items = parseMenu(
    "Sweetcorn & Lemongrass Soup\n" +
    "A delicate, velvety sweetcorn soup infused with fragrant lemongrass.\n" +
    "Miso-Roasted Broccoli with Cashew Nuts\n" +
    "Roasted broccoli coated in a savoury miso glaze.\n" +
    "Contains: soya, nuts"
  );
  assert.deepStrictEqual(names(items), [
    "SWEETCORN & LEMONGRASS SOUP",
    "MISO-ROASTED BROCCOLI WITH CASHEW NUTS"
  ]);
  assert.strictEqual(items[1].contains, "Contains: soya, nuts");
}

{
  const items = parseMenu(
    "Sweetcorn & Lemongrass Soup\n" +
    "Contains: dairy\n" +
    "A delicate, velvety sweetcorn soup infused with fragrant lemongrass.\n" +
    "Miso-Maple Glazed Aubergine\n" +
    "Contains: soya and nuts.\n" +
    "Tender roasted aubergine glazed with savoury miso."
  );
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0].contains, "Contains: dairy");
  assert.strictEqual(items[0].desc, "A delicate, velvety sweetcorn soup infused with fragrant lemongrass.");
  assert.strictEqual(items[1].contains, "Contains: soya and nuts.");
  assert.strictEqual(items[1].desc, "Tender roasted aubergine glazed with savoury miso.");
}

{
  const padded = "SWEETCORN & LEMONGRASS SOUP   \nA delicate soup.   \n   \nMiso-Maple Glazed Aubergine   \nTender roasted aubergine.   \n";
  const items = parseMenu(padded);
  assert.deepStrictEqual(names(items), ["SWEETCORN & LEMONGRASS SOUP", "MISO-MAPLE GLAZED AUBERGINE"]);
}

{
  const items = parseMenu("SOUP\nA delicate soup.\n\u00a0\nMiso-Maple Glazed Aubergine\nTender roasted aubergine.");
  assert.deepStrictEqual(names(items), ["SOUP", "MISO-MAPLE GLAZED AUBERGINE"]);
}

{
  const note = "Served alongside a selection of cold breakfast items. No additional hot breakfast items.";
  const block = "Paneer Bhurji-Stuffed Besan Chilla\nFreshly prepared gram-flour pancakes.\nContains: dairy\n\n" + note + "\n";
  const items = parseMenu(block);
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[1].name, note);
  assert.strictEqual(items[1].desc, "");
}

{
  const items = parseMenu("DAL MAKHANI\nSlow-cooked black lentils.\nVegan\nContains: none");
  assert.strictEqual(items.length, 1);
  assert.deepStrictEqual(items[0].diet, ["Vegan"]);
  assert.strictEqual(items[0].contains, "Contains: none");
  assert.strictEqual(items[0].desc, "Slow-cooked black lentils.");
}

{
  const v18 = parseV18(PASTE);
  const now = parseMenu(PASTE);
  assert.deepStrictEqual(names(now), names(v18), "blank-line paste must split like v18");
  assert.deepStrictEqual(now.map(item => item.desc), v18.map(item => item.desc));
  assert.deepStrictEqual(now.map(item => item.contains), v18.map(item => item.contains));
  const byName = Object.fromEntries(now.map(item => [item.name.toUpperCase(), item]));
  assert.strictEqual(byName["SWEETCORN & LEMONGRASS SOUP"].desc, "A fragrant sweetcorn soup infused with fresh lemongrass and subtle Asian aromatics.");
  assert.strictEqual(byName["MISO-MAPLE GLAZED AUBERGINE"].contains, "Contains: soya");
  assert.ok(byName["PANEER HARA BHARA KEBAB"].desc.includes("Indian spices"));
  assert.ok(byName["KUNG PAO TOFU"].desc.includes("Kung Pao"));
  assert.ok(names(now).includes("LIME CHEESECAKE"));
  assert.ok(names(now).includes("INDIAN SELECTION"));
  assert.ok(names(now).includes("FRIDAY LUNCH — A TASTE OF MEXICO"));
}

{
  const sample = "CREAM OF CAULIFLOWER & BROCCOLI SOUP\nA smooth cauliflower and broccoli soup finished with gentle seasoning.\nContains: Dairy\n\nVEGETABLE BIRYANI RICE\nFragrant basmati rice cooked with seasonal vegetables, aromatic spices and fresh herbs.\nContains: None";
  assert.deepStrictEqual(names(parseMenu(sample)), names(parseV18(sample)));
}

{
  const old = {
    template: "signature",
    venue: "THE VEDANTA RETREAT CENTRE",
    title: "DINNER MENU",
    date: "2026-09-18",
    paste: "",
    dishes: [
      { name: "SWEETCORN & LEMONGRASS SOUP", desc: "A delicate soup.", contains: "Contains: dairy", diet: [] },
      { name: "Miso-Maple Glazed Aubergine", desc: "Tender roasted aubergine.", contains: "Contains: soya", diet: [] }
    ]
  };
  const migrated = migrateSaved(old);
  assert.strictEqual(migrated.date, "2026-09-18");
  assert.strictEqual(migrated.template, "signature");
  const again = parseMenu(migrated.paste);
  assert.deepStrictEqual(names(again), ["SWEETCORN & LEMONGRASS SOUP", "MISO-MAPLE GLAZED AUBERGINE"]);
  assert.strictEqual(migrateSaved({ date: "Friday, 18 September 2026", paste: "SOUP\nA delicate soup." }).date, "2026-09-18");
  assert.strictEqual(migrateSaved({ date: "2026-10-08", paste: soup }).paste, soup);
}

console.log("vedanta-parse regression tests passed", names(parseMenu(PASTE)).length, "paste items");
