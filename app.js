/* ═══════════════════════════════════════════════════════════════
   GOOGLE SHEETS SYNC
   Replace this URL with your deployed Apps Script web app URL
   (See SETUP_GUIDE.md for instructions)
   ═══════════════════════════════════════════════════════════════ */
var SHEET_URL = "https://script.google.com/macros/s/AKfycbxv0FoiaulXho8-2Lmb2LA7d-UabtyADb184F90yNDLdiQI1dGSjfKcloiDyGI-LB0xVQ/exec";
var syncOK = SHEET_URL !== "YOUR_APPS_SCRIPT_URL";
var syncBusy = false;
var POLL_MS = 30000; // poll every 30 seconds

/* ═══ PERSISTENCE ═══ */
function ld(k, fb) { try { var d = localStorage.getItem(k); return d ? JSON.parse(d) : fb } catch (e) { return fb } }
function clamp(v) { return Math.min(100, Math.max(0, Math.round(v))) }

function sv(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { }
  if (syncOK) pushToSheet(k, v);
}

function pushToSheet(k, v) {
  try {
    fetch(SHEET_URL, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ key: k, value: v })
    });
  } catch (e) { }
}

function pullFromSheet() {
  if (!syncOK || syncBusy) return;
  syncBusy = true;
  setDot("load");
  fetch(SHEET_URL + "?t=" + Date.now())
    .then(function (r) { return r.json() })
    .then(function (data) {
      syncBusy = false;
      setDot("on");
      if (!data || !data.p_inv) return;
      // Merge: sheet wins (latest truth)
      var changed = false;
      if (data.p_inv) {
        var remote = data.p_inv;
        remote.forEach(function (it) { it.levels.forEach(function (l) { l.level = clamp(l.level) }) });
        if (JSON.stringify(remote) !== JSON.stringify(inventory)) { inventory = remote; localStorage.setItem("p_inv", JSON.stringify(inventory)); changed = true }
      }
      if (data.p_rec && JSON.stringify(data.p_rec) !== JSON.stringify(recipes)) { recipes = data.p_rec; localStorage.setItem("p_rec", JSON.stringify(recipes)); changed = true }
      if (data.p_meals && JSON.stringify(data.p_meals) !== JSON.stringify(selMeals)) { selMeals = data.p_meals; localStorage.setItem("p_meals", JSON.stringify(selMeals)); changed = true }
      if (data.p_gedits && JSON.stringify(data.p_gedits) !== JSON.stringify(gEdits)) { gEdits = data.p_gedits; localStorage.setItem("p_gedits", JSON.stringify(gEdits)); changed = true }
      if (changed) render();
    })
    .catch(function () { syncBusy = false; setDot("off") });
}

function setDot(state) {
  var el = document.getElementById("sync-dot");
  if (el) el.className = "sync-dot " + state;
}

/* ═══ POOLS ═══ */
var POOLS = {
  meat: ["Chicken Thighs (2 lbs)", "Chicken Breast (2 lbs)", "Chicken Tenders (1 bag)", "Rotisserie Chicken (1)", "Flank Steak (2 lbs)", "NY Strip Steak (1 lb)", "Beef Chuck Roast (3 lbs)", "Ground Pork (1 lb)", "Pork Cutlets (4)", "Salmon Filets (1 lb)", "Italian Sausage (1 pack)", "Andouille Sausage (1 pack)", "Smoked Sausage (1 pack)", "Kielbasa (1 lb)", "Bacon (1 pack)", "Ground Beef (1 lb)", "Ground Turkey (1 lb)", "Shrimp (1 lb)", "Tilapia (1 lb)"],
  vegetable: ["Broccoli (1 head)", "Brussels Sprouts (1 lb)", "Asparagus (1 bunch)", "Green Beans (1 lb)", "Bell Peppers (3)", "Jalapeno (2)", "Cabbage (1 head)", "Bok Choy (2)", "Spinach (1 bag)", "Mixed Greens (1 bag)", "Carrots (1 lb bag)", "Beets (2)", "Radish (1 bunch)", "Sweet Potatoes (2)", "Cucumber (2)", "English Cucumber (1)", "Avocado (3)", "Yellow Onion (2)", "Red Onion (1)", "Green Onions (1 bunch)", "Corn on the Cob (4)", "Okra (1 bag)", "Peas (1 bag)", "Cauliflower (1 head)", "Salad Kit (1 bag)", "Romaine Lettuce (1 head)", "Tomatoes (4)", "Zucchini (2)", "Mushrooms (8 oz)"],
  starch: ["Russet Potatoes (5 lb bag)", "Yukon Gold Potatoes (3 lb)", "Sweet Potatoes (3)", "Tortillas flour (1 pack)", "Tortillas corn (1 pack)", "Bread or Rolls (1 loaf)", "Pasta assorted (1 lb)", "White Rice (2 lb bag)", "Brown Rice (2 lb bag)"],
  fruit: ["Apples (6)", "Oranges (6)", "Bananas (1 bunch)", "Strawberries (1 lb)", "Blueberries (1 pint)", "Raspberries (6 oz)", "Blackberries (6 oz)", "Grapes (1 bag)", "Mangos (2)", "Pineapple (1)", "Clementines (1 bag)", "Pears (4)", "Peaches (4)"],
  breakfast: ["Eggs (1 dozen)", "Greek Yogurt large tub", "Greek Yogurt cups (10-pack)", "Cereal (1 box)", "Oatmeal (1 canister)", "Bagels (6 pack)", "English Muffins (6 pack)", "Pancake/Waffle Mix", "Breakfast Sausage (1 pack)", "Turkey Bacon (1 pack)", "Granola (1 bag)", "Cream Cheese (1 block)", "Butter (1 stick)", "Orange Juice (half gal)", "Coffee Creamer"],
  fun: ["Protein Brownies (1 box)", "Ice Cream (1 pint)", "Ice Cream 2nd pint", "Chips or Pretzels (1 bag)", "Cookies or Cookie Dough", "Popcorn microwave (1 box)", "Candy or Chocolate Bar (2)", "Protein Cookies (1 box)", "Cheese and Crackers", "Trail Mix or Nuts (1 bag)", "Frozen Fruit Bars (1 box)", "Brownie Mix (1 box)", "Gummy Snacks (1 bag)"]
};
var FILL = { meat: 3, vegetable: 4, starch: 1, fruit: 2, breakfast: 5, fun: 3 };

/* ═══ DEFAULT INVENTORY ═══ */
var DEF_INV = [
  { id: 1, name: "Flour", category: "Food Staples", urgency: 2, amount: "5 lb", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 50 }] },
  { id: 2, name: "Sugar", category: "Food Staples", urgency: 2, amount: "5 lb", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 50 }] },
  { id: 3, name: "Brown Sugar", category: "Food Staples", urgency: 2, amount: "5 lb", levels: [{ week: "2/15/26", level: 0 }, { week: "2/22/26", level: 0 }] },
  { id: 4, name: "Rice", category: "Food Staples", urgency: 2, amount: "5 lb", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 5, name: "Pasta", category: "Food Staples", urgency: 2, amount: "5 lb", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 6, name: "Quinoa", category: "Food Staples", urgency: 2, amount: "5 lb", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 7, name: "Popcorn", category: "Food Staples", urgency: 2, amount: "1 lb", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 8, name: "Corn (Can)", category: "Food Staples", urgency: 2, amount: "4 cans", levels: [{ week: "2/15/26", level: 80 }, { week: "2/22/26", level: 80 }] },
  { id: 9, name: "Black Beans (Can)", category: "Food Staples", urgency: 2, amount: "4 cans", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 10, name: "Kidney Beans (Can)", category: "Food Staples", urgency: 2, amount: "4 cans", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 11, name: "Black Eyed Peas (Can)", category: "Food Staples", urgency: 2, amount: "4 cans", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 12, name: "Corn (Frozen)", category: "Food Staples", urgency: 2, amount: "2 bags", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 13, name: "Cauliflower Rice (Frozen)", category: "Food Staples", urgency: 3, amount: "3 bags", levels: [{ week: "2/15/26", level: 25 }, { week: "2/22/26", level: 20 }] },
  { id: 14, name: "Green Beans (Frozen)", category: "Food Staples", urgency: 2, amount: "2 bags", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 15, name: "Chicken Tenders (Frozen)", category: "Food Staples", urgency: 3, amount: "1 bag", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 16, name: "Chicken Thighs (Frozen)", category: "Food Staples", urgency: 2, amount: "1 bag", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 17, name: "Adobo Chicken (Frozen)", category: "Food Staples", urgency: 2, amount: "1 bag", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 18, name: "Chicken Broth (Frozen)", category: "Food Staples", urgency: 3, amount: "6 cups", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 19, name: "Salmon (Frozen)", category: "Food Staples", urgency: 2, amount: "1 bag", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 20, name: "Fruit (Frozen)", category: "Food Staples", urgency: 3, amount: "3 bags", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 21, name: "Mini Chocolate Chips", category: "Food Staples", urgency: 2, amount: "2 bags", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 22, name: "Hash Brown Patties", category: "Food Staples", urgency: 2, amount: "2 packs", levels: [{ week: "2/15/26", level: 0 }, { week: "2/22/26", level: 0 }] },
  { id: 23, name: "Bratwurst (Frozen)", category: "Food Staples", urgency: 2, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 24, name: "Bacon (Frozen)", category: "Food Staples", urgency: 2, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 25, name: "Soy Sauce", category: "Food Staples", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 26, name: "Smoked Soy Sauce", category: "Food Staples", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 27, name: "Olive Oil", category: "Food Staples", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 28, name: "Neutral Oil", category: "Food Staples", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 29, name: "Sesame Oil", category: "Food Staples", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 30, name: "Buffalo Hot Sauce", category: "Food Staples", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 31, name: "Cholula", category: "Food Staples", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 32, name: "Louisiana Hot", category: "Food Staples", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 33, name: "Sriracha", category: "Food Staples", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 34, name: "Peri Peri", category: "Food Staples", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 35, name: "Honey", category: "Food Staples", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 36, name: "Maple Syrup", category: "Food Staples", urgency: 1, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 37, name: "Fake Syrup", category: "Food Staples", urgency: 1, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 38, name: "White Vinegar", category: "Food Staples", urgency: 1, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 39, name: "Apple Cider Vinegar", category: "Food Staples", urgency: 1, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 40, name: "A1 Sauce", category: "Food Staples", urgency: 3, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 41, name: "Peanut Butter", category: "Food Staples", urgency: 1, amount: "1 tub", levels: [{ week: "2/15/26", level: 100 }, { week: "2/22/26", level: 98 }] },
  { id: 42, name: "Jam", category: "Food Staples", urgency: 1, amount: "1 tub", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 43, name: "Chocolate Sauce", category: "Food Staples", urgency: 1, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 44, name: "Protein Bars", category: "Food Staples", urgency: 2, amount: "1 pack", levels: [{ week: "2/15/26", level: 100 }, { week: "2/22/26", level: 95 }] },
  { id: 45, name: "Protein Shakes", category: "Food Staples", urgency: 2, amount: "1 pack", levels: [{ week: "2/15/26", level: 100 }, { week: "2/22/26", level: 95 }] },
  { id: 46, name: "Ketchup", category: "Fridge Sauces", urgency: 1, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 47, name: "Yellow Mustard", category: "Fridge Sauces", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 48, name: "Brown Mustard", category: "Fridge Sauces", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 49, name: "Dijon Mustard", category: "Fridge Sauces", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 50, name: "Mayo", category: "Fridge Sauces", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 51, name: "Yum Yum Sauce", category: "Fridge Sauces", urgency: 2, amount: "1 tub", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 52, name: "Ranch", category: "Fridge Sauces", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 53, name: "Sesame Dressing", category: "Fridge Sauces", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 54, name: "Italian Vinaigrette", category: "Fridge Sauces", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 55, name: "Garlic Minced", category: "Fridge Sauces", urgency: 2, amount: "1 tub", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 56, name: "Salt", category: "Food Staples", urgency: 2, amount: "1 tub", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 57, name: "Pepper", category: "Food Staples", urgency: 2, amount: "1 tub", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 58, name: "Paper Towels", category: "Kitchen Items", urgency: 3, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 59, name: "Sponge", category: "Kitchen Items", urgency: 2, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 60, name: "Scrubber", category: "Kitchen Items", urgency: 2, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 61, name: "Dish Soap", category: "Kitchen Items", urgency: 2, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 62, name: "Power Scrub", category: "Kitchen Items", urgency: 2, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 63, name: "Paper Bowl", category: "Kitchen Items", urgency: 1, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 64, name: "Paper Plate", category: "Kitchen Items", urgency: 1, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 65, name: "Plastic Cutlery", category: "Kitchen Items", urgency: 1, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 66, name: "Dishwasher Tabs", category: "Kitchen Items", urgency: 4, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 67, name: "Laundry Pods", category: "Laundry Items", urgency: 4, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 68, name: "Dryer Sheets", category: "Laundry Items", urgency: 2, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 69, name: "All Purpose Cleaner", category: "Cleaning Supplies", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 70, name: "Glass Cleaner", category: "Cleaning Supplies", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 71, name: "Degreaser", category: "Cleaning Supplies", urgency: 2, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 72, name: "Floor Cleaner", category: "Cleaning Supplies", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 73, name: "Bleach", category: "Cleaning Supplies", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 74, name: "Toilet Bowl Cleaner", category: "Cleaning Supplies", urgency: 2, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 75, name: "Swiffer Pads", category: "Cleaning Supplies", urgency: 2, amount: "1 pack", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 76, name: "Tooth Paste", category: "Bathroom", urgency: 3, amount: "1 pack", levels: [{ week: "2/15/26", level: 10 }, { week: "2/22/26", level: 5 }] },
  { id: 77, name: "Toilet Paper", category: "Bathroom", urgency: 4, amount: "1 pack", levels: [{ week: "2/15/26", level: 25 }, { week: "2/22/26", level: 20 }] },
  { id: 78, name: "Face Wash", category: "Bathroom", urgency: 3, amount: "1 bottle", levels: [{ week: "2/15/26", level: 50 }, { week: "2/22/26", level: 48 }] },
  { id: 79, name: "Shampoo", category: "Bathroom", urgency: 3, amount: "1 bottle", levels: [{ week: "2/15/26", level: 100 }, { week: "2/22/26", level: 99 }] },
  { id: 80, name: "Conditioner", category: "Bathroom", urgency: 3, amount: "1 bottle", levels: [{ week: "2/15/26", level: 100 }, { week: "2/22/26", level: 99 }] }
];

/* ═══ DEFAULT RECIPES ═══ */
var DEF_REC = [
  { id: 1, name: "Italian Beef", category: "Handhelds", cost: 5, time: "3 Days", ingredients: [{ name: "Beef Chuck Roast", qty: "3 lb", groceryCat: "meat" }, { name: "Beef Broth", qty: "2 cups", groceryCat: "other" }, { name: "Giardiniera", qty: "1/4 cup", groceryCat: "other" }, { name: "Kaiser Rolls", qty: "6", groceryCat: "other" }, { name: "Provolone Cheese", qty: "", groceryCat: "other" }], steps: ["Sear beef.", "Slow cook 8-10 hrs.", "Shred and assemble."] },
  { id: 2, name: "Adobo Chicken Tacos", category: "Handhelds", cost: 4, time: "1 day", ingredients: [{ name: "Chicken Thighs", qty: "6", groceryCat: "meat" }, { name: "Chipotle Peppers", qty: "1 can", groceryCat: "other" }, { name: "Yellow Onion", qty: "1", groceryCat: "vegetable" }, { name: "Tortillas", qty: "1 pack", groceryCat: "other" }, { name: "Avocado", qty: "1", groceryCat: "vegetable" }, { name: "Mangos", qty: "2", groceryCat: "fruit" }, { name: "Red Onion", qty: "1/2", groceryCat: "vegetable" }, { name: "Jalapeno", qty: "1", groceryCat: "vegetable" }], steps: ["Slow cook chicken 3 hrs.", "Shred, griddle tortillas.", "Top with mango salsa."] },
  { id: 3, name: "Elote Tacos", category: "Handhelds", cost: 1, time: "30 min", ingredients: [{ name: "Adobo Chicken", qty: "pre-made", groceryCat: "meat" }, { name: "Tortillas", qty: "1 pack", groceryCat: "other" }, { name: "Corn", qty: "1 can", groceryCat: "vegetable" }, { name: "Parmesan", qty: "1/2 cup", groceryCat: "other" }], steps: ["Reheat chicken.", "Char corn with mayo and parm.", "Assemble."] },
  { id: 4, name: "Fajita Tacos", category: "Handhelds", cost: 2, time: "3 hours", ingredients: [{ name: "Bell Peppers", qty: "3", groceryCat: "vegetable" }, { name: "Yellow Onion", qty: "1", groceryCat: "vegetable" }, { name: "Tortillas", qty: "1 pack", groceryCat: "other" }, { name: "Avocado", qty: "1", groceryCat: "vegetable" }], steps: ["Saute peppers and onion.", "Toast tortillas.", "Assemble."] },
  { id: 5, name: "Detox Salad", category: "Healthy", cost: 3, time: "6 hours", ingredients: [{ name: "Carrots", qty: "3", groceryCat: "vegetable" }, { name: "Brussels Sprouts", qty: "12", groceryCat: "vegetable" }, { name: "Broccoli", qty: "1/2 head", groceryCat: "vegetable" }, { name: "Cauliflower", qty: "1/2 head", groceryCat: "vegetable" }, { name: "Avocado", qty: "1", groceryCat: "vegetable" }, { name: "Bacon", qty: "4 strips", groceryCat: "meat" }, { name: "Dried Cranberries", qty: "handful", groceryCat: "other" }], steps: ["Mix vegetables.", "Make dressing.", "Top with bacon."] },
  { id: 6, name: "Steak Salad", category: "Healthy", cost: 4, time: "1 day", ingredients: [{ name: "NY Strip Steak", qty: "1", groceryCat: "meat" }, { name: "Mixed Greens", qty: "1 bag", groceryCat: "vegetable" }, { name: "Radish", qty: "3", groceryCat: "vegetable" }, { name: "Corn on the Cob", qty: "2", groceryCat: "vegetable" }, { name: "Beets", qty: "2", groceryCat: "vegetable" }, { name: "Goat Cheese", qty: "", groceryCat: "other" }], steps: ["Cook steak, slice.", "Mix salad.", "Dress."] },
  { id: 7, name: "Dense Bean Caesar", category: "Healthy", cost: 1, time: "30 min", ingredients: [{ name: "Kidney Beans", qty: "1 can", groceryCat: "other" }, { name: "Chickpeas", qty: "1 can", groceryCat: "other" }, { name: "Cabbage", qty: "1 head", groceryCat: "vegetable" }, { name: "Cucumber", qty: "1", groceryCat: "vegetable" }, { name: "Red Onion", qty: "1/2", groceryCat: "vegetable" }, { name: "Caesar Dressing", qty: "", groceryCat: "other" }], steps: ["Mix all.", "Dress."] },
  { id: 8, name: "Sushi Salmon Bowl", category: "Bowls", cost: 4, time: "1 day", ingredients: [{ name: "Salmon Filets", qty: "2", groceryCat: "meat" }, { name: "English Cucumber", qty: "1", groceryCat: "vegetable" }, { name: "Avocado", qty: "1", groceryCat: "vegetable" }, { name: "Pickled Ginger", qty: "", groceryCat: "other" }, { name: "Kewpie Mayo", qty: "1/2 cup", groceryCat: "other" }, { name: "Furikake", qty: "1 tbsp", groceryCat: "other" }], steps: ["Marinate salmon.", "Cook rice.", "Air fry salmon.", "Assemble."] },
  { id: 9, name: "Pesto Pasta Bowl", category: "Bowls", cost: 5, time: "3 Days", ingredients: [{ name: "Chicken Breast", qty: "2", groceryCat: "meat" }, { name: "Peas", qty: "1 cup", groceryCat: "vegetable" }, { name: "Shallot", qty: "1", groceryCat: "vegetable" }, { name: "Fresh Spinach", qty: "2 cups", groceryCat: "vegetable" }, { name: "Pine Nuts", qty: "1/2 cup", groceryCat: "other" }, { name: "Fresh Basil", qty: "1 pkg", groceryCat: "other" }, { name: "Pesto Puck", qty: "1", groceryCat: "other" }], steps: ["Boil pasta.", "Sear chicken.", "Saute peas.", "Mix with pesto."] },
  { id: 10, name: "Cajun Fried Rice", category: "Bowls", cost: 3, time: "6 hours", ingredients: [{ name: "Bacon or Andouille", qty: "6 strips", groceryCat: "meat" }, { name: "Chicken Thighs", qty: "3", groceryCat: "meat" }, { name: "Okra", qty: "20 cubes", groceryCat: "vegetable" }, { name: "Onion", qty: "1/2", groceryCat: "vegetable" }, { name: "Spring Onions", qty: "bunch", groceryCat: "vegetable" }, { name: "Eggs", qty: "3", groceryCat: "other" }], steps: ["Cook rice and meat.", "Saute veg.", "Scramble eggs.", "Combine."] },
  { id: 11, name: "Korean BBQ Bowl", category: "Bowls", cost: 5, time: "3 Days", ingredients: [{ name: "Flank Steak", qty: "3 lbs", groceryCat: "meat" }, { name: "Broccoli", qty: "3 heads", groceryCat: "vegetable" }, { name: "Green Onions", qty: "5 stalks", groceryCat: "vegetable" }, { name: "Cabbage", qty: "1 head", groceryCat: "vegetable" }, { name: "Brown Sugar", qty: "1 cup", groceryCat: "other" }, { name: "Ginger", qty: "1 cube", groceryCat: "other" }], steps: ["Mix sauce.", "Slow cook steak.", "Steam broccoli.", "Pickle cabbage.", "Plate."] },
  { id: 12, name: "Smoked Sausage Bowl", category: "Bowls", cost: 2, time: "3 hours", ingredients: [{ name: "Smoked Sausage", qty: "1", groceryCat: "meat" }, { name: "Sweet Potatoes", qty: "2", groceryCat: "vegetable" }, { name: "Broccoli", qty: "1 head", groceryCat: "vegetable" }, { name: "Asparagus", qty: "1 bunch", groceryCat: "vegetable" }], steps: ["Oven 400F.", "Roast potatoes 15 min.", "Add sausage 15 min.", "Add asparagus 10 min."] },
  { id: 13, name: "Sausage and Pepper Bowl", category: "Bowls", cost: 3, time: "6 hours", ingredients: [{ name: "Italian Sausage", qty: "1 pack", groceryCat: "meat" }, { name: "Russet Potatoes", qty: "2", groceryCat: "starch" }, { name: "Bell Peppers", qty: "3", groceryCat: "vegetable" }, { name: "Yellow Onion", qty: "1", groceryCat: "vegetable" }], steps: ["Bake potatoes.", "Brown sausage.", "Saute peppers.", "Assemble."] },
  { id: 14, name: "Chipotle Taco Bowl", category: "Bowls", cost: 3, time: "6 hours", ingredients: [{ name: "Chicken Thighs", qty: "6", groceryCat: "meat" }, { name: "Avocado", qty: "1", groceryCat: "vegetable" }, { name: "Bell Peppers", qty: "3", groceryCat: "vegetable" }, { name: "Yellow Onion", qty: "1", groceryCat: "vegetable" }, { name: "Mangos", qty: "2", groceryCat: "fruit" }, { name: "Red Onion", qty: "1/2", groceryCat: "vegetable" }, { name: "Jalapeno", qty: "1", groceryCat: "vegetable" }], steps: ["Slow cook chicken.", "Cook rice.", "Make salsa.", "Assemble."] },
  { id: 15, name: "Baked Ziti", category: "Bowls", cost: 2, time: "3 hours", ingredients: [{ name: "Ground Pork", qty: "1 lb", groceryCat: "meat" }, { name: "Hot Italian Sausage", qty: "1 lb", groceryCat: "meat" }, { name: "Ziti", qty: "1 lb", groceryCat: "other" }, { name: "Mozzarella", qty: "1/2 lb", groceryCat: "other" }, { name: "Tomato Sauce", qty: "1 container", groceryCat: "other" }, { name: "Carrots", qty: "1 cup", groceryCat: "vegetable" }, { name: "Spinach", qty: "1.5 cups", groceryCat: "vegetable" }], steps: ["Blitz sauce.", "Fry meat.", "Boil ziti.", "Bake 20 min."] },
  { id: 16, name: "Black and Yellow Rice", category: "Bowls", cost: 2, time: "3 hours", ingredients: [{ name: "Sausage", qty: "1/2 lb", groceryCat: "meat" }, { name: "Black Beans", qty: "1 can", groceryCat: "other" }, { name: "Carrots", qty: "1 cup", groceryCat: "vegetable" }], steps: ["Cook rice with turmeric.", "Fry sausage.", "Mix."] },
  { id: 17, name: "Quick Pesto Pasta", category: "Bowls", cost: 2, time: "3 hours", ingredients: [{ name: "Chicken Tenders or Bacon", qty: "", groceryCat: "meat" }, { name: "Spinach", qty: "1 bag", groceryCat: "vegetable" }, { name: "Pine Nuts", qty: "1/2 cup", groceryCat: "other" }, { name: "Fresh Basil", qty: "1 pkg", groceryCat: "other" }], steps: ["Blanch veggies.", "Boil pasta.", "Heat protein.", "Mix with pesto."] },
  { id: 18, name: "Roast Salmon", category: "Healthy", cost: 1, time: "30 min", ingredients: [{ name: "Salmon Filets", qty: "2", groceryCat: "meat" }, { name: "Green Beans", qty: "2 cups", groceryCat: "vegetable" }, { name: "Lemon", qty: "1", groceryCat: "other" }], steps: ["Foil in cast iron.", "Layer beans then salmon.", "Bake 400F 35 min."] },
  { id: 19, name: "Swamp Potatoes", category: "Bowls", cost: 3, time: "6 hours", ingredients: [{ name: "Kielbasa", qty: "1 lb", groceryCat: "meat" }, { name: "Waxy Potatoes", qty: "1 lb", groceryCat: "starch" }, { name: "Cabbage", qty: "most of head", groceryCat: "vegetable" }, { name: "Green Beans", qty: "1 lb", groceryCat: "vegetable" }, { name: "Butter", qty: "1 stick", groceryCat: "other" }, { name: "Beef Broth", qty: "3/4 cup", groceryCat: "other" }], steps: ["Slow cooker low 6-7 hrs.", "Add green beans last hour."] },
  { id: 20, name: "Chicken Piccata", category: "Off Menu", cost: 4, time: "1 day", ingredients: [{ name: "Chicken Breast", qty: "2", groceryCat: "meat" }, { name: "Butter", qty: "3 tbsp", groceryCat: "other" }, { name: "Lemon", qty: "1", groceryCat: "other" }, { name: "Capers", qty: "2 tbsp", groceryCat: "other" }], steps: ["Dredge and sear chicken.", "Make lemon-caper sauce."] },
  { id: 21, name: "Pork Schnitzel", category: "Off Menu", cost: 5, time: "3 Days", ingredients: [{ name: "Pork Cutlets", qty: "4", groceryCat: "meat" }, { name: "Breadcrumbs", qty: "2 cups", groceryCat: "other" }, { name: "Eggs", qty: "2", groceryCat: "other" }, { name: "Lemon", qty: "1", groceryCat: "other" }], steps: ["Pound thin.", "Bread and fry."] },
  { id: 22, name: "Wonton Soup", category: "Off Menu", cost: 1, time: "30 min", ingredients: [{ name: "Ground Pork", qty: "1/2 lb", groceryCat: "meat" }, { name: "Wonton Wrappers", qty: "1 pack", groceryCat: "other" }, { name: "Green Onions", qty: "bunch", groceryCat: "vegetable" }, { name: "Bok Choy", qty: "2", groceryCat: "vegetable" }], steps: ["Mix filling.", "Fill wontons.", "Boil 4-5 min.", "Add bok choy."] }
];

/* ═══ STATE ═══ */
var inventory = ld("p_inv", DEF_INV); var recipes = ld("p_rec", DEF_REC); var selMeals = ld("p_meals", []); var gEdits = ld("p_gedits", {});
var curPage = "inventory"; var invFilter = "All"; var invSort = "urgency"; var invDir = "desc";
var checkedItems = {}; var checkInUpdates = {}; var checkInDone = false; var expandedRecipe = null;
if (recipes.length >= 2 && selMeals.length === 0) { var sh = shuf(recipes.map(function (_, i) { return i })); selMeals = [sh[0], sh[1]]; sv("p_meals", selMeals) }

/* ═══ INITIAL SYNC + POLLING ═══ */
if (syncOK) { pullFromSheet(); setInterval(pullFromSheet, POLL_MS) }

/* ═══ WEDNESDAY DECAY ═══ */
function calcDecay(item) { var ls = item.levels; for (var i = ls.length - 1; i >= 1; i--) { var d = ls[i - 1].level - ls[i].level; if (d > 0) return d } return 0 }
function checkDecay() { var now = new Date(); if (now.getDay() !== 3) return; var last = ld("p_last_decay", ""); var today = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate(); if (last === today) return; var ch = false; inventory = inventory.map(function (it) { var d = calcDecay(it); if (d <= 0) return it; var p = clamp(ll(it) - d); if (p === ll(it)) return it; ch = true; return Object.assign({}, it, { levels: it.levels.concat([{ week: wkStr(), level: p }]) }) }); if (ch) { sv("p_inv", inventory); sv("p_last_decay", today) } }
checkDecay();

/* ═══ HELPERS ═══ */
var UTH = { 4: 30, 3: 20, 2: 10, 1: 0 }; var UL = { 4: "Critical", 3: "High", 2: "Medium", 1: "Low" }; var UC = { 4: "#e74c3c", 3: "#f39c12", 2: "#3498db", 1: "#95a5a6" };
function ll(it) { return clamp(it.levels[it.levels.length - 1].level) }
function prj(it) { return clamp(ll(it) - calcDecay(it)) }
function isLow(it) { return ll(it) <= UTH[it.urgency] }
function lClr(l) { return l <= 10 ? "#e74c3c" : l <= 25 ? "#f39c12" : l <= 50 ? "#e67e22" : "#27ae60" }
function shuf(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t } return b }
function wkStr() { var d = new Date(); return (d.getMonth() + 1) + "/" + d.getDate() + "/" + String(d.getFullYear()).slice(-2) }
function invMatch(n, inv) { var lo = n.toLowerCase(); for (var i = 0; i < inv.length; i++) { var il = inv[i].name.toLowerCase(); if (lo.indexOf(il) >= 0 || il.indexOf(lo) >= 0) return inv[i]; var w = lo.split(/[\s,()]+/); for (var j = 0; j < w.length; j++) { if (w[j].length > 3 && il.indexOf(w[j]) >= 0) return inv[i] } } return null }
function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML }
function $$(s) { return document.querySelectorAll(s) }
function dollars(n) { var s = ""; for (var i = 0; i < n; i++) s += "$"; return s }
function toast(m) { var t = document.createElement("div"); t.style.cssText = "position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#2d6a4f;color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;z-index:2000;box-shadow:0 4px 12px rgba(0,0,0,.2)"; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove() }, 2500) }

/* ═══ RENDER ═══ */
var main = document.getElementById("main");
function render() { if (curPage === "inventory") renderInv(); else if (curPage === "checkin") renderCI(); else if (curPage === "recipes") renderRec(); else if (curPage === "grocery") renderGro(); $$("nav button").forEach(function (b) { b.classList.toggle("active", b.dataset.page === curPage) }) }

/* ═══ INVENTORY PAGE ═══ */
function renderInv() {
  var cats = {}; inventory.forEach(function (i) { cats[i.category] = true }); var cl = Object.keys(cats);
  var items = invFilter === "All" ? inventory.slice() : inventory.filter(function (i) { return i.category === invFilter });
  items.sort(function (a, b) { var vA, vB; if (invSort === "urgency") { vA = a.urgency; vB = b.urgency } else if (invSort === "level") { vA = ll(a); vB = ll(b) } else { vA = a.name.toLowerCase(); vB = b.name.toLowerCase() } return invDir === "asc" ? (vA < vB ? -1 : vA > vB ? 1 : 0) : (vA > vB ? -1 : vA < vB ? 1 : 0) });
  var lc = inventory.filter(isLow).length; var avg = Math.round(inventory.reduce(function (s, i) { return s + ll(i) }, 0) / inventory.length);
  var h = '<div class="topbar"><div class="stats" style="flex:1"><div class="stat"><div class="stat-label">Items</div><div class="stat-val">' + inventory.length + '</div></div><div class="stat red"><div class="stat-label">Low</div><div class="stat-val">' + lc + '</div></div><div class="stat"><div class="stat-label">Avg</div><div class="stat-val">' + avg + '%</div></div></div><button class="btn btn-sm" onclick="showAddItem()">+ Add</button></div>';
  h += '<div class="chips"><button class="chip' + (invFilter === "All" ? " on" : "") + '" onclick="setFilter(\'All\')">All</button>';
  cl.forEach(function (c) { h += '<button class="chip' + (invFilter === c ? " on" : "") + '" onclick="setFilter(\'' + esc(c) + '\')">' + esc(c) + '</button>' });
  h += '</div><div class="tbl-wrap"><table><thead><tr>';
  [["name", "Item"], ["urgency", "Urg"], ["level", "Level"]].forEach(function (p) { h += '<th onclick="toggleSort(\'' + p[0] + '\')">' + p[1] + " " + (invSort === p[0] ? (invDir === "asc" ? "&uarr;" : "&darr;") : "") + "</th>" });
  h += '<th>Amt</th></tr></thead><tbody>';
  items.forEach(function (it) { var c = ll(it); var lo = isLow(it); h += '<tr' + (lo ? ' class="low-bg"' : '') + '><td><span style="font-weight:600;color:#1a1a2e;font-size:13px">' + esc(it.name) + '</span>' + (lo ? '<span class="low-badge">LOW</span>' : '') + '</td><td><span class="urg" style="background:' + UC[it.urgency] + '22;color:' + UC[it.urgency] + '">' + UL[it.urgency] + '</span></td><td><div style="display:flex;align-items:center;gap:6px"><div class="bar-bg"><div class="bar-fill" style="width:' + c + '%;background:' + lClr(c) + '"></div></div><span style="font-size:12px;font-weight:600;color:' + lClr(c) + ';min-width:30px">' + c + '%</span></div></td><td style="font-size:12px;color:#888">' + esc(it.amount) + '</td></tr>' });
  h += '</tbody></table></div>'; main.innerHTML = h;
}

/* ═══ CHECK-IN ═══ */
function renderCI() {
  if (checkInDone) { main.innerHTML = '<div class="center"><div class="big">✓</div><h2>Check-in Complete!</h2><p style="color:#666;font-size:14px;margin-top:8px">Non-updated items projected via decay.</p><button class="btn" style="margin-top:16px" onclick="resetCI()">New Check-in</button></div>'; return }
  var items = inventory.slice().sort(function (a, b) { return ((5 - a.urgency) * 100 + ll(a)) - ((5 - b.urgency) * 100 + ll(b)) }).slice(0, 12);
  var h = '<h2 style="margin-bottom:4px">Weekly Check-in</h2><p style="color:#666;font-size:13px;margin-bottom:16px">12 priority items. Leave blank to auto-project.</p><div>';
  items.forEach(function (it) { var c = ll(it); var v = checkInUpdates[it.id] != null ? checkInUpdates[it.id] : ""; h += '<div class="update-row"><div class="info"><div class="nm">' + esc(it.name) + '</div><div class="amt">' + esc(it.amount) + '</div></div><div class="right"><div style="font-size:16px;font-weight:700;color:' + lClr(c) + ';min-width:36px;text-align:right">' + c + '%</div><span style="color:#ccc">&#8594;</span><input type="number" min="0" max="100" step="5" placeholder="' + prj(it) + '" value="' + v + '" onchange="updateCI(' + it.id + ',this.value)"></div></div>' });
  h += '</div><button class="btn" style="margin-top:20px;width:100%" onclick="submitCI()">Submit Check-in ✓</button>'; main.innerHTML = h;
}

/* ═══ RECIPES ═══ */
function renderRec() {
  var rec = selMeals.map(function (i) { return recipes[i] }).filter(Boolean);
  var h = '<div class="topbar"><div><h2 style="margin:0">Cookbook</h2><p style="color:#888;font-size:12px;margin-top:2px">' + recipes.length + ' recipes · tap to expand</p></div><button class="btn btn-sm" onclick="showAddRecipe()">+ Add</button></div>';
  if (rec.length > 0) { h += '<div style="font-size:12px;font-weight:700;color:#2d6a4f;margin-bottom:8px;text-transform:uppercase">This Week</div>'; rec.forEach(function (r) { h += rCard(r, true) }); h += '<div style="margin-bottom:24px"></div>' }
  h += '<div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;text-transform:uppercase">All Recipes</div>';
  recipes.forEach(function (r, i) { if (selMeals.indexOf(i) === -1) h += rCard(r, false) }); main.innerHTML = h;
}
function rCard(r, hl) {
  var idx = -1; for (var i = 0; i < recipes.length; i++) { if (recipes[i].id === r.id) { idx = i; break } }
  var h = '<div class="recipe-card' + (hl ? " hl" : "") + '"><div class="top"><div style="cursor:pointer;flex:1" onclick="toggleR(' + r.id + ')">';
  if (hl) h += '<div class="wk">★ This Week</div>';
  h += '<h3>' + esc(r.name) + '</h3><div class="meta">' + esc(r.category) + ' · ' + dollars(r.cost) + ' · ' + esc(r.time) + '</div></div>';
  h += '<button class="close" onclick="confirmDel(' + r.id + ',\'' + esc(r.name).replace(/'/g, "\\'") + '\')">✕</button></div>';
  if (expandedRecipe === r.id) { h += '<div class="detail"><div class="lbl">Ingredients</div><div class="pills">'; r.ingredients.forEach(function (ing) { h += '<span class="pill">' + esc(ing.name) + (ing.qty ? ' (' + esc(ing.qty) + ')' : '') + '</span>' }); h += '</div><div class="lbl" style="margin-top:10px">Steps</div><ol>'; r.steps.forEach(function (s) { h += '<li>' + esc(s) + '</li>' }); h += '</ol>'; if (!hl && idx >= 0) h += '<button class="btn" style="width:100%;margin-top:12px;font-size:13px;padding:10px" onclick="selRecipe(' + idx + ')">★ Select for This Week</button>'; h += '</div>' }
  return h + '</div>';
}

/* ═══ GROCERY ═══ */
function buildSections() {
  var m1 = recipes[selMeals[0]], m2 = recipes[selMeals[1]]; if (!m1 || !m2) return null;
  var allIng = m1.ingredients.concat(m2.ingredients);
  var seen = {}; var bk = { meat: [], vegetable: [], starch: [], fruit: [], other: [] };
  allIng.forEach(function (ing) { if (seen[ing.name]) return; seen[ing.name] = true; var m = invMatch(ing.name, inventory); if (m && ll(m) > 50) return; var c = ing.groceryCat || "other"; if (!bk[c]) c = "other"; bk[c].push({ text: ing.name + (ing.qty ? " — " + ing.qty : ""), src: "recipe" }) });
  var secDefs = [{ key: "meat", pool: "meat", cat: "meat" }, { key: "veg", pool: "vegetable", cat: "vegetable" }, { key: "starch", pool: "starch", cat: "starch" }, { key: "fruit", pool: "fruit", cat: "fruit" }];
  secDefs.forEach(function (sd) {
    if (gEdits[sd.key] && gEdits[sd.key].length > 0) { gEdits[sd.key].forEach(function (e) { bk[sd.cat].push(e) }); return }
    var pool = POOLS[sd.pool] || []; var cur = bk[sd.cat].length; var need = Math.max(0, FILL[sd.pool] - cur);
    var av = shuf(pool.filter(function (p) { return !seen[p.split("(")[0].trim()] }));
    for (var i = 0; i < Math.min(need, av.length); i++) bk[sd.cat].push({ text: av[i], src: "pool" });
  });
  var bkI = gEdits.bk && gEdits.bk.length > 0 ? gEdits.bk : shuf(POOLS.breakfast).slice(0, FILL.breakfast).map(function (p) { return { text: p, src: "pool" } });
  var fnI = gEdits.fun && gEdits.fun.length > 0 ? gEdits.fun : shuf(POOLS.fun).slice(0, FILL.fun).map(function (p) { return { text: p, src: "pool" } });
  return [{ key: "meat", pool: "meat", icon: "🥩", title: "Meat / Protein", items: bk.meat }, { key: "veg", pool: "vegetable", icon: "🥦", title: "Vegetables", items: bk.vegetable }, { key: "starch", pool: "starch", icon: "🥔", title: "Starch", items: bk.starch }, { key: "fruit", pool: "fruit", icon: "🍎", title: "Fruits", items: bk.fruit }, { key: "bk", pool: "breakfast", icon: "🍳", title: "Breakfast (4-5 days, 2 ppl)", items: bkI }, { key: "fun", pool: "fun", icon: "🍫", title: "Fun / Snacks (4-5 days)", items: fnI }, { key: "other", pool: null, icon: "🍽️", title: "Other Recipe Items", items: bk.other }];
}
function renderGro() {
  var secs = buildSections(); if (!secs) { main.innerHTML = "<p>Select meals first</p>"; return }
  var low = inventory.filter(isLow); var total = 0; secs.forEach(function (s) { total += s.items.length }); total += low.length;
  var ckC = 0; for (var k in checkedItems) if (checkedItems[k]) ckC++;
  var m1 = recipes[selMeals[0]], m2 = recipes[selMeals[1]];
  var h = '<div class="topbar"><div><h2 style="margin:0">Grocery List</h2><p style="color:#888;font-size:12px;margin-top:2px">' + ckC + '/' + total + ' checked</p></div><button class="btn-sec" onclick="reroll()">↻ New Meals</button></div>';
  h += '<div class="meal-cards">'; [{ m: m1, i: 0 }, { m: m2, i: 1 }].forEach(function (o) { h += '<div class="meal-card"><button class="close" onclick="replaceMeal(' + o.i + ')">✕</button><div class="tag">Meal ' + (o.i + 1) + '</div><h3>' + esc(o.m.name) + '</h3><div class="meta">' + dollars(o.m.cost) + ' · ' + esc(o.m.time) + '</div></div>' }); h += '</div>';
  secs.forEach(function (sec) {
    if (sec.items.length === 0 && !sec.pool) return;
    var canEdit = !!sec.pool && sec.key !== "other";
    h += '<div class="section-hdr">' + sec.icon + ' ' + sec.title;
    if (canEdit) h += ' <button class="btn-icon" onclick="toggleAddRow(\'' + sec.key + '\')">+</button>';
    h += '</div>';
    sec.items.forEach(function (it, ii) {
      var k = sec.key + "-" + ii; var c = !!checkedItems[k];
      h += '<div class="list-item' + (c ? " done" : "") + (it.src === "recipe" ? " recipe-bg" : "") + '">';
      h += '<div class="cb' + (c ? " on" : "") + '" onclick="toggleCk(\'' + k + '\')">' + (c ? "✓" : "") + '</div>';
      h += '<span style="flex:1" onclick="toggleCk(\'' + k + '\')">' + esc(it.text) + '</span>';
      if (it.src === "recipe") h += '<span class="badge">Recipe</span>';
      else if (canEdit) { h += '<button class="btn-icon" onclick="swapItem(\'' + sec.key + '\',\'' + sec.pool + '\',' + ii + ')" style="font-size:12px">↻</button><button class="btn-icon" onclick="removeItem(\'' + sec.key + '\',' + ii + ')" style="color:#e74c3c;border-color:#fcc">✕</button>' }
      h += '</div>';
    });
    if (canEdit) h += '<div id="ar-' + sec.key + '" style="display:none" class="add-row"><input id="in-' + sec.key + '" placeholder="Add custom item..." onkeydown="if(event.key===\'Enter\')addCustom(\'' + sec.key + '\')"><button onclick="addCustom(\'' + sec.key + '\')">Add</button></div>';
  });
  if (low.length > 0) { h += '<div class="section-hdr red">⚠️ Low Inventory — Restock</div>'; low.forEach(function (it, i) { var k = "l-" + i; var c = !!checkedItems[k]; h += '<div class="list-item' + (c ? " done" : "") + ' restock-bg" onclick="toggleCk(\'' + k + '\')"><div class="cb red' + (c ? " on" : "") + '">' + (c ? "✓" : "") + '</div><span style="flex:1">' + esc(it.name) + ' (' + esc(it.amount) + ')</span><span style="font-size:12px;font-weight:700;color:#e74c3c">' + ll(it) + '%</span></div>' }) }
  h += '<div style="margin-top:24px;padding-top:16px;border-top:2px solid #d4c9bc"><button class="btn" style="width:100%;font-size:16px;padding:14px" onclick="confirmShop()">✓ Confirm Shopping Complete</button><p style="color:#888;font-size:11px;text-align:center;margin-top:8px">Checked items update inventory to 100%</p></div>';
  main.innerHTML = h;
}

/* ═══ GROCERY EDIT ACTIONS ═══ */
function saveEdits(sk, items) { var pool = items.filter(function (i) { return i.src !== "recipe" }); gEdits[sk] = pool; sv("p_gedits", gEdits) }
function swapItem(sk, pk, idx) { var secs = buildSections(); var sec; for (var i = 0; i < secs.length; i++) if (secs[i].key === sk) { sec = secs[i]; break } if (!sec) return; var pool = POOLS[pk] || []; var used = sec.items.map(function (i) { return i.text.toLowerCase() }); var av = pool.filter(function (p) { return used.indexOf(p.toLowerCase()) === -1 }); if (!av.length) { toast("No more options!"); return } sec.items[idx] = { text: av[Math.floor(Math.random() * av.length)], src: "pool" }; saveEdits(sk, sec.items); render() }
function removeItem(sk, idx) { var secs = buildSections(); var sec; for (var i = 0; i < secs.length; i++) if (secs[i].key === sk) { sec = secs[i]; break } if (!sec) return; sec.items.splice(idx, 1); saveEdits(sk, sec.items); checkedItems = {}; render() }
function toggleAddRow(sk) { var el = document.getElementById("ar-" + sk); if (el) el.style.display = el.style.display === "none" ? "flex" : "none"; var inp = document.getElementById("in-" + sk); if (inp) setTimeout(function () { inp.focus() }, 100) }
function addCustom(sk) { var inp = document.getElementById("in-" + sk); if (!inp || !inp.value.trim()) return; var secs = buildSections(); var sec; for (var i = 0; i < secs.length; i++) if (secs[i].key === sk) { sec = secs[i]; break } if (!sec) return; sec.items.push({ text: inp.value.trim(), src: "custom" }); saveEdits(sk, sec.items); render() }

/* ═══ ACTIONS ═══ */
function confirmShop() { var ckC = 0; for (var k in checkedItems) if (checkedItems[k]) ckC++; var ov = document.createElement("div"); ov.className = "overlay"; ov.id = "co"; ov.onclick = function (e) { if (e.target === ov) ov.remove() }; var h = '<div class="modal" style="max-width:340px;text-align:center"><div style="font-size:40px;margin-bottom:8px">🛒</div><h3 style="margin-bottom:12px">Shopping Done?</h3><p style="color:#666;font-size:14px;margin-bottom:20px">' + ckC + ' items will be marked 100%.</p><div style="display:flex;gap:10px"><button class="btn-sec" style="flex:1" onclick="document.getElementById(\'co\').remove()">Cancel</button><button class="btn" style="flex:1" onclick="doShop()">Confirm</button></div></div>'; ov.innerHTML = h; document.body.appendChild(ov) }
function doShop() { var ws = wkStr(); var secs = buildSections(); var cn = []; if (secs) { secs.forEach(function (s) { s.items.forEach(function (it, ii) { if (checkedItems[s.key + "-" + ii]) cn.push(it.text) }) }); var low = inventory.filter(isLow); low.forEach(function (it, i) { if (checkedItems["l-" + i]) cn.push(it.name) }) } inventory = inventory.map(function (it) { for (var i = 0; i < cn.length; i++) { var c = cn[i].toLowerCase(); var n = it.name.toLowerCase(); if (c.indexOf(n) >= 0 || n.indexOf(c) >= 0 || c.split(/[\s,()]+/).filter(function (w) { return w.length > 3 }).some(function (w) { return n.indexOf(w) >= 0 })) return Object.assign({}, it, { levels: it.levels.concat([{ week: ws, level: 100 }]) }) } return it }); sv("p_inv", inventory); checkedItems = {}; gEdits = {}; sv("p_gedits", gEdits); var el = document.getElementById("co"); if (el) el.remove(); curPage = "inventory"; render(); toast("Inventory updated!") }
function setFilter(c) { invFilter = c; render() }
function toggleSort(c) { if (invSort === c) invDir = invDir === "asc" ? "desc" : "asc"; else { invSort = c; invDir = "desc" } render() }
function toggleCk(k) { checkedItems[k] = !checkedItems[k]; render() }
function toggleR(id) { expandedRecipe = expandedRecipe === id ? null : id; render() }
function confirmDel(id, name) { var ov = document.createElement("div"); ov.className = "overlay"; ov.id = "co"; ov.onclick = function (e) { if (e.target === ov) ov.remove() }; var h = '<div class="modal" style="max-width:340px;text-align:center"><h3 style="margin-bottom:12px">Delete Recipe?</h3><p style="color:#666;font-size:14px;margin-bottom:20px">Delete <strong>' + name + '</strong>? Cannot be undone.</p><div style="display:flex;gap:10px"><button class="btn-sec" style="flex:1" onclick="document.getElementById(\'co\').remove()">Cancel</button><button class="btn" style="flex:1;background:#e74c3c" onclick="doDel(' + id + ')">Delete</button></div></div>'; ov.innerHTML = h; document.body.appendChild(ov) }
function doDel(id) { var oi = -1; for (var i = 0; i < recipes.length; i++) if (recipes[i].id === id) { oi = i; break } recipes = recipes.filter(function (r) { return r.id !== id }); sv("p_rec", recipes); selMeals = selMeals.map(function (s) { if (s === oi) return -1; if (s > oi) return s - 1; return s }); if (selMeals[0] < 0 || selMeals[0] >= recipes.length) selMeals[0] = 0; if (selMeals[1] < 0 || selMeals[1] >= recipes.length) selMeals[1] = Math.min(1, recipes.length - 1); sv("p_meals", selMeals); var el = document.getElementById("co"); if (el) el.remove(); render() }
function selRecipe(idx) { if (selMeals[0] === idx || selMeals[1] === idx) return; var m1 = recipes[selMeals[0]], m2 = recipes[selMeals[1]]; var ov = document.createElement("div"); ov.className = "overlay"; ov.id = "co"; ov.onclick = function (e) { if (e.target === ov) ov.remove() }; var h = '<div class="modal" style="max-width:340px;text-align:center"><h3 style="margin-bottom:12px">Replace Which Meal?</h3><p style="color:#666;font-size:13px;margin-bottom:16px">Slot for <strong>' + esc(recipes[idx].name) + '</strong></p><div style="display:grid;gap:10px"><button class="btn-sec" style="padding:14px" onclick="doSel(' + idx + ',0)">Replace: ' + (m1 ? esc(m1.name) : "Empty") + '</button><button class="btn-sec" style="padding:14px" onclick="doSel(' + idx + ',1)">Replace: ' + (m2 ? esc(m2.name) : "Empty") + '</button><button style="background:0;border:0;color:#888;font-size:13px;cursor:pointer;padding:8px" onclick="document.getElementById(\'co\').remove()">Cancel</button></div></div>'; ov.innerHTML = h; document.body.appendChild(ov) }
function doSel(idx, slot) { selMeals[slot] = idx; sv("p_meals", selMeals); checkedItems = {}; gEdits = {}; sv("p_gedits", gEdits); var el = document.getElementById("co"); if (el) el.remove(); render() }
function updateCI(id, v) { checkInUpdates[id] = v }
function resetCI() { checkInDone = false; checkInUpdates = {}; render() }
function submitCI() { var ws = wkStr(); inventory = inventory.map(function (it) { if (checkInUpdates[it.id] != null && checkInUpdates[it.id] !== "") return Object.assign({}, it, { levels: it.levels.concat([{ week: ws, level: clamp(+checkInUpdates[it.id]) }]) }); return Object.assign({}, it, { levels: it.levels.concat([{ week: ws, level: clamp(prj(it)) }]) }) }); sv("p_inv", inventory); checkInDone = true; render() }
function reroll() { var sh = shuf(recipes.map(function (_, i) { return i })); selMeals = [sh[0], sh[1]]; sv("p_meals", selMeals); checkedItems = {}; gEdits = {}; sv("p_gedits", gEdits); render() }
function replaceMeal(slot) { var other = selMeals[slot === 0 ? 1 : 0]; var av = recipes.map(function (_, i) { return i }).filter(function (i) { return i !== other }); selMeals[slot] = av[Math.floor(Math.random() * av.length)]; sv("p_meals", selMeals); checkedItems = {}; gEdits = {}; sv("p_gedits", gEdits); render() }

/* ═══ ADD ITEM MODAL ═══ */
function showAddItem() { var ov = document.createElement("div"); ov.className = "overlay"; ov.id = "mo"; ov.onclick = function (e) { if (e.target === ov) ov.remove() }; var cats = ["Food Staples", "Fridge Sauces", "Kitchen Items", "Laundry Items", "Cleaning Supplies", "Bathroom"]; var h = '<div class="modal"><div class="hdr"><h3>Add Item</h3><button class="close" onclick="document.getElementById(\'mo\').remove()">✕</button></div><div class="field"><label>Name</label><input id="ai-n" placeholder="e.g. Olive Oil"></div><div class="field"><label>Category</label><select id="ai-c">' + cats.map(function (c) { return '<option>' + c + '</option>' }).join("") + '</select></div><div class="row2"><div class="field"><label>Urgency</label><select id="ai-u"><option value="1">1 — Low</option><option value="2" selected>2 — Medium</option><option value="3">3 — High</option><option value="4">4 — Critical</option></select></div><div class="field"><label>Amount</label><input id="ai-a" placeholder="1 bottle"></div></div><div class="field"><label>Level: <span id="ai-l">100</span>%</label><input type="range" id="ai-v" min="0" max="100" step="5" value="100" oninput="document.getElementById(\'ai-l\').textContent=this.value" style="width:100%;accent-color:#2d6a4f"></div><button class="btn" style="width:100%" onclick="addItem()">Add Item</button></div>'; ov.innerHTML = h; document.body.appendChild(ov) }
function addItem() { var n = document.getElementById("ai-n").value.trim(); var a = document.getElementById("ai-a").value.trim(); if (!n || !a) return; var mx = 0; inventory.forEach(function (i) { if (i.id > mx) mx = i.id }); inventory.push({ id: mx + 1, name: n, category: document.getElementById("ai-c").value, urgency: +document.getElementById("ai-u").value, amount: a, levels: [{ week: wkStr(), level: clamp(+document.getElementById("ai-v").value) }] }); sv("p_inv", inventory); document.getElementById("mo").remove(); render() }

/* ═══ ADD RECIPE MODAL ═══ */
var arP = [];
function showAddRecipe() { arP = []; var ov = document.createElement("div"); ov.className = "overlay"; ov.id = "mo"; ov.onclick = function (e) { if (e.target === ov) ov.remove() }; var h = '<div class="modal"><div class="hdr"><h3>Add Recipe</h3><button class="close" onclick="document.getElementById(\'mo\').remove()">✕</button></div><div class="field"><label>Name</label><input id="rn" placeholder="Chicken Alfredo"></div><div class="row3"><div class="field"><label>Type</label><select id="rc"><option>Handhelds</option><option>Healthy</option><option selected>Bowls</option><option>Off Menu</option></select></div><div class="field"><label>Cost</label><select id="rk"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></div><div class="field"><label>Prep</label><input id="rt" value="3 hours"></div></div><div class="field"><label>Ingredients (one per line)</label><textarea id="ri" placeholder="Chicken Breast (2)\nBell Peppers (3)"></textarea></div><div id="rcats"></div><button class="btn-sec" style="width:100%;margin-bottom:12px" onclick="catIng()">Categorize Ingredients</button><div class="field"><label>Steps (one per line)</label><textarea id="rs" placeholder="Season chicken\nSear in pan"></textarea></div><button class="btn" style="width:100%" onclick="addRec()">Add Recipe</button></div>'; ov.innerHTML = h; document.body.appendChild(ov) }
function catIng() { var lines = document.getElementById("ri").value.split("\n").filter(function (l) { return l.trim() }); arP = lines.map(function (l) { return { name: l.trim(), qty: "", groceryCat: "other" } }); var gc = ["meat", "vegetable", "starch", "fruit", "other"]; var h = '<div style="background:#fafaf8;border-radius:10px;padding:12px;margin-bottom:12px">'; arP.forEach(function (ing, i) { h += '<div class="cat-row"><span>' + esc(ing.name) + '</span><select onchange="arP[' + i + '].groceryCat=this.value">'; gc.forEach(function (g) { h += '<option value="' + g + '">' + g[0].toUpperCase() + g.slice(1) + '</option>' }); h += '</select></div>' }); h += '</div>'; document.getElementById("rcats").innerHTML = h }
function addRec() { var n = document.getElementById("rn").value.trim(); if (!n || arP.length === 0) { alert("Enter name and categorize ingredients first"); return } var mx = 0; recipes.forEach(function (r) { if (r.id > mx) mx = r.id }); var st = document.getElementById("rs").value.split("\n").filter(function (l) { return l.trim() }); recipes.push({ id: mx + 1, name: n, category: document.getElementById("rc").value, cost: +document.getElementById("rk").value, time: document.getElementById("rt").value, ingredients: arP.slice(), steps: st }); sv("p_rec", recipes); document.getElementById("mo").remove(); render() }

/* ═══ NAV ═══ */
document.getElementById("tabs").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; curPage = b.dataset.page; render() });

/* ═══ INIT ═══ */
render();
