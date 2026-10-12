const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const c = vm.createContext({VedantaParse: require('../vedanta-parse.js')});
vm.runInContext(html.slice(html.indexOf('function toTitle('), html.indexOf('function applyParsed(')), c);
vm.runInContext(html.slice(html.indexOf('function toSentenceCase('), html.indexOf('let didPersistCasing')), c);
c.isSectionHeading = () => false;
c.isAllCapsText = s => s === s.toUpperCase();
const r = c.parseBulk(`Lunch Menu
Vegetarian Sausage & Mash
Vegetarian sausages with creamy mash.
Contains: dairy, mustard and celery
Roasted Seasonal Vegetables
A colourful selection of roasted vegetables.
Allergens: none
Broccoli, Edamame & Asparagus Salad
Tender broccoli and edamame with asparagus.
Contains: soya, soy and sesame
Assorted Green Leaves & Fresh Herbs
A refreshing selection of green leaves.
Allergens: none
Assorted Breads & Butter
A selection of breads with butter.
Contains: gluten and dairy
Passion Fruit Cheesecake
A smooth, creamy cheesecake.
Contains: dairy and gluten`);
assert.equal(r.dishes.length, 6);
assert.equal(r.infoText, null);
assert.deepEqual(Array.from(r.dishes[2].allergens), ['Soy', 'Sesame']);
assert.equal(c.repairDishList(r.dishes).length, 6);
const long = c.parseBulk('SOUP\nA smooth soup.\nContains: dairy\nASSORTED GREEN LEAVES & FRESH HERBS\n\nBROCCOLI, EDAMAME & ASPARAGUS SALAD');
assert.equal(c.repairDishList(long.dishes).length, 3);
assert.equal(c.parseBulk('**Roasted Seasonal Vegetables**\nTender vegetables.\n\n---\n\n**Passion Fruit Cheesecake**\nA creamy dessert.').dishes.length, 2);
console.log('bulk paste regression tests passed');
