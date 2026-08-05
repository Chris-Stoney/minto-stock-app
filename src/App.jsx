import React, { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   MINTO PASTORAL CO — Farm Records (Prototype)
   Mobile-first field recording app.
   Shared storage: all users of this artifact see the same data.
   ============================================================ */

const KEYS = {
  mobs: "mp2:mobs",
  moves: "mp2:moves",
  health: "mp2:health",
  rain: "mp2:rain",
  trucking: "mp2:trucking",
  maint: "mp2:maint",
  pasture: "mp2:pasture",
  adjust: "mp2:adjust",
  orders: "mp2:orders",
  musters: "mp2:musters",
  marking: "mp2:marking",
  weaning: "mp2:weaning",
  pregtest: "mp2:pregtest",
  pdkuse: "mp2:pdkuse",
  shearing: "mp2:shearing",
  woolsale: "mp2:woolsale",
  menu: "mp2:menu",
  audit: "mp2:audit",
  settings: "mp2:settings-v5",
};

const DEFAULT_PROPERTIES = ["Minto", "Linleigh", "Dunbar", "Buckanbe", "Wirrealpa", "Innaminka", "Magenta"];

const DEFAULT_BREEDS = ["Merino", "XB", "Dorper", "Dorset", "Ultra", "Angus", "F1", "Hereford", "Composite"];
const DEFAULT_TAGS = [
  "Black tag",
  "White tag",
  "Orange tag",
  "Light green tag",
  "Purple tag",
  "Yellow tag",
  "Red tag",
  "Sky blue tag",
  "Blue tag",
];
const DEFAULT_TEAM = [
  "Chris — GM",
  "Linton — Contract Operations Manager",
  "Gwen — Office",
  "Mick — Buckanbe (Tilpa)",
  "Tina — Buckanbe (Tilpa)",
  "Benny — Minto",
  "Jamie — Minto",
  "Judd — Minto",
  "Tim — Wirrealpa (SA)",
  "Soph — Wirrealpa (SA)",
];
const DEFAULT_CONTRACTORS = [];

const DEFAULT_STATUSES = {
  Sheep: ["Early", "Late", "Twins", "Singles", "Wet", "Dry", "Empty", "PTE", "Lambed", "Stud", "Ewes", "Rams", "MS"],
  Cattle: ["PTIC", "PTE", "CAF", "MA", "Store", "Stud", "Heifers", "Bulls", "MS"],
};

// Tag colour = birth year (Minto cycle, same for sheep and cattle):
// orange = 2026 drop, white = 2025, and so on back. Blue = sky blue = 2023.
const TAG_YEAR = {
  "Blue tag": 2023,
  "Light green tag": 2019,
  "Purple tag": 2020,
  "Yellow tag": 2021,
  "Red tag": 2022,
  "Sky blue tag": 2023,
  "Black tag": 2024,
  "White tag": 2025,
  "Orange tag": 2026,
};
// Home-page summary groups
const CLASS_GROUP = {
  Cows: "Cows",
  "Cows & calves": "Cows",
  "Store cows": "Cows",
  Heifers: "Young cattle",
  Steers: "Young cattle",
  "Weaner heifers": "Young cattle",
  "Weaner steers": "Young cattle",
  "Stud Angus cows": "Cows",
  "Stud Angus heifers": "Young cattle",
  "Stud Angus bull calves": "Young cattle",
  "Stud Angus heifer calves": "Young cattle",
  Calves: "Calves at foot",
  Bulls: "Bulls",
  "Ewes – twins": "Ewes",
  "Ewes – singles": "Ewes",
  "Ewes & lambs": "Ewes",
  "Breeding ewes": "Ewes",
  "Sale ewes": "Ewes",
  "Dry sheep": "Ewes",
  Lambs: "Lambs at foot",
  "Ewe lambs": "Young sheep",
  "Wether lambs": "Young sheep",
  "Weaner lambs": "Young sheep",
  "Stud ultra ewes": "Ewes",
  "Stud ultra ewe lambs": "Young sheep",
  "Stud ultra ram lambs": "Young sheep",
  Fattening: "Young sheep",
  Backgrounding: "Young sheep",
  Rams: "Rams",
};
const groupFor = (m) => CLASS_GROUP[m.cls] || (m.species === "Cattle" ? "Other cattle" : "Other sheep");

const BUILD = 78;
const PREVIEW = false; // LIVE: records persist
// Permanent baseline: 3 Aug 2026 05:28 export — Magenta descriptions completed (breeds, M/A + multi tags, MS)
const BASELINE = {"exported": "2026-08-03T05:28:40.536Z", "build": 76, "mobs": [{"id": "t6fceo3msci9iau", "property": "Magenta", "paddock": "LD \u2013 Henry's", "species": "Cattle", "cls": "Heifers", "head": 150, "breed": "Angus", "tag": "Black tag", "status": "Heifers", "origin": "", "name": "", "notes": "", "createdAt": 1785717786342}, {"id": "nz9q2aqmsci70rw", "property": "Magenta", "paddock": "LD \u2013 Maggies", "species": "Cattle", "cls": "Heifers", "head": 48, "breed": "Angus", "tag": "Black tag", "status": "Heifers", "origin": "", "name": "", "notes": "", "createdAt": 1785717670316}, {"id": "naauitcmschyyxg", "property": "Magenta", "paddock": "LD \u2013 Big Iona", "species": "Sheep", "cls": "Wether lambs", "head": 526, "breed": "Dorper", "tag": "White + Orange tag", "status": "", "origin": "buckanbe", "name": "", "notes": "Weaned ex Ewes & lambs \u00b7 Late", "createdAt": 1785717294676}, {"id": "igpz3pbmschy2sr", "property": "Magenta", "paddock": "LD \u2013 Maggies", "species": "Cattle", "cls": "Heifers", "head": 96, "breed": "Angus", "tag": "Black tag", "status": "Heifers", "origin": "", "name": "", "notes": "", "createdAt": 1785717253035}, {"id": "hfwj5hjmschxhui", "property": "Magenta", "paddock": "HV \u2013 The Pines", "species": "Cattle", "cls": "Heifers", "head": 150, "breed": "Angus", "tag": "Black tag", "status": "Heifers", "origin": "", "name": "", "notes": "", "createdAt": 1785717225882}, {"id": "126ag5ymschwho5", "property": "Magenta", "paddock": "LD \u2013 Big Iona", "species": "Cattle", "cls": "Steers", "head": 37, "breed": "Angus", "tag": "Black tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1785717178997}, {"id": "8yy17homs2m52l9", "property": "Buckanbe", "paddock": "Billabong (House / Mootinara)", "species": "Sheep", "cls": "Ewes & lambs", "head": 874, "breed": "", "tag": "", "status": "", "origin": "", "name": "", "notes": "Ewes & weaners", "createdAt": 1785119636061}, {"id": "uxsh0u1ms2lodkc", "property": "Buckanbe", "paddock": "Billabong (House / Mootinara)", "species": "Cattle", "cls": "Heifers", "head": 156, "breed": "", "tag": "Black tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1785118857132}, {"id": "msnhwdrms2llmd1", "property": "Buckanbe", "paddock": "Billabong (House / Mootinara)", "species": "Cattle", "cls": "Steers", "head": 151, "breed": "", "tag": "Black tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1785118728565}, {"id": "gioau0qms2kn3kj", "property": "Buckanbe", "paddock": "Airstrip Pdk", "species": "Sheep", "cls": "Lambs", "head": 289, "breed": "Dorset", "tag": "Orange tag", "status": "Rams", "origin": "", "name": "", "notes": "At foot with Merino \u00b7 Breeding ewes \u00b7 Terminal", "createdAt": 1785117117908}, {"id": "nvdfb1jms2kh4yh", "property": "Buckanbe", "paddock": "Wygilla Pdk", "species": "Sheep", "cls": "Ewe lambs", "head": 1287, "breed": "", "tag": "", "status": "", "origin": "", "name": "", "notes": "Weaned ex Ewes & lambs", "createdAt": 1785116839769}, {"id": "85vwqnmms2d3v3x", "property": "Buckanbe", "paddock": "Calcaric Pdk", "species": "Sheep", "cls": "Ewes & lambs", "head": 951, "breed": "", "tag": "", "status": "", "origin": "", "name": "", "notes": "Ewes & weaners", "createdAt": 1785104463165}, {"id": "fntzq2bms2cxp90", "property": "Magenta", "paddock": "MG \u2013 Woolshed", "species": "Sheep", "cls": "Lambs", "head": 1865, "breed": "Dorset", "tag": "Orange tag", "status": "Rams", "origin": "", "name": "", "notes": "At foot with Breeding ewes \u00b7 Late \u00b7 Terminal", "createdAt": 1785104175636}, {"id": "riwrl3xms2ci5yn", "property": "Magenta", "paddock": "MG \u2013 Williams", "species": "Sheep", "cls": "Lambs", "head": 33, "breed": "Merino", "tag": "Orange tag", "status": "Rams", "origin": "", "name": "", "notes": "At foot with Merino \u00b7 Yellow tag \u00b7 Ewes & lambs \u00b7 Early \u00b7 Terminal", "createdAt": 1785103450799}, {"id": "b8p5pvoms2c7icc", "property": "Magenta", "paddock": "HV \u2013 South Mac", "species": "Sheep", "cls": "Lambs", "head": 157, "breed": "Dorset", "tag": "Orange tag", "status": "MS", "origin": "", "name": "", "notes": "At foot with Breeding ewes \u00b7 Late \u00b7 Terminal", "createdAt": 1785102953628}, {"breed": "Merino", "tag": "White tag", "cls": "Ewe lambs", "status": "Ewes", "origin": "", "species": "Sheep", "head": 774, "property": "Magenta", "paddock": "HV \u2013 Box Tree Pdk", "notes": "", "name": "", "id": "clirbl6mrofp3qc", "createdAt": 1784262286884}, {"id": "ovqhpy9mro7iedx", "property": "Minto", "paddock": "Bullock", "species": "Sheep", "cls": "Weaner lambs", "head": 554, "breed": "Dorper", "tag": "White tag", "status": "", "origin": "", "name": "", "notes": "Corrected\u00a0 was in Cows column on sheet", "createdAt": 1784248537173}, {"id": "jrw1licmro7gxe3", "property": "Minto", "paddock": "Tolmie", "species": "Sheep", "cls": "Weaner lambs", "head": 98, "breed": "Dorper", "tag": "White tag", "status": "", "origin": "", "name": "", "notes": "Corrected\u00a0 was in Cows column on sheet", "createdAt": 1784248468491}, {"id": "u2bk376mro6u7py", "property": "Linleigh", "paddock": "Micks Front", "species": "Sheep", "cls": "Weaner lambs", "head": 88, "breed": "Dorper", "tag": "White tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784247408790}, {"id": "ne18l0qmrn4whw6", "property": "Magenta", "paddock": "LD \u2013 North Carrawatha", "species": "Cattle", "cls": "Heifers", "head": 590, "breed": "Angus", "tag": "White tag", "status": "Heifers", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "oype57tmrn4whw6", "property": "Magenta", "paddock": "HV \u2013 Well Pdk", "species": "Cattle", "cls": "Steers", "head": 112, "breed": "Angus", "tag": "White tag", "status": "", "origin": "mansfield", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "7e6oz3mmrn4whw6", "property": "Magenta", "paddock": "LD \u2013 LBJ", "species": "Sheep", "cls": "Ewes & lambs", "head": 158, "breed": "Merino", "tag": "M/A", "status": "Wet", "origin": "", "name": "", "notes": "Wets & PTE light ewes", "createdAt": 1784183689878}, {"id": "1qvbzo0mrn4whw6", "property": "Magenta", "paddock": "LD \u2013 LBJ", "species": "Sheep", "cls": "Lambs", "head": 101, "breed": "Dorset", "tag": "Orange tag", "status": "", "origin": "", "name": "", "notes": "At foot", "createdAt": 1784183689878}, {"id": "8j8ocq3mrn4whw6", "property": "Magenta", "paddock": "LD \u2013 DT's", "species": "Sheep", "cls": "Ewes & lambs", "head": 200, "breed": "Merino", "tag": "Red tag", "status": "Early", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "riscxoomrn4whw6", "property": "Magenta", "paddock": "HV \u2013 The Pines", "species": "Sheep", "cls": "Dry sheep", "head": 396, "breed": "Merino", "tag": "Blue tag", "status": "Empty", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "s5neb84mrn4whw6", "property": "Magenta", "paddock": "LD \u2013 LBJ", "species": "Sheep", "cls": "Ewes & lambs", "head": 194, "breed": "Merino", "tag": "Red tag", "status": "Early", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "nefwprimrn4whw6", "property": "Magenta", "paddock": "LD \u2013 LBJ", "species": "Sheep", "cls": "Lambs", "head": 256, "breed": "Dorset", "tag": "Orange tag", "status": "", "origin": "", "name": "", "notes": "At foot", "createdAt": 1784183689878}, {"id": "ixcder8mrn4whw6", "property": "Magenta", "paddock": "LD \u2013 Middle", "species": "Sheep", "cls": "Ewes\u00a0 twins", "head": 200, "breed": "Merino", "tag": "Red tag", "status": "Early", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "h0jd5gnmrn4whw6", "property": "Magenta", "paddock": "LD \u2013 Three Mile", "species": "Sheep", "cls": "Ewes & lambs", "head": 710, "breed": "Merino", "tag": "Yellow tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "s55z6j3mrn4whw6", "property": "Magenta", "paddock": "LD \u2013 Three Mile", "species": "Sheep", "cls": "Lambs", "head": 903, "breed": "Dorset", "tag": "Orange tag", "status": "", "origin": "", "name": "", "notes": "At foot", "createdAt": 1784183689878}, {"id": "vemh0mamrn4whw6", "property": "Magenta", "paddock": "LD \u2013 Youl Plain", "species": "Sheep", "cls": "Ewes & lambs", "head": 288, "breed": "Merino", "tag": "Red tag", "status": "Early", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "1t0buy9mrn4whw6", "property": "Magenta", "paddock": "LD \u2013 Youl Plain", "species": "Sheep", "cls": "Lambs", "head": 395, "breed": "Dorset", "tag": "Orange tag", "status": "", "origin": "", "name": "", "notes": "At foot", "createdAt": 1784183689878}, {"id": "xmda988mrn4whw6", "property": "Magenta", "paddock": "HV \u2013 North Mac", "species": "Sheep", "cls": "Breeding ewes", "head": 790, "breed": "Merino", "tag": "Blue tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "lcnlapnmrn4whw6", "property": "Magenta", "paddock": "HV \u2013 South Mac", "species": "Sheep", "cls": "Breeding ewes", "head": 133, "breed": "Merino", "tag": "Blue tag", "status": "Late", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "a4eothfmrn4whw6", "property": "Magenta", "paddock": "HV \u2013 The Pines", "species": "Sheep", "cls": "Dry sheep", "head": 382, "breed": "Merino", "tag": "Blue tag", "status": "Dry", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "l7l1jemmrn4whw6", "property": "Magenta", "paddock": "HV \u2013 Well Pdk", "species": "Sheep", "cls": "Ewes & lambs", "head": 435, "breed": "Merino", "tag": "Blue tag", "status": "Early", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "lyvukuwmrn4whw6", "property": "Magenta", "paddock": "HV \u2013 Well Pdk", "species": "Sheep", "cls": "Lambs", "head": 586, "breed": "Dorset", "tag": "Orange tag", "status": "", "origin": "", "name": "", "notes": "At foot", "createdAt": 1784183689878}, {"id": "6ontwt4mrn4whw6", "property": "Magenta", "paddock": "MG \u2013 Woolshed", "species": "Sheep", "cls": "Breeding ewes", "head": 350, "breed": "Merino", "tag": "M/A", "status": "Late", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "84ivuw7mrn4whw6", "property": "Magenta", "paddock": "MG \u2013 Woolshed", "species": "Sheep", "cls": "Breeding ewes", "head": 594, "breed": "Merino", "tag": "M/A", "status": "Late", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "fncmq9bmrn4whw6", "property": "Magenta", "paddock": "MG \u2013 Kirks", "species": "Sheep", "cls": "Breeding ewes", "head": 362, "breed": "Merino", "tag": "Black + Blue tag", "status": "", "origin": "", "name": "", "notes": "Young ewes to lamb", "createdAt": 1784183689878}, {"id": "00l77t3mrn4whw6", "property": "Magenta", "paddock": "MG \u2013 Woolshed", "species": "Sheep", "cls": "Breeding ewes", "head": 300, "breed": "Merino", "tag": "M/A", "status": "Late", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "8y3wzjymrn4whw6", "property": "Magenta", "paddock": "LD \u2013 Middle", "species": "Sheep", "cls": "Ewes & lambs", "head": 740, "breed": "Merino", "tag": "Red tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "yvfe02vmrn4whw6", "property": "Magenta", "paddock": "LD \u2013 Middle", "species": "Sheep", "cls": "Lambs", "head": 927, "breed": "Dorset", "tag": "Orange tag", "status": "", "origin": "", "name": "", "notes": "At foot", "createdAt": 1784183689878}, {"id": "y6ads19mrn4whw6", "property": "Magenta", "paddock": "MG \u2013 Williams", "species": "Sheep", "cls": "Ewes & lambs", "head": 1020, "breed": "Merino", "tag": "Yellow tag", "status": "Early", "origin": "", "name": "", "notes": "Incl. young ewes", "createdAt": 1784183689878}, {"id": "eeqd7lxmrn4whw6", "property": "Magenta", "paddock": "MG \u2013 Williams", "species": "Sheep", "cls": "Lambs", "head": 1010, "breed": "Merino", "tag": "Orange tag", "status": "", "origin": "", "name": "", "notes": "At foot", "createdAt": 1784183689878}, {"id": "cux763kmrn4whw6", "property": "Magenta", "paddock": "MG \u2013 Woolshed", "species": "Sheep", "cls": "Breeding ewes", "head": 350, "breed": "Merino", "tag": "M/A", "status": "Late", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "s59hxlsmrn4whw6", "property": "Buckanbe", "paddock": "Airstrip Pdk", "species": "Sheep", "cls": "Breeding ewes", "head": 280, "breed": "Merino", "tag": "", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "7yodf79mrn4whw6", "property": "Buckanbe", "paddock": "Jack's Hut / Mingara Pdk", "species": "Sheep", "cls": "Wether lambs", "head": 3881, "breed": "", "tag": "White tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "gym1zdmmrn4whw6", "property": "Buckanbe", "paddock": "Two Mile Pdk", "species": "Cattle", "cls": "Cows", "head": 155, "breed": "Angus", "tag": "Blue tag", "status": "", "origin": "Mansfield", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "5bpxcopmrn4whw6", "property": "Buckanbe", "paddock": "Two Mile Pdk", "species": "Cattle", "cls": "Heifers", "head": 108, "breed": "", "tag": "", "status": "", "origin": "Mungindi", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "u7ss2enmrn4whw6", "property": "Buckanbe", "paddock": "Two Mile Pdk", "species": "Cattle", "cls": "Calves", "head": 234, "breed": "F1", "tag": "", "status": "", "origin": "QLD", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "tx47tuhmrn4whw6", "property": "Buckanbe", "paddock": "Calcaric Pdk", "species": "Sheep", "cls": "Ewes & lambs", "head": 1442, "breed": "", "tag": "", "status": "Late", "origin": "", "name": "", "notes": "Lates / wets / little lambs", "createdAt": 1784183689878}, {"id": "zkxm6mqmrn4whw6", "property": "Buckanbe", "paddock": "Horse Pdk", "species": "Sheep", "cls": "Ewes & lambs", "head": 582, "breed": "", "tag": "", "status": "", "origin": "", "name": "", "notes": "Ewes & weaners", "createdAt": 1784183689878}, {"id": "7etpfzxmrn4whw6", "property": "Buckanbe", "paddock": "Andy's Pdk", "species": "Sheep", "cls": "Breeding ewes", "head": 1533, "breed": "", "tag": "", "status": "Early", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "ptg2fflmrn4whw6", "property": "Buckanbe", "paddock": "Sandridge Pdk", "species": "Sheep", "cls": "Ewe lambs", "head": 2136, "breed": "Dorper", "tag": "White tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "fwmf30fmrn4whw6", "property": "Buckanbe", "paddock": "Sandridge Pdk", "species": "Cattle", "cls": "Cows", "head": 183, "breed": "F1", "tag": "", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "gcd70vumrn4whw6", "property": "Buckanbe", "paddock": "River Pdk", "species": "Cattle", "cls": "Cows & calves", "head": 78, "breed": "F1", "tag": "", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "kkeslttmrn4whw6", "property": "Buckanbe", "paddock": "River Pdk", "species": "Cattle", "cls": "Calves", "head": 78, "breed": "F1", "tag": "", "status": "", "origin": "", "name": "", "notes": "At foot", "createdAt": 1784183689878}, {"id": "2weds69mrn4whw6", "property": "Wirrealpa", "paddock": "10 Mile", "species": "Sheep", "cls": "Ewe lambs", "head": 1755, "breed": "", "tag": "White tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "4i503rimrn4whw6", "property": "Wirrealpa", "paddock": "13 Mile", "species": "Sheep", "cls": "Breeding ewes", "head": 6135, "breed": "", "tag": "", "status": "MA", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "wedwlf0mrn4whw6", "property": "Wirrealpa", "paddock": "7 Mile", "species": "Cattle", "cls": "Cows & calves", "head": 58, "breed": "", "tag": "", "status": "CAF", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "a8ejc51mrn4whw6", "property": "Wirrealpa", "paddock": "Emu", "species": "Cattle", "cls": "Cows", "head": 245, "breed": "", "tag": "", "status": "MA", "origin": "", "name": "", "notes": "Corrected\u00a0 was in Steers column on sheet", "createdAt": 1784183689878}, {"id": "m0cjm5umrn4whw6", "property": "Wirrealpa", "paddock": "Top Woolshed", "species": "Cattle", "cls": "Heifers", "head": 137, "breed": "", "tag": "", "status": "", "origin": "Walcha / Inverell", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "xcqe2izmrn4whw6", "property": "Wirrealpa", "paddock": "Trigg", "species": "Cattle", "cls": "Heifers", "head": 358, "breed": "", "tag": "Blue tag", "status": "PTIC", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "csdc9wxmrn4whw6", "property": "Wirrealpa", "paddock": "Walcoola", "species": "Cattle", "cls": "Steers", "head": 367, "breed": "", "tag": "", "status": "", "origin": "Mansfield", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "1zuv460mrn4whw6", "property": "Wirrealpa", "paddock": "Watkins", "species": "Cattle", "cls": "Steers", "head": 366, "breed": "", "tag": "", "status": "", "origin": "Braidwood / Walcha / Inverell", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "wb8bhhwmrn4whw6", "property": "Dunbar", "paddock": "Swimming Hole", "species": "Cattle", "cls": "Cows", "head": 20, "breed": "", "tag": "", "status": "PTE", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "8mtdybamrn4whw6", "property": "Dunbar", "paddock": "Flat East", "species": "Cattle", "cls": "Cows", "head": 40, "breed": "", "tag": "", "status": "PTE", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "4urwvd1mrn4whw6", "property": "Dunbar", "paddock": "Fox Hill Flat", "species": "Cattle", "cls": "Cows", "head": 40, "breed": "", "tag": "", "status": "PTE", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "1fynwdmmrn4whw6", "property": "Dunbar", "paddock": "Fox Hill Flat 2", "species": "Cattle", "cls": "Cows", "head": 40, "breed": "", "tag": "", "status": "PTE", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "x1ld10wmrn4whw6", "property": "Dunbar", "paddock": "Mckenzie Flat", "species": "Cattle", "cls": "Cows", "head": 40, "breed": "", "tag": "", "status": "PTE", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "lh8dcndmrn4whw6", "property": "Dunbar", "paddock": "Mckenzie Flat 2", "species": "Cattle", "cls": "Cows", "head": 40, "breed": "", "tag": "", "status": "PTE", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "4oc4ejsmrn4whw6", "property": "Dunbar", "paddock": "McNairns", "species": "Cattle", "cls": "Cows", "head": 40, "breed": "", "tag": "", "status": "PTE", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "2nj5sy8mrn4whw6", "property": "Dunbar", "paddock": "Argyle East", "species": "Cattle", "cls": "Cows", "head": 14, "breed": "", "tag": "", "status": "PTE", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "31w8kn8mrn4whw6", "property": "Dunbar", "paddock": "Fox Hill", "species": "Cattle", "cls": "Store cows", "head": 140, "breed": "", "tag": "", "status": "Store", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "y6sbifjmrn4whw6", "property": "Dunbar", "paddock": "Bungalow South", "species": "Cattle", "cls": "Steers", "head": 30, "breed": "", "tag": "Black tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "5jpnppumrn4whw6", "property": "Dunbar", "paddock": "McKenzie South", "species": "Cattle", "cls": "Steers", "head": 40, "breed": "", "tag": "Black tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "u3gncp4mrn4whw6", "property": "Dunbar", "paddock": "McKenzie Middle", "species": "Cattle", "cls": "Steers", "head": 38, "breed": "", "tag": "Black tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "r4sg0limrn4whw6", "property": "Dunbar", "paddock": "Hay Paddock", "species": "Cattle", "cls": "Steers", "head": 20, "breed": "", "tag": "Black tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "ajs7vcemrn4whw6", "property": "Minto", "paddock": "Mint", "species": "Cattle", "cls": "Steers", "head": 98, "breed": "", "tag": "", "status": "", "origin": "", "name": "", "notes": "3rds", "createdAt": 1784183689878}, {"id": "gh3dh9mmrn4whw6", "property": "Minto", "paddock": "Shady", "species": "Cattle", "cls": "", "head": 40, "breed": "", "tag": "", "status": "", "origin": "", "name": "Kids' cattle", "notes": "", "createdAt": 1784183689878}, {"id": "kscb7l0mrn4whw6", "property": "Minto", "paddock": "Eagle", "species": "Sheep", "cls": "Breeding ewes", "head": 182, "breed": "", "tag": "", "status": "Late", "origin": "", "name": "", "notes": "Late ultras", "createdAt": 1784183689878}, {"id": "t3h1fiqmrn4whw6", "property": "Minto", "paddock": "Delta", "species": "Sheep", "cls": "Stud ultra ewe lambs", "head": 47, "breed": "", "tag": "White tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "f0d5wrlmrn4whw6", "property": "Minto", "paddock": "Delta", "species": "Cattle", "cls": "Stud Angus heifers", "head": 32, "breed": "", "tag": "", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "wmmizo9mrn4whw6", "property": "Minto", "paddock": "Upper Osbourne", "species": "Sheep", "cls": "Stud ultra ewes", "head": 236, "breed": "", "tag": "", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "7qap1xlmrn4whw6", "property": "Minto", "paddock": "Upper Osbourne", "species": "Sheep", "cls": "Lambs", "head": 115, "breed": "Ultra", "tag": "Orange tag", "status": "Ewes", "origin": "", "name": "", "notes": "Stud\u00a0 at foot with stud ultra ewes", "createdAt": 1784183689878}, {"id": "7ugxsyimrn4whw6", "property": "Minto", "paddock": "Upper Osbourne", "species": "Sheep", "cls": "Lambs", "head": 109, "breed": "Ultra", "tag": "Orange tag", "status": "Rams", "origin": "", "name": "", "notes": "Stud\u00a0 at foot with stud ultra ewes", "createdAt": 1784183689878}, {"id": "58h5birmrn4whw6", "property": "Minto", "paddock": "Spring", "species": "Sheep", "cls": "Weaner lambs", "head": 18, "breed": "Dorper", "tag": "White tag", "status": "", "origin": "", "name": "", "notes": "Corrected\u00a0 was in Cows column on sheet", "createdAt": 1784183689878}, {"id": "h15r34xmrn4whw6", "property": "Minto", "paddock": "Back", "species": "Cattle", "cls": "Stud Angus cows", "head": 60, "breed": "", "tag": "", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "66w8heamrn4whw6", "property": "Linleigh", "paddock": "Micks South", "species": "Cattle", "cls": "Store cows", "head": 63, "breed": "", "tag": "", "status": "Store", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "s93ppx2mrn4whw6", "property": "Linleigh", "paddock": "Centre North", "species": "Sheep", "cls": "Weaner lambs", "head": 617, "breed": "Dorper", "tag": "White tag", "status": "", "origin": "", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "rg1z2fnmrn4whw6", "property": "Innaminka", "paddock": "Agistment country", "species": "Cattle", "cls": "Heifers", "head": 218, "breed": "F1", "tag": "White tag", "status": "Store", "origin": "Buckanbe", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "11p2foqmrn4whw6", "property": "Innaminka", "paddock": "Agistment country", "species": "Cattle", "cls": "Steers", "head": 182, "breed": "F1", "tag": "White tag", "status": "Store", "origin": "Buckanbe", "name": "", "notes": "", "createdAt": 1784183689878}, {"id": "9n1p5lrmrn4whw6", "property": "Innaminka", "paddock": "Agistment country", "species": "Cattle", "cls": "Steers", "head": 265, "breed": "F1", "tag": "White tag", "status": "Store", "origin": "Dalby / Roma", "name": "", "notes": "Some orange tag", "createdAt": 1784183689878}, {"id": "lq3qm66mrn4whw6", "property": "Innaminka", "paddock": "Agistment country", "species": "Cattle", "cls": "Heifers", "head": 120, "breed": "F1", "tag": "White tag", "status": "Store", "origin": "Dalby / Roma", "name": "", "notes": "Some orange tag", "createdAt": 1784183689878}, {"id": "ocyhbyhmrn4whw6", "property": "Innaminka", "paddock": "Agistment country", "species": "Cattle", "cls": "Steers", "head": 347, "breed": "F1", "tag": "White tag", "status": "Store", "origin": "SLM Cunnamulla", "name": "", "notes": "", "createdAt": 1784183689878}], "moves": [{"date": "2026-08-03", "mobId": "hfwj5hjmschxhui", "toPaddock": "HV \u2013 The Pines", "id": "qoztnpqmsci9xc8", "createdAt": 1785717805832, "fromPaddock": "LD \u2013 Big Iona", "mobName": "Black tag \u00b7 Heifers", "property": "Magenta"}, {"date": "2026-08-03", "mobId": "hfwj5hjmschxhui", "toPaddock": "LD \u2013 Henry's", "head": "150", "id": "ihytsg4msci9iau", "createdAt": 1785717786342, "fromPaddock": "LD \u2013 Big Iona", "mobName": "Black tag \u00b7 Heifers", "property": "Magenta", "split": true}, {"date": "2026-08-03", "mobId": "hfwj5hjmschxhui", "head": "48", "toPaddock": "LD \u2013 Maggies", "id": "6amiq9xmsci8tec", "createdAt": 1785717754068, "fromPaddock": "LD \u2013 Big Iona", "mobName": "Black tag \u00b7 Heifers", "property": "Magenta", "split": true}, {"date": "2026-08-03", "mobId": "igpz3pbmschy2sr", "toPaddock": "LD \u2013 Maggies", "id": "k49hgnnmsci5jar", "createdAt": 1785717601011, "fromPaddock": "LD \u2013 Big Iona", "mobName": "Heifers", "property": "Magenta"}, {"date": "2026-08-03", "mobId": "126ag5ymschwho5", "toPaddock": "LD \u2013 Big Iona", "id": "28zsvctmsci1yza", "createdAt": 1785717434710, "fromPaddock": "Inbox", "mobName": "Black tag \u00b7 Steers", "property": "Magenta"}, {"date": "2026-08-03", "mobId": "hfwj5hjmschxhui", "toPaddock": "LD \u2013 Big Iona", "id": "wfp05wmmsci1o6b", "createdAt": 1785717420707, "fromPaddock": "Inbox", "mobName": "Black tag \u00b7 Heifers", "property": "Magenta"}, {"date": "2026-08-03", "mobId": "igpz3pbmschy2sr", "toPaddock": "LD \u2013 Big Iona", "id": "10ktjw9msci1f5y", "createdAt": 1785717409030, "fromPaddock": "Inbox", "mobName": "Heifers", "property": "Magenta"}, {"date": "2026-08-03", "mobId": "naauitcmschyyxg", "toPaddock": "LD \u2013 Big Iona", "id": "j99pbubmsci0vcz", "createdAt": 1785717383363, "fromPaddock": "Inbox", "mobName": "Wether lambs", "property": "Magenta"}, {"date": "2026-07-27", "mobId": "ahptiyhmrn4whw6", "head": "96", "toPaddock": "Horse Pdk", "notes": "magenta heifers", "id": "pa9tks9ms2lru17", "createdAt": 1785119018443, "fromPaddock": "Jack's Hut / Mingara Pdk", "mobName": "Heifers", "property": "Buckanbe", "split": true}, {"date": "2026-07-27", "mobId": "swb8y0bmrn4whw6", "toPaddock": "Horse Pdk", "notes": "TO Magenta", "id": "2fqkw52ms2lpbp0", "createdAt": 1785118901364, "fromPaddock": "Jack's Hut / Mingara Pdk", "mobName": "Black tag \u00b7 Heifers", "property": "Buckanbe"}, {"date": "2026-07-27", "mobId": "swb8y0bmrn4whw6", "head": "156", "toPaddock": "Billabong (House / Mootinara)", "notes": "PG", "id": "k68pmw1ms2lodkc", "createdAt": 1785118857132, "fromPaddock": "Jack's Hut / Mingara Pdk", "mobName": "Black tag \u00b7 Heifers", "property": "Buckanbe", "split": true}, {"date": "2026-07-27", "mobId": "0d9k4q6mrn4whw6", "head": "37", "toPaddock": "Horse Pdk", "notes": "to Magenta", "id": "ekhjagnms2lmew0", "createdAt": 1785118765536, "fromPaddock": "Andy's Pdk", "mobName": "Black tag \u00b7 Steers", "property": "Buckanbe", "split": true}, {"date": "2026-07-27", "mobId": "0d9k4q6mrn4whw6", "head": "151", "toPaddock": "Billabong (House / Mootinara)", "notes": "bovillis", "id": "dqp6f9ims2llmcz", "createdAt": 1785118728563, "fromPaddock": "Andy's Pdk", "mobName": "Black tag \u00b7 Steers", "property": "Buckanbe", "split": true}, {"date": "2026-07-27", "mobId": "ahptiyhmrn4whw6", "toPaddock": "Jack's Hut / Mingara Pdk", "id": "85e1l8ims2kx7q4", "createdAt": 1785117589852, "fromPaddock": "Wygilla Pdk", "mobName": "Heifers", "property": "Buckanbe"}, {"date": "2026-07-27", "mobId": "s59hxlsmrn4whw6", "toPaddock": "Airstrip Pdk", "id": "6y6161qms2kk3xa", "createdAt": 1785116978398, "fromPaddock": "Billabong (House / Mootinara)", "mobName": "Merino \u00b7 Breeding ewes", "property": "Buckanbe"}, {"date": "2026-07-27", "mobId": "zkxm6mqmrn4whw6", "toPaddock": "Horse Pdk", "id": "mk8gk3hms2ke6e9", "createdAt": 1785116701665, "fromPaddock": "Wygilla Pdk", "mobName": "Ewes & lambs", "property": "Buckanbe"}, {"date": "2026-07-26", "mobId": "s59hxlsmrn4whw6", "head": "280", "toPaddock": "Airstrip Pdk", "id": "r9dgapwms2esffv", "createdAt": 1785107288875, "fromPaddock": "Billabong (House / Mootinara)", "mobName": "Merino \u00b7 Breeding ewes", "property": "Buckanbe", "split": true}, {"date": "2026-07-26", "mobId": "s59hxlsmrn4whw6", "toPaddock": "Airstrip Pdk", "head": "1100", "id": "bh3fjrtms2en3f4", "createdAt": 1785107040016, "fromPaddock": "Billabong (House / Mootinara)", "mobName": "Merino \u00b7 Breeding ewes", "property": "Buckanbe", "split": true}, {"date": "2026-07-26", "mobId": "zkxm6mqmrn4whw6", "head": "874", "toPaddock": "Billabong (House / Mootinara)", "notes": "late lambbers", "id": "wqqa4zvms2ed5m0", "createdAt": 1785106576296, "fromPaddock": "Wygilla Pdk", "mobName": "Ewes & lambs", "property": "Buckanbe", "split": true}, {"date": "2026-07-26", "mobId": "zkxm6mqmrn4whw6", "head": "874", "toPaddock": "Billabong (House / Mootinara)", "id": "2dqqik5ms2dj3ww", "createdAt": 1785105174416, "fromPaddock": "Wygilla Pdk", "mobName": "Ewes & lambs", "property": "Buckanbe", "split": true}, {"date": "2026-07-26", "mobId": "zkxm6mqmrn4whw6", "head": "661", "toPaddock": "Calcaric Pdk", "id": "gm37e70ms2d3v3x", "createdAt": 1785104463165, "fromPaddock": "Wygilla Pdk", "mobName": "Ewes & lambs", "property": "Buckanbe", "split": true}, {"date": "2026-07-26", "mobId": "00l77t3mrn4whw6", "toPaddock": "MG \u2013 Woolshed", "id": "astggt2ms2csx9h", "createdAt": 1785103952741, "fromPaddock": "MG \u2013 Strip", "mobName": "Breeding ewes \u00b7 Late", "property": "Magenta"}, {"date": "2026-07-26", "mobId": "84ivuw7mrn4whw6", "toPaddock": "MG \u2013 Woolshed", "id": "p53eddkms2cskpm", "createdAt": 1785103936474, "fromPaddock": "MG \u2013 Front Sponge", "mobName": "Breeding ewes \u00b7 Late", "property": "Magenta"}, {"date": "2026-07-26", "mobId": "6ontwt4mrn4whw6", "toPaddock": "MG \u2013 Woolshed", "id": "oi37lwnms2croe5", "createdAt": 1785103894589, "fromPaddock": "MG \u2013 Back Sponge", "mobName": "Breeding ewes \u00b7 Late", "property": "Magenta"}, {"date": "2026-07-26", "mobId": "yvfe02vmrn4whw6", "toPaddock": "LD \u2013 Middle", "id": "akrzd7bms2cgbfs", "createdAt": 1785103364584, "fromPaddock": "MG \u2013 Tommies", "mobName": "Orange tag \u00b7 Lambs", "property": "Magenta"}, {"date": "2026-07-26", "mobId": "8y3wzjymrn4whw6", "toPaddock": "LD \u2013 Middle", "id": "oyziid3ms2cfydn", "createdAt": 1785103347659, "fromPaddock": "MG \u2013 Tommies", "mobName": "Red tag \u00b7 Ewes & lambs", "property": "Magenta"}, {"date": "2026-07-26", "mobId": "riscxoomrn4whw6", "toPaddock": "HV \u2013 The Pines", "id": "r79hzgwms2cenx1", "createdAt": 1785103287445, "fromPaddock": "LD \u2013 Henry's", "mobName": "Blue tag \u00b7 Dry sheep \u00b7 Empty", "property": "Magenta"}, {"date": "2026-07-26", "mobId": "1qvbzo0mrn4whw6", "toPaddock": "LD \u2013 LBJ", "notes": "jetted", "id": "2jdljoums2cdhzy", "createdAt": 1785103233118, "fromPaddock": "LD \u2013 D block", "mobName": "Orange tag \u00b7 Lambs", "property": "Magenta"}, {"date": "2026-07-26", "mobId": "7e6oz3mmrn4whw6", "toPaddock": "LD \u2013 LBJ", "notes": "jetted ", "id": "04by70nms2ccsvr", "createdAt": 1785103200567, "fromPaddock": "LD \u2013 D block", "mobName": "Ewes & lambs \u00b7 Wet", "property": "Magenta"}, {"date": "2026-07-17", "mobId": "h15r34xmrn4whw6", "toPaddock": "Back", "id": "0m6zvaxmroi9zel", "createdAt": 1784266620285, "fromPaddock": "Bullock", "mobName": "Stud Angus cows", "property": "Minto"}, {"date": "2026-07-08", "mobId": "58h5birmrn4whw6", "toPaddock": "Bullock", "head": "554", "id": "ry2pbdzmro7ebpw", "createdAt": 1784248347092, "fromPaddock": "Spring", "mobName": "Dorper\u00a0 White tag\u00a0 Weaner lambs", "property": "Minto", "split": true}, {"date": "2026-07-10", "mobId": "gh3dh9mmrn4whw6", "head": "40", "toPaddock": "Shady", "id": "t3dhshymro7boqb", "createdAt": 1784248223987, "fromPaddock": "Tolmie", "mobName": "Kids' cattle", "property": "Minto"}, {"date": "2026-07-08", "mobId": "58h5birmrn4whw6", "head": "98", "toPaddock": "Tolmie", "notes": "sale sheep wangarrtta abs", "id": "rbj9yebmro79x6o", "createdAt": 1784248141632, "fromPaddock": "Spring", "mobName": "Dorper\u00a0 White tag\u00a0 Weaner lambs", "property": "Minto", "split": true}, {"date": "2026-07-17", "mobId": "s93ppx2mrn4whw6", "head": "88", "toPaddock": "Micks Front", "notes": "wangaratta abs", "id": "2vxsux8mro6h3oa", "createdAt": 1784246797018, "fromPaddock": "Centre North", "mobName": "Dorper\u00a0 White tag\u00a0 Weaner lambs", "property": "Linleigh", "split": true}, {"date": "2026-07-16", "mobId": "h15r34xmrn4whw6", "toPaddock": "Bullock", "id": "j3vg3s4mrn66azg", "createdAt": 1784185827100, "fromPaddock": "Back", "mobName": "Stud Angus cows", "property": "Minto"}, {"date": "2026-07-16", "mobId": "h15r34xmrn4whw6", "toPaddock": "Bullock", "notes": "Due to calve early August ", "id": "2wcrns7mrn61jih", "createdAt": 1784185604873, "fromPaddock": "Back", "mobName": "Stud Angus cows", "property": "Minto"}], "health": [{"date": "2026-07-08", "mobId": "s93ppx2mrn4whw6", "product": "qdrench", "dose": "9ml", "whp": "28", "treatedBy": "judd and jack", "notes": "foot bathed sore ", "id": "25mlssrmro6kcb3", "createdAt": 1784246948175, "mobName": "Dorper\u00a0 White tag\u00a0 Weaner lambs", "property": "Linleigh", "whpClear": "2026-08-05"}], "rain": [{"date": "2026-07-13", "property": "Linleigh", "mm": "21", "notes": "thurles gauge ", "id": "pd2wqfzmro7ms49", "createdAt": 1784248741593}, {"date": "2026-07-02", "property": "Minto", "mm": "69", "id": "fk8heijmrn5u92z", "createdAt": 1784185264763}, {"date": "2026-07-02", "property": "Magenta", "mm": "64", "id": "55z1jeymrn5tdgd", "createdAt": 1784185223773}, {"date": "2026-07-16", "property": "Minto", "mm": "24", "id": "jmggmjbmrn5oo46", "createdAt": 1784185004310}], "trucking": [{"date": "2026-08-03", "loads": {"6f9xu51ms2ldahu": 526}, "ttype": "Property transfer", "fromProperty": "Buckanbe", "toProperty": "Magenta", "nlis": "Not yet recorded", "id": "zftu30xmschyyxg", "createdAt": 1785717294676, "head": 526, "mobName": "Wether lambs", "property": "Buckanbe", "species": "Sheep"}, {"date": "2026-08-03", "loads": {"38ozazsms2lru17": 96}, "ttype": "Property transfer", "fromProperty": "Buckanbe", "toProperty": "Magenta", "nlis": "Recorded on NLIS", "id": "u3s5lfmmschy2sr", "createdAt": 1785717253035, "head": 96, "mobName": "Heifers", "property": "Buckanbe", "species": "Cattle"}, {"date": "2026-08-03", "loads": {"swb8y0bmrn4whw6": 348}, "ttype": "Property transfer", "fromProperty": "Buckanbe", "toProperty": "Magenta", "nlis": "Recorded on NLIS", "id": "2ya6jjumschxhui", "createdAt": 1785717225882, "head": 348, "mobName": "Black tag \u00b7 Heifers", "property": "Buckanbe", "species": "Cattle"}, {"date": "2026-08-03", "loads": {"i5yoblams2lmew0": 37}, "ttype": "Property transfer", "fromProperty": "Buckanbe", "toProperty": "Magenta", "carrier": "Macallum", "nlis": "Recorded on NLIS", "id": "wb99deemschwho3", "createdAt": 1785717178995, "head": 37, "mobName": "Black tag \u00b7 Steers", "property": "Buckanbe", "species": "Cattle"}, {"date": "2026-07-27", "loads": {"s59hxlsmrn4whw6": "1103"}, "ttype": "Sale to market", "fromProperty": "Buckanbe", "destination": "wagga", "nlis": "Recorded on NLIS", "id": "b1gbru8ms2kisk8", "createdAt": 1785116917016, "head": 1103, "mobName": "Merino \u00b7 Breeding ewes", "property": "Buckanbe", "species": "Sheep"}, {"date": "2026-07-26", "loads": {"o4x0k83ms2eaiye": 265}, "ttype": "Sale to market", "fromProperty": "Buckanbe", "destination": "wagga", "nlis": "Recorded on NLIS", "id": "52jsahems2ebtxi", "createdAt": 1785106514502, "head": 265, "mobName": "Dry sheep \u00b7 PTE", "property": "Buckanbe", "species": "Sheep"}, {"id": "p641x3gmrn4vbtw", "createdAt": 1784183635364, "date": "2026-07-08", "ttype": "Sale to market", "property": "Dunbar", "mobName": "Black tag\u00a0 Steers", "species": "Cattle", "cls": "Steers", "head": 62, "destination": "Leongatha Sale Yards", "nlis": "Recorded on NLIS", "notes": "Via saleyard"}, {"id": "1phmlcdmrn4vbtw", "createdAt": 1784183635364, "date": "2026-07-08", "ttype": "Sale to market", "property": "Dunbar", "mobName": "Cows\u00a0 PTE", "species": "Cattle", "cls": "Cows", "head": 60, "destination": "Leongatha Sale Yards", "nlis": "Recorded on NLIS", "notes": "Via saleyard"}], "maint": [{"date": "2026-07-16", "property": "Minto", "asset": "Case Tractor", "work": "fix bucket", "doneBy": "Jamie", "id": "qtzkxj6mrn5f1kl", "createdAt": 1784184555189}], "pasture": [], "adjust": [{"date": "2026-07-27", "mobId": "zkxm6mqmrn4whw6", "reason": "Mismustered / missing", "head": "582", "id": "12xt0u3ms2m6qbp", "createdAt": 1785119713477, "mobName": "Ewes & lambs", "property": "Buckanbe", "cls": "Ewes & lambs", "species": "Sheep", "delta": -582}, {"date": "2026-07-27", "mobId": "ahptiyhmrn4whw6", "reason": "Mismustered / missing", "head": "65", "id": "h482vtems2lsng6", "createdAt": 1785119056566, "mobName": "Heifers", "property": "Buckanbe", "cls": "Heifers", "species": "Cattle", "delta": -65}, {"date": "2026-07-27", "mobId": "0d9k4q6mrn4whw6", "reason": "Mismustered / missing", "head": "62", "id": "tlciwoums2lms4g", "createdAt": 1785118782688, "mobName": "Black tag \u00b7 Steers", "property": "Buckanbe", "cls": "Steers", "species": "Cattle", "delta": -62}, {"date": "2026-07-27", "mobId": "s59hxlsmrn4whw6", "reason": "Deaths", "head": "17", "id": "oa8jwbxms2kjp8c", "createdAt": 1785116959356, "mobName": "Merino \u00b7 Breeding ewes", "property": "Buckanbe", "cls": "Breeding ewes", "species": "Sheep", "delta": -17}, {"date": "2026-07-26", "mobId": "s55z6j3mrn4whw6", "reason": "Found", "head": "6", "id": "h114uk4ms2cz1vp", "createdAt": 1785104238661, "mobName": "XB \u00b7 Orange tag \u00b7 Lambs", "property": "Magenta", "cls": "Lambs", "species": "Sheep", "delta": 6}, {"date": "2026-07-26", "mobId": "84ivuw7mrn4whw6", "reason": "Mismustered / missing", "head": "156", "id": "085lni3ms2cwl0t", "createdAt": 1785104123501, "mobName": "Breeding ewes \u00b7 Late", "property": "Magenta", "cls": "Breeding ewes", "species": "Sheep", "delta": -156}, {"date": "2026-07-26", "mobId": "yvfe02vmrn4whw6", "reason": "Found", "head": "17", "id": "u29p2lkms2cnv1a", "createdAt": 1785103716574, "mobName": "Orange tag \u00b7 Lambs", "property": "Magenta", "cls": "Lambs", "species": "Sheep", "delta": 17}, {"date": "2026-07-26", "mobId": "lyvukuwmrn4whw6", "reason": "Found", "head": "56", "id": "8tousphms2ckunb", "createdAt": 1785103576103, "mobName": "Orange tag \u00b7 Lambs", "property": "Magenta", "cls": "Lambs", "species": "Sheep", "delta": 56}, {"date": "2026-07-26", "mobId": "lcnlapnmrn4whw6", "reason": "Mismustered / missing", "head": "9", "id": "6vl1ih7ms2cab27", "createdAt": 1785103084159, "mobName": "Breeding ewes \u00b7 Late", "property": "Magenta", "cls": "Breeding ewes", "species": "Sheep", "delta": -9}, {"date": "2026-07-26", "mobId": "clirbl6mrofp3qc", "reason": "Mismustered / missing", "head": "26", "id": "228q486ms2c98wx", "createdAt": 1785103034721, "mobName": "Merino \u00b7 White tag \u00b7 Ewe lambs \u00b7 Ewes", "property": "Magenta", "cls": "Ewe lambs", "species": "Sheep", "delta": -26}, {"date": "2026-07-17", "mobId": "58h5birmrn4whw6", "reason": "Mismustered / missing", "head": "18", "id": "xy1bgfamro7lxkx", "createdAt": 1784248702017, "mobName": "Dorper\u00a0 White tag \u00a0Weaner lambs", "property": "Minto", "delta": -18}, {"date": "2026-07-17", "mobId": "58h5birmrn4whw6", "head": "51", "notes": "turned up ", "reason": "Found", "id": "i4553dwmro6ybi8", "createdAt": 1784247600320, "mobName": "Dorper\u00a0 White tag\u00a0 Weaner lambs", "property": "Minto", "delta": 51}], "orders": [{"date": "2026-07-16", "property": "Buckanbe", "category": "Capex", "supplier": "Rece", "item": "Bathroom Update", "amount": "650", "id": "u2frlanmrn55x21", "createdAt": 1784184129433, "status": "Pending", "requestedBy": "Gwen"}], "musters": [], "menu": [{"date": "2026-07-16", "property": "Dunbar", "meals": "Sushi", "cook": "Benny", "id": "41m509amrn5ds69", "createdAt": 1784184496353}], "marking": [{"date": "2026-07-27", "mobId": "s59hxlsmrn4whw6", "maleHead": "289", "lambBreed": "Dorset", "terminal": "Yes \u2014 terminal", "femHead": "0", "id": "8hy5153ms2kn3kj", "createdAt": 1785117117907, "mobName": "Merino \u00b7 Breeding ewes", "property": "Buckanbe"}, {"date": "2026-07-26", "mobId": "6ontwt4mrn4whw6", "femHead": "0", "maleHead": "1865", "terminal": "Yes \u2014 terminal", "id": "8zozvo0ms2cxp90", "createdAt": 1785104175636, "mobName": "Breeding ewes \u00b7 Late", "property": "Magenta"}, {"date": "2026-07-26", "mobId": "y6ads19mrn4whw6", "terminal": "Yes \u2014 terminal", "maleHead": "33", "femHead": "0", "id": "tvvvwi0ms2ci5ym", "createdAt": 1785103450798, "mobName": "Merino \u00b7 Yellow tag \u00b7 Ewes & lambs \u00b7 Early", "property": "Magenta"}, {"date": "2026-07-26", "mobId": "lcnlapnmrn4whw6", "terminal": "Yes \u2014 terminal", "maleHead": "157", "femHead": "0", "id": "c2j2kidms2c7ica", "createdAt": 1785102953626, "mobName": "Breeding ewes \u00b7 Late", "property": "Magenta"}], "weaning": [{"date": "2026-07-27", "mobId": "zkxm6mqmrn4whw6", "head": "1287", "newCls": "Ewe lambs", "toPaddock": "Wygilla Pdk", "id": "0acje2lms2kh4yh", "createdAt": 1785116839769, "mobName": "Ewes & lambs", "property": "Buckanbe"}], "pregtest": [{"date": "2026-07-26", "mobId": "zkxm6mqmrn4whw6", "head": "265", "toPaddock": "Wygilla Pdk", "id": "hlo3lb9ms2eaiyd", "createdAt": 1785106453621, "mobName": "Ewes & lambs", "property": "Buckanbe"}], "pdkuse": [{"id": "ecklx5amrn5k1rj", "property": "Minto", "paddock": "Bullock", "use": "Summer Crop", "date": "2026-07-16", "by": "Gwen", "createdAt": 1784184788719}, {"id": "igxwiicmrn5jxfh", "property": "Minto", "paddock": "Bullock", "use": "Annual Pasture", "date": "2026-07-16", "by": "Gwen", "createdAt": 1784184783101}, {"id": "k28jx5omrn51dql", "property": "Minto", "paddock": "Hill", "use": "Silage", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "xyodwpxmrn51dql", "property": "Minto", "paddock": "Racecourse", "use": "Silage", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "h7f5t6jmrn51dql", "property": "Minto", "paddock": "Double 2", "use": "Silage", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "yrg6heimrn51dql", "property": "Minto", "paddock": "Delatite", "use": "Silage", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "fo1w4n7mrn51dql", "property": "Minto", "paddock": "Saddling", "use": "Silage", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "kn6ea63mrn51dql", "property": "Minto", "paddock": "Lone Tree", "use": "Silage", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "2hi9ykomrn51dql", "property": "Minto", "paddock": "Bullock", "use": "Summer Crop", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "qeq9x0dmrn51dql", "property": "Minto", "paddock": "Mint", "use": "Summer Crop", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "jgvpbc4mrn51dql", "property": "Minto", "paddock": "Swamp", "use": "Summer Crop", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "vebig0nmrn51dql", "property": "Minto", "paddock": "Upper Osbourne", "use": "Summer Crop", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "8xtmrs6mrn51dql", "property": "Minto", "paddock": "Road Osbourne", "use": "Summer Crop", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "radfux2mrn51dql", "property": "Minto", "paddock": "Neighbour Osbourne", "use": "Summer Crop", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "qogdbfpmrn51dql", "property": "Minto", "paddock": "Front", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "glorbvzmrn51dql", "property": "Minto", "paddock": "Creek", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "r6agrximrn51dql", "property": "Minto", "paddock": "Corner", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "xf82vcumrn51dql", "property": "Minto", "paddock": "Tolmie", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "9k5us6mmrn51dql", "property": "Minto", "paddock": "Eagle", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "rg306nemrn51dql", "property": "Minto", "paddock": "Willows", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "2hzusjcmrn51dql", "property": "Minto", "paddock": "Delta", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "6jn4aa7mrn51dql", "property": "Minto", "paddock": "Cowboy", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "thp28jemrn51dql", "property": "Minto", "paddock": "Centre", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "xmks179mrn51dql", "property": "Minto", "paddock": "Glen", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "v01e42bmrn51dql", "property": "Minto", "paddock": "Rocks", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "fmxwv4dmrn51dql", "property": "Minto", "paddock": "Spring", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "j56b6eqmrn51dql", "property": "Minto", "paddock": "Back", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "48j82frmrn51dql", "property": "Minto", "paddock": "Middle Back", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "n904s6omrn51dql", "property": "Minto", "paddock": "Shady", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "81zqyq7mrn51dql", "property": "Minto", "paddock": "Cornhill", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "5buam62mrn51dql", "property": "Linleigh", "paddock": "Micks Front", "use": "Summer Crop", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "bky95zlmrn51dql", "property": "Linleigh", "paddock": "Micks South", "use": "Summer Crop", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "741b8d0mrn51dql", "property": "Linleigh", "paddock": "Dougs North", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "f5a3xcfmrn51dql", "property": "Linleigh", "paddock": "Back Micks North", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "4dz2o4dmrn51dql", "property": "Linleigh", "paddock": "Centre South", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "bdwy29pmrn51dql", "property": "Linleigh", "paddock": "Centre North", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "1oj2x25mrn51dql", "property": "Linleigh", "paddock": "Salgari", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}, {"id": "gp8qi1qmrn51dql", "property": "Linleigh", "paddock": "Dougs South", "use": "Perennial Pasture", "date": "2026-07-01", "by": "Paddock sheet", "createdAt": 1784183917773}], "shearing": [], "woolsale": []};

const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWgAAADaBAMAAAB5vsUsAAAAHlBMVEUTHhMTHhMTHRMTHRMAVQB/AH8AAAAUHhQAAAAAAADiLJNGAAAACHRSTlMd3qBhAwIA/cTWtHEAABe7SURBVHja7Z39c1PXmcc/kqyTXQJYzhInkxeikAJZQ4qKGW/bpIlpwMykTVAa7HTzAheM9Uu3O+1MXv4G2u50Z5p2WoHtg2nYiU03SshmG2OCUyDpOjERAcKWBKOGQBuXIlHAG44ka3+4L7pXkolkS36Z4f6ie/Vy9b3P+T7PeZ7nPOccV4iyHOk3E+C6pDEZR1WZ7nOgBVD/NSmYcZdJ0EEA8bCcSaA7yttukwPab7wGZhKnhfF6ckBoM0bSynjd/Pyc8IyRdK11tlm9elqbEZJWMRtTLs0QSR+3y3b22hnB6ZRN0Gx7cGYo4jGboLddnBnWI91ox6zNDOsxaju/azK6l3JIeieTfJQDdCC/k5kRPWJudz79QUfHOJ/WoJ/KetHJSZG0p74MD37gTyfu1k8zdTOG05sf9Bln7TNIEdNGP65qZxDoo2Y3GJvWoAcLeqYva9MZtLrfbts8Wl4sMC0lLb5hZ4d5kpjm3XjVgCwUt0xn0EKy5vq9xsV2bZLRj1fSPghd6tXPF1mPUjfN6QFojw+AmRIDYOXADLDTK/t64dc21kwO6omBFvEL0pEKE2t6p7GdNl5DoVzte3Tv9JV00ELvdvaC4lKvnKauaXq2mfJYcvLWnOBr6dGBwHTmNOHXeTvvzbZ/qXAScmIphOSCeuXPf9v7w1dPQqBhmknao2N+sz7Lbgex19XU3LRmrwQIy+kCugNAvdBgws87QiGNdbMA9fys6aKIl+42A8KOj8bWuoCCQ3d9+d2bp4Wk9Z47DZBxWDzlUMFRSboJ8fXpQY8DNvra39/2Vk23/dqvDkwbRWwPZrXRTg51ccWqB/bYHujhrgQQmQ6g1TyDJICyBytuDcSKH0GPaVCf1UCdnQ6K2PE9/XXH3ZBeYTfbSYB7Xj/+6f57bV9/otygXaUP6KcNQXNlBNRNtk+ujFiNcTxmKeiVxE5tyulxNL+XMY5sNyL+0Wed735rtpxq0KlGCgN15JfE17b8u2nTR9qm2vdQ7wTHDAl89otQyozKyj5kXrKku7LmYmdu3xJ1fLMz+6CJqQWdvjGL0u9AlpecrpiTVzLoo1nMKpqDzDWWkRBTC1o1OruSMRJh7/XsdZDFN6WKeLjJxpQ86liYV8OuOTa2RANTKGllw8zruZ+a1i+1GnjkT3fkxe5TA3q7/cJHDj0MEqiDAEJrmSaKaI8HVbSwvqnjwWmV91D5wstTMXW4Md/BmUrfw+FobNcKPYA63lTAK5tKSXfmy97GaRUACsh5avMeaqF1umteo+VYWJR+dU7U/WyhH/6macpA21ylX7VsbcwnzDpWFuz7Uk1TRw+bVVgk7fmPL+qv01NnPT62s1UziOFnKo4iQYcH3ztmuxxGQwJqpKiQTk4J6G133n/KbuEe3fthnh4W2SdNXjT+1xbn9zx1fup/GaDz3qL+Y0FyCqyHKuhGzB4cXDwllC4uhaD+e2L9cOriFHBaML0ONzPwuAa6gH0HIDOzQNfsAfBGpwL0eIdNUqtW9Os96BR4ebES76q65gUBdhv+SnAEaL8DYG7DZIHe0J0obSrIxXmOKNwN7cvmNYPU2OU7ok0KPcQDlz+LlKB+B58OAoiY0UjegfZ5qzXdV7m0ao6cHEUUWinJ9+qAXgOStET6zXla1qvd7J8UeuCon/lC9WsycrvZgNargXr1JJ5A+sg8deNkge54ruh77ggaNSBpW44hGXHNWT7qTpxuTUePTJKdzmb5VU+P5KqsVGZ14U4b6NdWZv60es3qdbMHd9RPVBGLHt0yhl23nos0L/jd7+ctucpX70nu+KpuKf2w23C5D/z1sQBA/YKjl26dJNDt+n+/9Ndv1UP98tvfuesq9E/+RX+mP98My3p0ftffbT3TnQdvnRRO6+xIvtmE2rEs4ZrzoRa5imIaoWMyAIxq+Y7umpcbJ0PSmXsBta9BRf+37a4ldV86+n9VY4s6rfRm6awD0rsC+d9Y+EL9JCjiMWDrzxvU4VW6EDes+uNVvu39oqi36oey8qBVDJirqbeaDCSCq4wN7ojakzQFoYtbKg/arcFLTepwcXnyzQZjJeTk4W1JiEMVB30MtjXhLjEnNwIo31jeTKVBqxjhi8awRPHHVg3oCtk7HZLdZr80OgFWF2Xyup5V1c38h28c919oO3/15D/9IfGTZYaov/+zcXeMRZm8i3eP3o669N3Sbn3P1gBqhdq737B5ydvqd89/bPk8o3jS/ftAJemhghyA7QnL+SjSnQ1Al9r3vmkoXPqQv1TdOjMCleV0OBlALTJac9dPPy0yHjgBbHffkJM03eR+QOfZyYr2iJ53UjfT0WrIua81cKE4Lz6g+PI39ob2p/7mhzdeO/pu4PDf+Rk8tOi26wGW/zJQSU4vvxmq/ABqn79OBk7f9cWUah88cqiOI/56AksPLSF149L7z/zuK6uVev8vAfcbdwN8fnMl6YE5jKVevqc/qoWLKP8SvpCqfq+vEUDEI+ynk3W3xUb37nhSg4+YUGKh2MKrj49pQOpn2rYf9K+2LLEvk3D54gVvsWe13WRnLqfMca/URUjdCJA86q+spA9qgNqtoXktNMqHq8ZHTcFuIm6/2Oivq872MOaAZKa/wjFivs4kI5c10wZezu8nWqT9PWE50F3VmcwnP9DbQassp42R2XMSa7xIWv8pCqXNknY/ripLX9/llkcXdq2IACJaWUl7ggD7bnS1P2Ny1uabNtODU9jhGpfjzhfM1mGtQHz7olwC8PWRynJaAsmGj0bN6sekg7OsBWeEHh91hGNaBCDcmfAKIIMWhTELxsvGaQ1wsflwzLiOOIUkmlHX9wDUkI4uuJxrULxJQN1p6LC3t2nTJAS2h5qA9haWGqCT+aonmnViQE0BvUwArsvm1XdeeKLyoPXwuhY83zYEPabij2H326Rmm/OQmdg8gSKzpj7TxHr6AZLekv9oFrbqb6E7UZkKc1pv1HSa6xqB7ZtL73oNYhsq0iW1itMjBuD9nlBSjFNEa4FHes0oU2zuqbwiAtBDJqH3KOMALQBPrl2WGqgj6agnQCnDAyVwWn266oF4PAKocQzhKknytaDTN8kAHL9/Tc0zQ59+vwK5PAN8iMOMu/rLlWtlXAAJQYiQLvUy94hGA6v2xDjQSr17ejmY8+Z2jWwCO1BueuhD+gE4/EywdEmr64FIjp1UpmDftUWU5QXtAxhW7WfD2SRd8bSokSQ/kc7k8CuWr116mxeZ6n3jq8Di326I1ywAMkdKCUmTL37nf/pHHr74SDaQGXr70HVL4MsKOOLPpknK7E8DeEe6jtT3l+y9v4kSrQ3OcmSfr8VosW2NtjRJea2H3oZ/f1YLLzbta9GCPjJXKEe5uDRdcdlCOlsyWbx3XVWKtaptorW679PSOuDM/GC3ezDenH2Kc+bZIsKLg+MwZEV+M236l52u+hKNnmgRLW2rLtueIt2jz/8LB9Ri2828ssyK6Oq9G1io1Nm/3Hr4q6Olj5jYCOv58Lu/HxysDw+6D1x4zE7kP/vLK2n3vQBVUXeyDJUPIRFyLeipqfEvdo4sPFR2h0lqwMkLc8szp6ngiI2nzJw2KuQ3D5+FBJKpPYqej3i4EUBdRt00nsClmHa8MlJmSaMPHIte6cnNFpTjuH5PhAILFEwUtOEkPX5LZ/knJnBl1YqvRbYFyg46bUSljz9bAZK+DeLj4gtSi7YewlZ1XO7iwFQAaC1/WgyqIlnQWnlB765I3gOA+2TBuGniR8nLN5Xielv52jIX+XeV2nDFclpJPJZ2l3mxtjkVyXsoWR+vyfZC5e5bSl524Oo9opKeZQnIOB2bnubyUvoyZeX0jpv+9VQ8Hk84OFxuQW+nvPR4+gM9aFZhoCYuNEC9Ul5BO5b6LQdoscJxGd5CfSbhhfFlxsY4RqBC1kP33sEcuNx3XePUuaall9e/CJBqKN9ybYFJAO0H2M9GQzknvrjV1ycBdAK4EjAn++6K79HRh7eOOw4ZqCin9eQQ8AuzS3zpbIhDfQwC4se607rLd76lQFhyFW1feTBQadBAykSRatLVsx5ARYJA6vSDqtdRC6dmOyoSCqA+Eag0Peyu5H7nfwPs1xDLsl5smK37HvxKgW7QHrJtlJMAOgZkJOTkOTcCySggPrKw1fRdKpgpeeWNz7ILLwp/5emR1IDO52BjfoTUoQGsNyC/MncV9Xqk020juhIvNdFgY9Fw5UG7QB8byEmuZzDXOBXdLZD6N2yTYz6xYX51ThMglu05o8E2/6eaNlJxeqR1UuZlEnYa7DAItDsUymJWT+tOObBr34MNhpPwmYR/qPeXCmDcE842yrwlsv0mO2AD9tScNFy5fZ/19cLpLMlDPvAxUGoNxXhA65sZ5BnfdDD7GKLbnprLGFl5Eapf7lihRAFRNpKRFQf9ROHgtgPbzLSzhZZ7ANKOua9dQVLgwjtJ9PBEEE6lF9jWOH0K2qK2T9KmByBts8jTN8J+jbQs0WkqGbQKGvoXy2VIwJ7ASGMbGQyAREIChM2+qQMaVwKAr8TVpcYjaWGSxPFj1Wiftyj6szkj1YiqNUdmfdm3jwfhF4DIbbOyg/aYA8PunFESt80nAZZIK3vmlgjfTl9uk33QaP7CV2KFXsmgD5gJoXREXzvFFhzYtzZwadbU2k7NsZKU8SzuM5bzEi3R5pW8tljQTAiJGMJGReWzLfkNpKV9uDtpydISeKdmZB5tD1Ih0Eez6qccQzvHNas7tJygVksHRjUTcNQ0ygKS+yclRlSxrInY5Ph1Inea1hIMeMqPet3q3K1FCp6UyTcD4wNdksOkpOcZmGWEhZ5n8EbrhGUJ2RnM+b43ALC9FmKMJvQ5JFbBy+htL2hUDrSS1EOcODUCWKlP29J2Ave9nHBVJ6gh0wJPvWX8YBAQTwPf+JkGQiOjkQqaWRkjuhT19eOtGKv6ArTgWZa4c2QVYYSR9jNfNcCre8nhkAS8q4zfDQGuN1ug6vaBKIvBE8b9LD7Uzif8ZCysWtFxZI5vfLUE5LsTWYuoAIyt1a5MC/RAjbHlhyZDwNbn2DUnGioP6D0jGuU8lHBk05R0VSdcPlxVQUC9UmNSiy+YWX9V0O1fCk5mtstom7DL57r6boVXNXmtX+ueTNAG0FBmYtZDPLDlK43lXrS2sMoLDSVdvhpIx+MToQeAOnK+paJooQZcPkhHxyxkLhX0RI1ITpIyZIGtwTWnaJilg77KSrdFIXX5HKfpqAN+hUCjPshGhAlfMbd17LtU9l1iXSFm3nFtSaNroK+Bvgb6GuhroK+BnrGgq0BFbYNm7Z6JejfqgwvVCVxzGioq6a5vyuz1ionvKHTqkTPx+Pk1AxUFndETQbqYYq0TvaNICM19Zy0ro5UE7bKt5j5hcgAb4OKK+6Rjg83yS9qW/PyCYSYlc8+29e3N/4kCz7C5wIttNEv19Q0AaiA3vFF9fXttb6kx/tSmiIKudebliz/Q9wZJv3lhbhOwbb4ZH7bf4XqQw7P3ZvAlcFWfugWgfdkdzeqVvYWyFJvM2TYfjJoq2b6sGdX1GO6Vr2Zc1QlX9YXRG/QZiedbYJehusv3ZnD5yM6V6Jpv/T4x2mSZvDbrWfzGa2dL23cksPCC+dGK5jjENpyPx081x8+fEo8B6bmnLvS8svZSzlKDUgCefj2nrs40mhKbf6anm1EJO8/Hz59pfuTU+UQbwPahxK498vwaXQm855ubzw99mm2NhY+ZNFjdHMzaaWsYQgWNnPxG+E8NIGR+NGDMKnLVhsxIVR0Iuebf/8eItvn2PHrAgJF80bpMJrakhk71h/QBRp+m59gDsO057YbTK84JowJ3IERfjdAsk6aCZvLGZeN0wKjUADzmeHc6YhZTfsNq7jTc+fO16+4jeX51/BzgTvzqUoNoPfMjuS46Zr7Iwwbj748lL4ZCyyRwpXntAxFeXr023gvqRrnvQY3WzyLeWfofpepXnSPjtzCZitYaMbaucBuI9ONogd7HaicJhzShB8Oh1r1w8IlFGqBtuNpkwozJbRVzaSBu09gwghA+ahGhw1HcWqoBIHTCVqzS2i8eyr1BdnlVNyhljq2NDitTQFkr+E2cqZaMzAA0kE5k9LuJYWdtjCb0xpQAndYT6XeuN1IKCQWwWeMYF01TaRSrSGDAcjA68+vJ3EgyEWOYNxXcZ76fzW5Ya9Yaj2PtCdHxxOu5lsLOaeMei7KDoAXNqWo0RjUQ/Ybt1Wxtj1qULQ0QFujGhPAZwvCID3Mt9dYsq3OPBmsjJU+kwGY0L3IWUMFd1sj+hkKo3dKc+skSmXXfsvUvthtkJe1HDeCOAXRgTGa36KE2/lhWFe6PVWN2CG5WgXlX/q0a4JGnpQ5WRLx+28c+449e1KwBdZfRqjmpXvMGjh4xwSba+gH8KS0n6SVYb4k655cemd08RDhcXCmAbcH1ABnFLIM7Mc4VELXfxkTN3mCj5t/gy50U6kaFSBsFn4kdVov7sv4PhUVtn4IxkDfkqhZu/QXAMZd21hg/fFK22Wa0J5z8B0jL7IXH3JinQ3Ei1zi5AUmEE4DSfDK3XjWj/lkWZnXG0Wc7j0D7B8NzNUAlNqL0qhZGfVT15mqrfXsEU2IuoMMUm3+TpuXOgXEDiBhuYLvwkbe/kxhL1NKmLOmcbkV9KVatOy0PteOSuvaLjySPR/P7oKiN58OAzAANhsKo4G7cue3oxgM8xQYgkAxoBXZBemosAzJm6YD68GPD0fKIRaynSufyet/Ypsh+eAcH32t8TbOI6onkmDT9KdIICYlRKLCTlqff/Ncxjzz4rQ0Wh8ISY69bcR9j6EfOMRRfbda7eEQiHM4tkXTrC61GmIVqeR2iBepFlpa4PrnMDhYe497nn9fMwhnPj2yitr6UVaKEqgU0arL36uBbNz0fzLGobhAgfHjYjq/wFlmeXjbKvKUENkp7o7nyXSWAYR2b+c6GiDVtwTRP3bamNYZG1dBQmFvMJyowjuCmEx8sYb0UyUB+5ZoEWA5+kcsQe2FaxjmFIvvkI8ktW7b0WlZcfIR1H2Xoua3QVOiP4g6FLvA3Q/ipn2zZ0kuX475uXRSjiEDdKKDJXIcJ8PSLb4dzuh3SWrZY7UXndmdWy6snXguFQsuyxU7rI7nVbNlCLFTQ2strvdQL5FRwd2sotMwWptiTNRFOxuSYNmEp3htyFVREsjKqG2OLuy7hA0TE2nVaxExxJPL7Jbd0a0bjCr9Ofl3Cotu5bbVb36pMxNis1Y5tHfppy6NWLCujEft2Z7an9upG2CcKMMfsl6TlRma0dgAtAyzVLZZX73BqnTVwpqSfBFdsbAey0BrZScuVSgfdhVMPdfoiRlEeysbgOW2S9lmd9IdG5ZYLcHczCwjofcyAo08Mu41FWFxGCdIYO6hV9ee/t36W6Z3/mjEqqBJ6WdOTuCVuI8DNMdTCCljSNrcRl95JD+t4jBJaw7jc5Sag6c6KKeL10m4+Ta9waZ5JQcSM2R5pXypHuwJmC+w0HLZMQOenWqRsnpgZQcyRgDpqxNLSiGPaepVKpI0beANAgocAz1q3oREiYVbV6b2P6SWKLKst82aaug3dYk0vtB/Q9ud4UgaeDsMFEt3iBLT1QleiU29KlTDV2NPL5jkSdbgxdVZndqcRxzy6c3top3EDToBK4A6Hwwdwtwe9AwBPWrMSHg6DGx4G0kHqrLDCZ8VshuEXK+HRvr75QeeM704YlgBhq7iwlk0DyEf7+hZqi6z82yajEZdF2Dx78HdNSl+8t9No3aVS3L7IVNxaNkk8Gt4bau4Mutx3SE5LwDXX8Gnl6A0SiRyV0EH4E+PWo9efNZt+qznHtuonkni8ZZdjPoOqDeOuA9SCYVOaUeWNjUI8/tBLxvN1hqXXfPY/7CEzdHnbT/U28EtxuwQ85+S6oGmKBvDeQmc4TFuohd94Fswd8j0EuPUFVj2X5/6xZjjw3udDV4YDREeG6ob1v/HcZiSqfjsydJfxHssPfs6V+EcO5U1/PvR5zfv14Nm3KLJYX6f+nrdj1fMPfp5wfWJO01maHBq5zljEvn7eO4kacdu3DOUdGjnmCQDLD44MDc0xbnDw1HW3vr8o9vnQ0NDQyf8HucLwd24CXpQAAAAASUVORK5CYII=";
const LAND_USES = ["Silage", "Summer Crop", "Annual Pasture", "Perennial Pasture", "Spray", "Fertilizer"];
const WOOL_ELIGIBLE = (m) => m.species === "Sheep" && (m.breed === "Merino" || m.breed === "Dorset");
const INBOX = "Inbox";
const currentYearTag = () => {
  const y = new Date().getFullYear();
  const hit = Object.entries(TAG_YEAR).find(([t, yr]) => yr === y && t !== "Blue tag");
  return hit ? hit[0] : "";
};
const dropLabel = (tag) => {
  if (!tag) return "";
  if (tag === "M/A") return "mixed age";
  const parts = tag.split(" + ").map((p) => (p.endsWith(" tag") ? p : p + " tag"));
  const yrs = parts.map((p) => TAG_YEAR[p]).filter(Boolean);
  if (!yrs.length) return "";
  return yrs.map((y) => "’" + String(y).slice(2)).join("/") + " drop";
};

// Full paddock lists per property with areas (ha), from the 1 July 2026 sheets.
// Magenta prefixes: LD = Langley Dale, HV = Hillview, MG = Magenta.
const PADDOCKS = {
  Magenta: [
    ["LD – North Carrawatha", 1180], ["LD – Big Iona", 1511], ["LD – Bore Pdk", 770], ["LD – D block", 522],
    ["LD – DT's", 993], ["LD – Goat", 1745], ["LD – Henry's", 1179], ["LD – Homestead Block", 42],
    ["LD – LBJ", 1023], ["LD – Little Iona", 1488], ["LD – Maggies", 1448], ["LD – Middle", 791],
    ["LD – North Scrubby", 571], ["LD – South Carrawatha", 1684], ["LD – Three Mile", 2317],
    ["LD – Well", 1211], ["LD – Youl Plain", 2137],
    ["HV – Box Tree Pdk", 1330], ["HV – North Mac", 1174], ["HV – South Mac", 1710],
    ["HV – South Scrubby", 1290], ["HV – The Pines", 1445], ["HV – Well Pdk", 2374],
    ["HV – West Mac", 1142], ["HV – Hillview Holding", 0],
    ["MG – Back Sponge", 2101], ["MG – Bidura", 1992], ["MG – Brumby's", 1293],
    ["MG – Carrawatha Cropping Area", 577], ["MG – Front Sponge", 1876], ["MG – Kirks", 2466],
    ["MG – Mantises", 1614], ["MG – Saltbush", 1160], ["MG – Strip", 907], ["MG – Tommies", 1667],
    ["MG – Williams", 2231], ["MG – Woolshed", 1296],
  ],
  Buckanbe: [
    ["Billabong (House / Mootinara)", 4442], ["Horse Pdk", 580], ["Jack's Hut / Mingara Pdk", 7021],
    ["Two Mile Pdk", 4192], ["Calcaric Pdk", 3444], ["Wygilla Pdk", 5279], ["Andy's Pdk", 6176],
    ["Sandridge Pdk", 3632], ["Airstrip Pdk", 639], ["River Pdk", 4136],
  ],
  Wirrealpa: [
    ["Grindstone", 6350], ["10 Mile", 10360], ["10 Mile Dam", 2960], ["13 Mile", 5220], ["6 Mile", 6720],
    ["7 Mile", 12310], ["Blues", 3280], ["Bottom Woolshed", 2700], ["Emu", 21120], ["H.P.1", 0],
    ["H.P.2", 0], ["H.P.3", 0], ["Holding", 1900], ["Horse", 790], ["House", 1190], ["Mount Lyall", 2930],
    ["Redhill", 1730], ["Soakage", 11430], ["Sth Bob Mooney", 8630], ["Top Coffins", 4670],
    ["Top Woolshed", 1460], ["Trigg", 15020], ["Walcoola", 13320], ["Watkins", 7090], ["Wooly", 2960],
  ],
  Dunbar: [
    ["Swimming Hole", 17], ["Hospital", 1], ["Flat East", 7], ["Fox Hill Flat", 17], ["Fox Hill Flat 2", 10],
    ["Mckenzie Flat", 22], ["Mckenzie Flat 2", 7], ["McNairns", 8], ["Argyle East", 7], ["Quarry Flat", 21],
    ["E-W Lane", 1], ["Fox Hill", 35], ["N-S Lane", 2], ["Argyle Escarpment", 19], ["Quarry", 11],
    ["Fairy Lawn Escarpment", 28], ["McKenzie", 21], ["McKenzie Holding", 7], ["Homestead", 23],
    ["Triangle", 7], ["Bungalow South", 15], ["McKenzie South", 21], ["McKenzie Middle", 26],
    ["Hay Paddock", 23], ["Fairy Lawn", 19],
  ],
  Minto: [
    ["Front", 12], ["Creek", 3], ["Hill", 26], ["Corner", 15], ["Bullock", 28], ["Mint", 16],
    ["Racecourse", 14], ["Tolmie", 19], ["Swamp", 14], ["Double 2", 20], ["Delatite", 12], ["Saddling", 19],
    ["Eagle", 14], ["Willows", 15], ["Delta", 11], ["Cowboy", 9], ["Upper Osbourne", 10],
    ["Road Osbourne", 8], ["Neighbour Osbourne", 6.8], ["Centre", 7], ["Glen", 18], ["Rocks", 28],
    ["Spring", 26], ["Back", 26], ["Middle Back", 26], ["Shady", 26], ["Cornhill", 13], ["Old Yards", 6],
    ["Motorbike Track", 3], ["Lone Tree", 12], ["Minto Glen Feedlot", 1], ["Delatite Feedlot", 1],
    ["Trees Feedlot", 1], ["Dallas Holding", 1], ["Front Dallas", 1], ["Front Shearing Shed", 1],
  ],
  Linleigh: [
    ["Dougs North", 41], ["Micks Front", 29], ["Micks South", 9.9], ["Back Micks North", 21],
    ["Centre South", 33], ["Centre North", 37], ["Salgari", 51], ["Dougs South", 35],
  ],
  Innaminka: [["Agistment country", 0]],
};
const pdkArea = (prop, name) => {
  const hit = (PADDOCKS[prop] || []).find((x) => x[0] === name);
  return hit ? hit[1] : 0;
};

// One consistent description, always assembled in the same order:
// Breed · Tag · Class · Status · ex Origin
const composeName = (m) =>
  [m.breed, m.tag, m.cls, m.status, m.origin ? "ex " + m.origin : ""].filter(Boolean).join(" · ") ||
  m.name ||
  "Unnamed mob";

// Classes and DSE ratings taken from the 1 July 2026 paddock sheets
const DEFAULT_CLASSES = {
  Sheep: [
    "Ewes – twins",
    "Ewes – singles",
    "Ewes & lambs",
    "Breeding ewes",
    "Dry sheep",
    "Lambs",
    "Ewe lambs",
    "Wether lambs",
    "Weaner lambs",
    "Stud ultra ewes",
    "Stud ultra ewe lambs",
    "Stud ultra ram lambs",
    "Rams",
    "Sale ewes",
    "Fattening",
    "Backgrounding",
  ],
  Cattle: ["Cows", "Cows & calves", "Store cows", "Heifers", "Steers", "Weaner heifers", "Weaner steers", "Bulls", "Calves", "Stud Angus cows", "Stud Angus heifers", "Stud Angus bull calves", "Stud Angus heifer calves"],
};

const CLASS_DSE = {
  "Ewes – twins": 3,
  "Ewes – singles": 2,
  "Ewes & lambs": 3,
  "Breeding ewes": 3,
  "Dry sheep": 1,
  Lambs: 1.2,
  "Ewe lambs": 1.2,
  "Wether lambs": 1.2,
  "Weaner lambs": 1.2,
  "Stud ultra ewes": 3,
  "Stud ultra ewe lambs": 1.2,
  "Stud ultra ram lambs": 1.2,
  Rams: 2,
  "Sale ewes": 1.3,
  Fattening: 1.5,
  Backgrounding: 1.2,
  Cows: 10,
  "Cows & calves": 10,
  "Store cows": 10,
  Heifers: 8,
  "Weaner heifers": 6,
  "Weaner steers": 6,
  "Stud Angus cows": 10,
  "Stud Angus heifers": 8,
  "Stud Angus bull calves": 6,
  "Stud Angus heifer calves": 6,
  Steers: 8,
  Bulls: 8,
  Calves: 5,
};
const dseFor = (m) => (CLASS_DSE[m.cls] !== undefined ? CLASS_DSE[m.cls] : m.species === "Cattle" ? 8 : 1.5);




const TAG = {
  mobs: "#23281F",
  moves: "#D99D0B",
  health: "#B03A2E",
  rain: "#3E7CB1",
  trucking: "#7D4E9E",
  maint: "#DA7B26",
  pasture: "#6BA542",
  adjust: "#94651E",
  orders: "#2E7F8F",
  musters: "#4E5D9E",
  marking: "#5C8A4E",
  weaning: "#8A6FB0",
  pregtest: "#A85C7A",
  shearing: "#C9A227",
  woolsale: "#8A7B5C",
  menu: "#B0743A",
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${String(y).slice(2)}`;
};
const num = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

// Storage mode: probed at startup. "shared" = whole team sees the same data;
// "personal" = this device only (fallback when shared storage misbehaves);
// "memory" = nothing persists (last resort).
const STORAGE = { mode: "memory", shared: false };

async function probeStorage() {
  try {
    await window.storage.set("mp2:probe", "ok", true);
    STORAGE.mode = "shared";
    STORAGE.shared = true;
    return;
  } catch {}
  try {
    await window.storage.set("mp2:probe", "ok", false);
    STORAGE.mode = "personal";
    STORAGE.shared = false;
    return;
  } catch {}
  STORAGE.mode = "memory";
}

async function loadKey(key, fallback) {
  if (STORAGE.mode === "memory") return fallback;
  try {
    const r = await window.storage.get(key, STORAGE.shared);
    return r ? JSON.parse(r.value) : fallback;
  } catch {
    return fallback;
  }
}
async function saveKey(key, val) {
  if (STORAGE.mode === "memory") return false;
  try {
    await window.storage.set(key, JSON.stringify(val), STORAGE.shared);
    return true;
  } catch (e) {
    console.error("save failed", e);
    return false;
  }
}

/* ------------------ Record type configs ------------------ */

const RECORD_TYPES = {
  moves: {
    label: "Paddock moves",
    single: "Paddock move",
    tag: TAG.moves,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "mobId", label: "Mob", type: "mob" },
      { key: "head", label: "Head to move (leave blank to move the whole mob)", type: "number", optional: true },
      { key: "toPaddock", label: "To paddock", type: "paddock" },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  health: {
    label: "Health treatments",
    single: "Treatment",
    tag: TAG.health,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "mobId", label: "Mob", type: "mob" },
      { key: "product", label: "Product / treatment", type: "text" },
      { key: "batch", label: "Batch no.", type: "text", optional: true },
      { key: "dose", label: "Dose / rate", type: "text", optional: true },
      { key: "whp", label: "WHP (days)", type: "number", optional: true },
      { key: "esi", label: "ESI (days)", type: "number", optional: true },
      { key: "treatedBy", label: "Treated by", type: "text", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  rain: {
    label: "Rainfall",
    single: "Rainfall reading",
    tag: TAG.rain,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "property", label: "Property", type: "property" },
      { key: "mm", label: "Rainfall (mm)", type: "number" },
      { key: "notes", label: "Gauge / notes", type: "textarea", optional: true },
    ],
  },
  trucking: {
    label: "Trucking & transfers",
    single: "Trucking record",
    tag: TAG.trucking,
    fields: [
      { key: "date", label: "Date", type: "date" },
      {
        key: "ttype",
        label: "Movement type",
        type: "select",
        options: ["Property transfer", "Sale to market", "Purchase"],
      },
      { key: "fromProperty", label: "From property", type: "property", showIf: (v) => v.ttype !== "Purchase" },
      { key: "loads", label: "Mobs on the truck (tick, then set head)", type: "mobmulti", showIf: (v) => v.ttype !== "Purchase" && !!v.fromProperty },
      { key: "head", label: "Head", type: "number", showIf: (v) => v.ttype === "Purchase" },
      { key: "toProperty", label: "To property", type: "property", showIf: (v) => v.ttype === "Property transfer" || v.ttype === "Purchase" },
      { key: "destination", label: "Buyer / saleyard / processor", type: "text", showIf: (v) => v.ttype === "Sale to market" },
      { key: "mobName", label: "New mob name", type: "text", showIf: (v) => v.ttype === "Purchase" },
      { key: "species", label: "Species", type: "select", options: ["Cattle", "Sheep"], showIf: (v) => v.ttype === "Purchase" },
      { key: "cls", label: "Class", type: "class", showIf: (v) => v.ttype === "Purchase" },
      { key: "carrier", label: "Carrier", type: "text", optional: true },
      { key: "nvd", label: "NVD / waybill no.", type: "text", optional: true },
      { key: "freightCost", label: "Freight cost ($ quoted/expected)", type: "number", optional: true },
      { key: "invoiceRef", label: "Freight invoice ref", type: "text", optional: true },
      {
        key: "nlis",
        label: "NLIS database transfer",
        type: "select",
        options: ["Recorded on NLIS", "Not yet recorded", "Not required"],
      },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  adjust: {
    label: "Stock adjustments",
    single: "Stock adjustment",
    tag: TAG.adjust,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "mobId", label: "Mob", type: "mob" },
      {
        key: "reason",
        label: "Reason",
        type: "select",
        options: ["Deaths", "Mismustered / missing", "Found", "Births / marking", "Recount (set head to this number)"],
      },
      { key: "head", label: "Head", type: "number" },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  orders: {
    label: "Purchase orders",
    single: "Purchase order",
    tag: TAG.orders,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "property", label: "Property", type: "property" },
      { key: "category", label: "Spend type", type: "select", options: ["Capex", "Maintenance"] },
      { key: "supplier", label: "Supplier", type: "text" },
      { key: "item", label: "What for", type: "text" },
      { key: "amount", label: "Amount ($ ex GST)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  musters: {
    label: "Musters & jobs",
    single: "Muster / job",
    tag: TAG.musters,
    fields: [
      { key: "date", label: "Date", type: "date" },
      {
        key: "activity",
        label: "Activity",
        type: "select",
        options: ["Muster", "Marking", "Weaning", "Shearing", "Crutching", "Scanning / preg test", "Drenching", "Trucking day", "Other"],
      },
      { key: "property", label: "Property", type: "property" },
      { key: "pdks", label: "Paddocks", type: "text", optional: true },
      { key: "crew", label: "Who is helping (contractors / juniors / staff)", type: "team", optional: true },
      { key: "startAt", label: "Start (e.g. 6:30am at the yards)", type: "text", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  marking: {
    label: "Marking / branding",
    single: "Marking / branding",
    tag: TAG.marking,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "mobId", label: "Breeding mob (the mothers)", type: "mob" },
      { key: "msHead", label: "Mixed sex marked (MS — one mob, draft later)", type: "number", optional: true },
      { key: "femHead", label: "Females marked (ewe lambs / heifer calves)", type: "number", optional: true },
      { key: "maleHead", label: "Males marked (ram lambs / bull calves)", type: "number", optional: true },
      { key: "lambBreed", label: "Lamb breed (if different — e.g. terminal Dorset / Dorper)", type: "breed", optional: true },
      { key: "terminal", label: "Terminal lambs (all for sale)?", type: "select", options: ["No", "Yes — terminal"], optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  weaning: {
    label: "Weaning",
    single: "Weaning",
    tag: TAG.weaning,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "mobId", label: "Lamb / calf mob to wean from", type: "mob" },
      { key: "head", label: "Head weaned", type: "number" },
      { key: "newCls", label: "Wean into class", type: "class" },
      { key: "toPaddock", label: "To paddock", type: "paddock", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  pregtest: {
    label: "Preg testing",
    single: "Preg test — empties",
    tag: TAG.pregtest,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "mobId", label: "Mob tested", type: "mob" },
      { key: "head", label: "Number empty (PTE)", type: "number" },
      { key: "toPaddock", label: "Draft empties to paddock", type: "paddock", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  shearing: {
    label: "Shearing",
    single: "Shearing record",
    tag: TAG.shearing,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "mobId", label: "Mob shorn (Merino ewes / Dorset lambs)", type: "mob", mobFilter: (m) => WOOL_ELIGIBLE(m) },
      { key: "tally", label: "Sheep shorn (shearer tally)", type: "number" },
      { key: "totalKg", label: "Total wool (kg)", type: "number" },
      { key: "bales", label: "Bales", type: "number", optional: true },
      { key: "micron", label: "Micron", type: "number", optional: true },
      { key: "yield", label: "Yield (%)", type: "number", optional: true },
      { key: "vm", label: "VM (%)", type: "number", optional: true },
      { key: "contractor", label: "Shearing contractor", type: "text", optional: true },
      { key: "rate", label: "Contract rate ($/head)", type: "number", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  woolsale: {
    label: "Wool trucked / sold",
    single: "Wool dispatch",
    tag: TAG.woolsale,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "kg", label: "Wool trucked (kg)", type: "number" },
      { key: "bales", label: "Bales", type: "number", optional: true },
      { key: "buyer", label: "Broker / buyer", type: "text" },
      { key: "price", label: "Sale value ($ total)", type: "number", optional: true },
      { key: "carrier", label: "Carrier", type: "text", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  menu: {
    label: "Menu",
    single: "Menu entry",
    tag: TAG.menu,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "property", label: "Property", type: "property" },
      { key: "meals", label: "What is on (breakfast / smoko / dinner)", type: "textarea" },
      { key: "cook", label: "Cook", type: "text", optional: true },
    ],
  },
  maint: {
    label: "Maintenance",
    single: "Maintenance job",
    tag: TAG.maint,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "property", label: "Property", type: "property" },
      { key: "asset", label: "Asset / machine", type: "text" },
      { key: "work", label: "Work done", type: "textarea" },
      { key: "doneBy", label: "Done by", type: "text", optional: true },
      { key: "cost", label: "Cost ($)", type: "number", optional: true },
    ],
  },
  pasture: {
    label: "Pasture",
    single: "Pasture record",
    tag: TAG.pasture,
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "property", label: "Property", type: "property" },
      { key: "paddock", label: "Paddock", type: "paddock" },
      {
        key: "condition",
        label: "Condition",
        type: "select",
        options: ["Poor", "Fair", "Good", "Excellent"],
      },
      { key: "sown", label: "Year sown", type: "number", optional: true },
      { key: "pastureType", label: "Pasture / crop type", type: "text", optional: true },
      { key: "foo", label: "FOO (kg DM/ha)", type: "number", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
};

/* ------------------ Small UI atoms ------------------ */

const Chip = ({ color, children }) => (
  <span className="chip" style={{ background: color }}>
    {children}
  </span>
);

const Field = ({ f, value, onChange, mobs, breeds, paddocks, properties, classes, teamNames }) => {
  const common = {
    value: value ?? "",
    onChange: (e) => onChange(f.key, e.target.value),
  };
  const label = (
    <label className="f-label">
      {f.label}
      {f.optional ? <span className="opt"> optional</span> : null}
    </label>
  );
  if (f.type === "textarea")
    return (
      <div className="f-row">
        {label}
        <textarea rows={2} {...common} />
      </div>
    );
  if (f.type === "select" || f.type === "property" || f.type === "mob" || f.type === "class" || f.type === "breed") {
    let opts = f.options || [];
    if (f.type === "property") opts = properties;
    if (f.type === "breed")
      return (
        <div className="f-row">
          {label}
          <select {...common}>
            <option value="">Same as the mothers</option>
            {breeds.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
      );
    if (f.type === "class") opts = [...(classes?.Cattle || []), ...(classes?.Sheep || [])];
    if (f.type === "mob") {
      return (
        <div className="f-row">
          {label}
          <select {...common}>
            <option value="">Select mob…</option>
            {mobs.map((m) => (
              <option key={m.id} value={m.id}>
                {composeName(m)} — {num(m.head).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div className="f-row">
        {label}
        <select {...common}>
          <option value="">Select…</option>
          {opts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (f.type === "team")
    return (
      <div className="f-row">
        {label}
        <input list="team-list" {...common} placeholder="Names — contractors welcome" />
        <datalist id="team-list">
          {(teamNames || []).map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>
    );
  if (f.type === "paddock")
    return (
      <div className="f-row">
        {label}
        <select {...common}>
          <option value="">Select paddock…</option>
          {paddocks.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
    );
  return (
    <div className="f-row">
      {label}
      <input
        type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
        inputMode={f.type === "number" ? "decimal" : undefined}
        {...common}
      />
    </div>
  );
};

/* ------------------ Generic record form ------------------ */

function RecordForm({ typeKey, mobs, paddocksFor, properties, classes, teamNames, breedList = [], onSave, onCancel, defaults }) {
  const cfg = RECORD_TYPES[typeKey];
  const [vals, setVals] = useState(() => {
    const init = { date: todayStr(), ...(defaults || {}) };
    return init;
  });
  const [err, setErr] = useState("");
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));

  const visible = cfg.fields.filter((f) => !f.showIf || f.showIf(vals));
  const mobProp = vals.mobId ? mobs.find((m) => m.id === vals.mobId)?.property : "";
  const mobOptions = vals.fromProperty ? mobs.filter((m) => m.property === vals.fromProperty) : mobs;
  const paddockOptions = paddocksFor(vals.toProperty || vals.property || mobProp);

  const submit = () => {
    if (typeKey === "marking" && !(num(vals.msHead) > 0 || num(vals.femHead) > 0 || num(vals.maleHead) > 0)) {
      setErr("Enter a number marked — MS, females, or males");
      return;
    }
    for (const f of visible) {
      if (f.type === "mobmulti") {
        const loads = vals.loads || {};
        const ids = Object.keys(loads).filter((k) => num(loads[k]) > 0);
        if (!ids.length) {
          setErr("Tick at least one mob and set head");
          return;
        }
        continue;
      }
      if (!f.optional && !vals[f.key]) {
        setErr(`${f.label} is required`);
        return;
      }
    }
    onSave({ ...vals, id: uid(), createdAt: Date.now() });
  };

  return (
    <div className="card form-card">
      <div className="form-head">
        <Chip color={cfg.tag}>{cfg.single}</Chip>
      </div>
      {visible.map((f) =>
        f.type === "mobmulti" ? (
          <div className="f-row" key={f.key}>
            <label className="f-label">{f.label}</label>
            <div className="loads-box">
              {mobOptions.length === 0 && <div className="empty">No mobs at this property.</div>}
              {mobOptions.map((m) => {
                const loads = vals.loads || {};
                const on = loads[m.id] !== undefined;
                return (
                  <div className="load-row" key={m.id}>
                    <label className="load-label">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => {
                          const next = { ...loads };
                          if (on) delete next[m.id];
                          else next[m.id] = num(m.head) > 0 ? num(m.head) : "";
                          set("loads", next);
                        }}
                      />
                      <span>
                        {composeName(m)} <span className="load-have">({num(m.head).toLocaleString()})</span>
                      </span>
                    </label>
                    {on && (
                      <input
                        className="load-head"
                        type="number"
                        inputMode="numeric"
                        value={loads[m.id]}
                        onChange={(e) => set("loads", { ...loads, [m.id]: e.target.value })}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
        <Field
          key={f.key}
          f={f}
          value={vals[f.key]}
          onChange={set}
          mobs={f.mobFilter ? mobOptions.filter(f.mobFilter) : mobOptions}
          breeds={breedList}
          paddocks={paddockOptions}
          properties={properties}
          classes={classes}
          teamNames={teamNames}
        />
        )
      )}
      {err && <div className="err">{err}</div>}
      <div className="btn-row">
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" onClick={submit}>
          Save record
        </button>
      </div>
    </div>
  );
}

/* ------------------ Mob form ------------------ */

function MobForm({ properties, paddocksFor, settings, onSave, onCancel, existing }) {
  const classes = settings.classes;
  const [vals, setVals] = useState(
    existing || {
      breed: "",
      tag: "",
      cls: "",
      status: "",
      origin: "",
      species: "Cattle",
      head: "",
      property: properties[0] || "",
      paddock: "",
      notes: "",
    }
  );
  const [err, setErr] = useState("");
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));
  const submit = () => {
    if (!vals.cls || !vals.head || !vals.property) {
      setErr("Class, head count and property are required");
      return;
    }
    onSave({
      ...vals,
      name: "",
      head: Math.round(num(vals.head)),
      id: existing?.id || uid(),
      createdAt: existing?.createdAt || Date.now(),
    });
  };
  const sel = (label, key, opts, optional = true) => (
    <div className="f-row">
      <label className="f-label">
        {label}
        {optional ? <span className="opt"> optional</span> : null}
      </label>
      <select value={vals[key] || ""} onChange={(e) => set(key, e.target.value)}>
        <option value="">{optional ? "—" : "Select…"}</option>
        {opts.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
  return (
    <div className="card form-card">
      <div className="form-head">
        <Chip color={TAG.mobs}>{existing ? "Edit mob" : "New mob"}</Chip>
      </div>
      <div className="name-preview">{composeName(vals)}</div>
      <div className="f-grid2">
        {sel("Species", "species", ["Cattle", "Sheep"], false)}
        <div className="f-row">
          <label className="f-label">Head</label>
          <input type="number" inputMode="numeric" value={vals.head} onChange={(e) => set("head", e.target.value)} />
        </div>
      </div>
      <div className="f-grid2">
        {sel("Breed", "breed", settings.breeds || [])}
      </div>
      <div className="f-row">
        <label className="f-label">Tag colour — tap one, two or three, or M/A for mixed age</label>
        <div className="tag-chips">
          {["M/A", ...(settings.tagColours || [])].map((t) => {
            const parts =
              vals.tag === "M/A"
                ? []
                : (vals.tag || "")
                    .split(" + ")
                    .filter(Boolean)
                    .map((p) => (p.endsWith(" tag") ? p : p + " tag"));
            const on = t === "M/A" ? vals.tag === "M/A" : parts.includes(t);
            return (
              <button
                type="button"
                key={t}
                className={"tag-chip" + (on ? " on" : "")}
                onClick={() => {
                  if (t === "M/A") {
                    set("tag", vals.tag === "M/A" ? "" : "M/A");
                    return;
                  }
                  let next = on ? parts.filter((x) => x !== t) : [...parts, t];
                  if (next.length > 3) return;
                  const order = settings.tagColours || [];
                  next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
                  const label =
                    next.length <= 1
                      ? next[0] || ""
                      : next.map((x, i) => (i < next.length - 1 ? x.replace(/ tag$/, "") : x)).join(" + ");
                  set("tag", label);
                }}
              >
                {t === "M/A" ? "M/A" : t.replace(/ tag$/, "")}
              </button>
            );
          })}
        </div>
      </div>
      <div className="f-grid2">
        {sel("Class", "cls", classes?.[vals.species] || [], false)}
        {sel("Status", "status", settings.statuses?.[vals.species] || [])}
      </div>
      <div className="f-row">
        <label className="f-label">
          Origin (bought in from) <span className="opt">optional</span>
        </label>
        <input value={vals.origin || ""} onChange={(e) => set("origin", e.target.value)} placeholder="e.g. Mansfield, QLD" />
      </div>
      <div className="f-grid2">
        <div className="f-row">
          <label className="f-label">Property</label>
          <select value={vals.property} onChange={(e) => set("property", e.target.value)}>
            {properties.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="f-row">
          <label className="f-label">Paddock</label>
          <select value={vals.paddock} onChange={(e) => set("paddock", e.target.value)}>
            <option value="">Select paddock…</option>
            {paddocksFor(vals.property).map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="f-row">
        <label className="f-label">
          Notes <span className="opt">optional</span>
        </label>
        <input value={vals.notes || ""} onChange={(e) => set("notes", e.target.value)} />
      </div>
      {err && <div className="err">{err}</div>}
      <div className="btn-row">
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" onClick={submit}>
          Save mob
        </button>
      </div>
    </div>
  );
}

/* ------------------ Property chat ------------------ */

const MAX_CHAT_MSGS = 50;

function ChatScreen({ property, me, onSetMe }) {
  const [msgs, setMsgs] = useState([]);
  const [photos, setPhotos] = useState({});
  const [text, setText] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const key = "mp2:chat:" + property;

  const load = async () => {
    const list = await loadKey(key, []);
    setMsgs(list);
    const missing = list.filter((m) => m.photoKey && !photos[m.photoKey]);
    if (missing.length) {
      const loaded = {};
      await Promise.all(
        missing.map(async (m) => {
          try {
            const r = await window.storage.get(m.photoKey, true);
            if (r) loaded[m.photoKey] = r.value;
          } catch {}
        })
      );
      setPhotos((p) => ({ ...p, ...loaded }));
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [property]);

  const shrinkImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 900;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.65));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const send = async (photoDataUrl) => {
    if (!text.trim() && !photoDataUrl) return;
    setBusy(true);
    const msg = { id: uid(), author: me, text: text.trim(), ts: Date.now() };
    if (photoDataUrl) {
      msg.photoKey = "mp2:photo:" + msg.id;
      await saveKey(msg.photoKey, photoDataUrl);
      setPhotos((p) => ({ ...p, [msg.photoKey]: photoDataUrl }));
    }
    // re-read before writing so we don't clobber teammates' messages
    const latest = await loadKey(key, []);
    const next = [...latest, msg].slice(-MAX_CHAT_MSGS);
    await saveKey(key, next);
    setMsgs(next);
    setText("");
    setBusy(false);
  };

  const react = async (msgId, emoji) => {
    const latest = await loadKey(key, []);
    const next = latest.map((m) => {
      if (m.id !== msgId) return m;
      const reactions = { ...(m.reactions || {}) };
      const who = new Set(reactions[emoji] || []);
      if (who.has(me)) who.delete(me);
      else who.add(me);
      if (who.size) reactions[emoji] = [...who];
      else delete reactions[emoji];
      return { ...m, reactions };
    });
    await saveKey(key, next);
    setMsgs(next);
  };

  const onPickPhoto = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const dataUrl = await shrinkImage(f);
      await send(dataUrl);
    } catch {
      setBusy(false);
    }
  };

  const fmtTs = (ts) => {
    const d = new Date(ts);
    return (
      String(d.getHours()).padStart(2, "0") +
      ":" +
      String(d.getMinutes()).padStart(2, "0") +
      " " +
      String(d.getDate()).padStart(2, "0") +
      "/" +
      String(d.getMonth() + 1).padStart(2, "0")
    );
  };

  if (!me)
    return (
      <div className="card">
        <div className="card-title">Join the {property} chat</div>
        <p className="note">Enter your name once — it shows on your messages so the team knows who is talking.</p>
        <div className="prop-adder">
          <input value={nameInput} placeholder="Your name" onChange={(e) => setNameInput(e.target.value)} />
          <button
            className="btn primary sm"
            onClick={() => {
              if (nameInput.trim()) onSetMe(nameInput.trim());
            }}
          >
            Save
          </button>
        </div>
      </div>
    );

  return (
    <>
      <div className="chat-list">
        {msgs.length === 0 && <div className="empty big">No messages yet — say hello and start the {property === "General" ? "company" : property} chat.</div>}
        {msgs.map((m) => (
          <div className={"chat-msg" + (m.author === me ? " mine" : "") + (m.system ? " system" : "")} key={m.id}>
            <div className="chat-meta">
              {m.author} · {fmtTs(m.ts)}
            </div>
            {m.photoKey && photos[m.photoKey] && <img className="chat-img" src={photos[m.photoKey]} alt="" />}
            {m.text && <div className="chat-text">{m.text}</div>}
            <div className="react-row">
              {Object.entries(m.reactions || {}).map(([em, who]) => (
                <button
                  key={em}
                  className={"react-pill" + (who.includes(me) ? " mine" : "")}
                  title={who.join(", ")}
                  onClick={() => react(m.id, em)}
                >
                  {em} {who.length}
                </button>
              ))}
              {["👍", "😂", "🔥", "🍺"].map((em) =>
                (m.reactions || {})[em] ? null : (
                  <button key={em} className="react-add" onClick={() => react(m.id, em)}>
                    {em}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="chat-bar">
        <button className="chat-photo-btn" disabled={busy} onClick={() => fileRef.current && fileRef.current.click()}>
          📷
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickPhoto} />
        <input
          className="chat-input"
          value={text}
          placeholder={property === "General" ? "Message everyone…" : "Message " + property + "…"}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && send()}
        />
        <button className="btn primary sm" disabled={busy} onClick={() => send()}>
          {busy ? "…" : "Send"}
        </button>
      </div>
    </>
  );
}

/* ------------------ Main App ------------------ */

export default function App({ onSignOut, userEmail } = {}) {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("home");
  const [data, setData] = useState({
    mobs: [],
    moves: [],
    health: [],
    rain: [],
    trucking: [],
    maint: [],
    pasture: [],
    adjust: [],
    orders: [],
    musters: [],
    menu: [],
    marking: [],
    weaning: [],
    pregtest: [],
    pdkuse: [],
    shearing: [],
    woolsale: [],
    audit: [],
  });
  const [settings, setSettings] = useState({ properties: DEFAULT_PROPERTIES, classes: DEFAULT_CLASSES, pics: {}, breeds: DEFAULT_BREEDS, tagColours: DEFAULT_TAGS, statuses: DEFAULT_STATUSES, approvers: [], team: DEFAULT_TEAM, contractors: DEFAULT_CONTRACTORS, customPaddocks: {} });
  const [activeForm, setActiveForm] = useState(null); // e.g. "rain", "mob", {type:"moves", defaults}
  const [recordView, setRecordView] = useState(null); // record type key
  const [editMob, setEditMob] = useState(null);
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState(null); // { message, onYes }
  const [commentary, setCommentary] = useState({ prop: "", text: "", loading: false });
  const [me, setMe] = useState("");
  const [chatChannel, setChatChannel] = useState("General");
  const [pdkView, setPdkView] = useState("map"); // map = by paddock, list = stock register
  const [appError, setAppError] = useState("");
  const [storageMode, setStorageMode] = useState("checking");
  useEffect(() => {
    const h = (e) => {
      const msg = String((e && (e.message || (e.reason && e.reason.message))) || "Unknown error");
      if (/invalid response format/i.test(msg)) return; // storage bridge noise — handled by mode fallback
      setAppError(msg);
    };
    window.addEventListener("error", h);
    window.addEventListener("unhandledrejection", h);
    return () => {
      window.removeEventListener("error", h);
      window.removeEventListener("unhandledrejection", h);
    };
  }, []);
  const ask = (message, onYes) => setConfirm({ message, onYes });
  const canApprove = !settings.approvers?.length || (me && settings.approvers.includes(me));
  const [propFilter, setPropFilter] = useState("All");

  useEffect(() => {
    (async () => {
      await probeStorage();
      const loadAll = Promise.all([
        loadKey(KEYS.mobs, []),
        loadKey(KEYS.moves, []),
        loadKey(KEYS.health, []),
        loadKey(KEYS.rain, []),
        loadKey(KEYS.trucking, []),
        loadKey(KEYS.maint, []),
        loadKey(KEYS.pasture, []),
        loadKey(KEYS.adjust, []),
        loadKey(KEYS.orders, []),
        loadKey(KEYS.musters, []),
        loadKey(KEYS.menu, []),
        loadKey(KEYS.marking, []),
        loadKey(KEYS.weaning, []),
        loadKey(KEYS.pregtest, []),
        loadKey(KEYS.pdkuse, []),
        loadKey(KEYS.shearing, []),
        loadKey(KEYS.woolsale, []),
        loadKey(KEYS.settings, null),
      ]);
      // Paint fast: if storage is slow (rate limits etc.), fall back to the built-in baseline after 4s
      const timeout = new Promise((res) => setTimeout(() => res("__SLOW__"), 4000));
      const raced = await Promise.race([loadAll, timeout]);
      let mobs, moves, health, rain, trucking, maint, pasture, adjust, orders, musters, menu, marking, weaning, pregtest, pdkuse, shearing, woolsale, st;
      if (raced === "__SLOW__") {
        setStorageMode("memory");
        [mobs, moves, health, rain, trucking, maint, pasture, adjust, orders, musters, menu, marking, weaning, pregtest, pdkuse, shearing, woolsale, st] =
          [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], null];
        // keep listening: if storage answers later, quietly upgrade
        loadAll.then((vals) => {
          try {
            const [m2] = vals;
            if (m2 && m2.length) window.location.reload();
          } catch {}
        });
      } else {
        [mobs, moves, health, rain, trucking, maint, pasture, adjust, orders, musters, menu, marking, weaning, pregtest, pdkuse, shearing, woolsale, st] = raced;
      }
      const fromBaseline = (cur, k) => {
        if (cur && cur.length) return cur;
        const v = JSON.parse(JSON.stringify(BASELINE[k] || []));
        if (!PREVIEW && v.length) saveKey(KEYS[k], v);
        return v;
      };
      const auditData = raced === "__SLOW__" ? [] : await loadKey(KEYS.audit, []);
      setData({
        mobs: fromBaseline(mobs, "mobs"),
        moves: fromBaseline(moves, "moves"),
        health: fromBaseline(health, "health"),
        rain: fromBaseline(rain, "rain"),
        trucking: fromBaseline(trucking, "trucking"),
        maint: fromBaseline(maint, "maint"),
        pasture: fromBaseline(pasture, "pasture"),
        adjust: fromBaseline(adjust, "adjust"),
        orders: fromBaseline(orders, "orders"),
        musters: fromBaseline(musters, "musters"),
        menu: fromBaseline(menu, "menu"),
        marking: fromBaseline(marking, "marking"),
        weaning: fromBaseline(weaning, "weaning"),
        pregtest: fromBaseline(pregtest, "pregtest"),
        pdkuse: fromBaseline(pdkuse, "pdkuse"),
        shearing: fromBaseline(shearing, "shearing"),
        woolsale: fromBaseline(woolsale, "woolsale"),
        audit: auditData,
      });
      setSettings({
        properties: st?.properties || DEFAULT_PROPERTIES,
        classes: st?.classes || DEFAULT_CLASSES,
        pics: st?.pics || {},
        breeds: st?.breeds || DEFAULT_BREEDS,
        tagColours: st?.tagColours || DEFAULT_TAGS,
        statuses: st?.statuses || DEFAULT_STATUSES,
        approvers: st?.approvers || [],
        team: st?.team || DEFAULT_TEAM,
        contractors: st?.contractors || DEFAULT_CONTRACTORS,
        customPaddocks: st?.customPaddocks || {},
      });
      try {
        const meR = await window.storage.get("mp2:me", false);
        if (meR) setMe(meR.value);
      } catch {}
      setStorageMode(STORAGE.mode);
      setLoaded(true);
    })();
  }, []);

  const postToGeneralChat = async (text) => {
    try {
      const key = "mp2:chat:General";
      const latest = await loadKey(key, []);
      const msg = { id: uid(), author: me || "App", text, ts: Date.now(), system: true };
      await saveKey(key, [...latest, msg].slice(-MAX_CHAT_MSGS));
    } catch {}
  };

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  // Managers-only audit trail: stamps every action with the signed-in login.
  const logAudit = (action, summary) => {
    const entry = { id: uid(), ts: Date.now(), user: userEmail || "unknown", action, summary: summary || "" };
    setData((d) => {
      const next = [entry, ...(d.audit || [])].slice(0, 2000);
      if (!PREVIEW) saveKey(KEYS.audit, next);
      return { ...d, audit: next };
    });
  };

  const properties = settings.properties;
  const paddockMap = useMemo(() => {
    const map = {};
    properties.forEach((p) => {
      const names = new Set((PADDOCKS[p] || []).map((x) => x[0]));
      ((settings.customPaddocks || {})[p] || []).forEach((n) => names.add(n));
      map[p] = [...names].sort();
    });
    return map;
  }, [properties, settings.customPaddocks]);
  const [expandedPdk, setExpandedPdk] = useState("");
  const currentUse = (prop, pdk) => {
    const recs = data.pdkuse.filter((r) => r.property === prop && r.paddock === pdk);
    return recs.length ? recs[0].use : "";
  };
  const setUse = (prop, pdk, use) => {
    if (!use) return;
    const rec = { id: uid(), property: prop, paddock: pdk, use, date: todayStr(), by: me || "", createdAt: Date.now() };
    setAndSave("pdkuse", [rec, ...data.pdkuse]);
    flash(pdk + " → " + use);
  };
  const pdkHistory = (prop, pdk) => {
    const items = [];
    data.pdkuse.filter((r) => r.property === prop && r.paddock === pdk).forEach((r) => items.push({ d: r.date, t: "Use: " + r.use + (r.by ? " (" + r.by + ")" : ""), c: r.createdAt }));
    data.moves
      .filter((r) => r.property === prop && (r.toPaddock === pdk || r.fromPaddock === pdk))
      .forEach((r) =>
        items.push({
          d: r.date,
          t: (r.toPaddock === pdk ? "In: " : "Out: ") + (r.head ? r.head + " of " : "") + (r.mobName || "mob"),
          c: r.createdAt,
        })
      );
    data.pasture
      .filter((r) => r.property === prop && r.paddock === pdk)
      .forEach((r) => items.push({ d: r.date, t: "Pasture: " + r.condition + (r.pastureType ? " · " + r.pastureType : "") + (r.sown ? " · sown " + r.sown : "") + (r.foo ? " · " + r.foo + " kg DM/ha" : ""), c: r.createdAt }));
    return items.sort((a, b) => (b.c || 0) - (a.c || 0)).slice(0, 12);
  };
  const latestFoo = (prop, pdk) => {
    const recs = data.pasture
      .filter((r) => r.property === prop && r.paddock === pdk && num(r.foo) > 0)
      .sort((a, b) => (b.date > a.date ? 1 : -1));
    return recs.length ? { foo: num(recs[0].foo), date: recs[0].date } : null;
  };
  const paddocksFor = (prop) =>
    prop && paddockMap[prop] ? paddockMap[prop] : [...new Set(Object.values(paddockMap).flat())].sort();

  const mobById = (id) => data.mobs.find((m) => m.id === id);

  const setAndSave = (key, arr) => {
    setData((d) => ({ ...d, [key]: arr }));
    if (PREVIEW) return; // preview: in-session only
    saveKey(KEYS[key], arr).then((ok) => {
      if (!ok) setStorageMode("memory");
    });
  };

  /* ---- save handlers ---- */
  const saveRecord = (typeKey, rec) => {
    if (typeKey === "moves") {
      const mob = mobById(rec.mobId);
      rec.fromPaddock = mob?.paddock || "";
      rec.mobName = mob ? composeName(mob) : "";
      rec.property = mob?.property || "";
      const moveHead = Math.round(num(rec.head));
      const whole = !moveHead || moveHead >= num(mob?.head);
      let mobs;
      if (whole) {
        const destIdx = data.mobs.findIndex(
          (m) => m.id !== rec.mobId && m.property === rec.property && m.paddock === rec.toPaddock && composeName(m) === rec.mobName
        );
        if (destIdx >= 0) {
          rec.merged = true;
          rec.head = num(mob?.head);
          rec.mobSnapshot = { ...mob };
          mobs = data.mobs
            .map((m, i) => (i === destIdx ? { ...m, head: num(m.head) + num(mob?.head) } : m))
            .filter((m) => m.id !== rec.mobId);
          flash("Merged with the matching mob already in " + rec.toPaddock);
        } else {
          mobs = data.mobs.map((m) => (m.id === rec.mobId ? { ...m, paddock: rec.toPaddock } : m));
        }
      } else {
        rec.split = true;
        mobs = data.mobs.map((m) => (m.id === rec.mobId ? { ...m, head: num(m.head) - moveHead } : m));
        const destIdx = mobs.findIndex(
          (m) =>
            m.id !== rec.mobId &&
            m.property === rec.property &&
            m.paddock === rec.toPaddock &&
            composeName(m) === rec.mobName
        );
        if (destIdx >= 0) mobs[destIdx] = { ...mobs[destIdx], head: num(mobs[destIdx].head) + moveHead };
        else
          mobs = [
            { ...mob, id: uid(), head: moveHead, paddock: rec.toPaddock, createdAt: Date.now() },
            ...mobs,
          ];
      }
      setAndSave("mobs", mobs);
    }
    if (typeKey === "health") {
      const mob = mobById(rec.mobId);
      rec.mobName = mob ? composeName(mob) : "";
      rec.property = mob?.property || "";
      if (rec.whp) {
        const d = new Date(rec.date);
        d.setDate(d.getDate() + Math.round(num(rec.whp)));
        rec.whpClear = d.toISOString().slice(0, 10);
      }
      if (rec.esi) {
        const d = new Date(rec.date);
        d.setDate(d.getDate() + Math.round(num(rec.esi)));
        rec.esiClear = d.toISOString().slice(0, 10);
      }
    }
    if (typeKey === "trucking") {
      const head = Math.round(num(rec.head));
      let mobs = [...data.mobs];
      if (rec.ttype === "Purchase") {
        rec.property = rec.toProperty;
        mobs = [
          {
            id: uid(),
            name: rec.mobName,
            species: rec.species,
            cls: rec.cls,
            head,
            property: rec.toProperty,
            paddock: INBOX,
            createdAt: Date.now(),
          },
          ...mobs,
        ];
      } else {
        const loads = rec.loads || {};
        const ids = Object.keys(loads).filter((k) => num(loads[k]) > 0);
        const srcMobs = ids.map((id) => mobById(id)).filter(Boolean);
        rec.head = ids.reduce((a, id) => a + Math.round(num(loads[id])), 0);
        rec.mobName = srcMobs.map((m) => composeName(m)).join(" + ");
        rec.property = srcMobs[0]?.property || rec.fromProperty || "";
        rec.species = srcMobs[0]?.species || "";
        // deduct each load
        mobs = mobs.map((m) => (loads[m.id] !== undefined ? { ...m, head: num(m.head) - Math.round(num(loads[m.id])) } : m));
        const over = srcMobs.filter((m) => Math.round(num(loads[m.id])) > num(m.head));
        if (over.length) {
          setAppError("⚠ Loaded more than the book count for: " + over.map((m) => composeName(m)).join(", ") + " — recount to square up.");
        }
        if (rec.ttype === "Sale to market") {
          const hot = data.health.filter(
            (h) =>
              loads[h.mobId] !== undefined &&
              ((h.whpClear && h.whpClear >= todayStr()) || (h.esiClear && h.esiClear >= todayStr()))
          );
          if (hot.length) {
            const worst = hot.map((h) => [h.whpClear, h.esiClear].filter(Boolean).sort().pop()).sort().pop();
            rec.residueWarning = "Within WHP/ESI until " + fmtDate(worst);
            setAppError("⚠ A loaded mob is within a WHP/ESI period (until " + fmtDate(worst) + ") — check before consigning.");
          }
        }
        if (rec.ttype === "Property transfer") {
          srcMobs.forEach((src) => {
            mobs = [
              { ...src, id: uid(), head: Math.round(num(loads[src.id])), property: rec.toProperty, paddock: INBOX, createdAt: Date.now() },
              ...mobs,
            ];
          });
          postToGeneralChat(
            "🚚 " + rec.head + " hd " + (rec.mobName || "") + " — " + rec.property + " → " + rec.toProperty + " on " + fmtDate(rec.date) + " — coming your way, " + rec.toProperty + " 🚚 (they’ll be in your receiving yards)"
          );
        }
      }
      setAndSave("mobs", mobs);
    }
    if (typeKey === "musters") {
      postToGeneralChat(
        "📋 Heads up — " +
          rec.activity +
          " at " +
          rec.property +
          " on " +
          fmtDate(rec.date) +
          (rec.pdks ? " — " + rec.pdks : "") +
          (rec.startAt ? " · " + rec.startAt : "") +
          (rec.crew ? " · Crew: " + rec.crew : "")
      );
    }
    if (typeKey === "orders") {
      rec.status = "Pending";
      rec.requestedBy = me || "";
    }
    if (typeKey === "marking") {
      const mum = mobById(rec.mobId);
      rec.mobName = mum ? composeName(mum) : "";
      rec.property = mum?.property || "";
      const cls = mum?.species === "Cattle" ? "Calves" : "Lambs";
      const lambBreed = rec.lambBreed || mum?.breed || "";
      const isTerminal = (rec.terminal || "").startsWith("Yes");
      const sexes = [
        { head: Math.round(num(rec.msHead)), status: "MS" },
        { head: Math.round(num(rec.femHead)), status: mum?.species === "Cattle" ? "Heifers" : "Ewes" },
        { head: Math.round(num(rec.maleHead)), status: mum?.species === "Cattle" ? "Bulls" : "Rams" },
      ];
      let mobs = [...data.mobs];
      sexes.forEach(({ head, status }) => {
        if (!head) return;
        const idx = mobs.findIndex(
          (m) =>
            m.property === rec.property &&
            m.paddock === (mum?.paddock || "") &&
            m.cls === cls &&
            m.tag === currentYearTag() &&
            m.status === status &&
            (m.breed || "") === lambBreed
        );
        if (idx >= 0) mobs[idx] = { ...mobs[idx], head: num(mobs[idx].head) + head };
        else
          mobs = [
            {
              id: uid(),
              property: rec.property,
              paddock: mum?.paddock || "",
              species: mum?.species || "Sheep",
              cls,
              head,
              breed: lambBreed,
              tag: currentYearTag(),
              status,
              origin: "",
              name: "",
              notes: "At foot with " + rec.mobName + (isTerminal ? " · Terminal" : ""),
              createdAt: Date.now(),
            },
            ...mobs,
          ];
      });
      setAndSave("mobs", mobs);
    }
    if (typeKey === "weaning") {
      const src = mobById(rec.mobId);
      rec.mobName = src ? composeName(src) : "";
      rec.property = src?.property || "";
      const head = Math.round(num(rec.head));
      let mobs = data.mobs.map((m) => (m.id === rec.mobId ? { ...m, head: num(m.head) - head } : m));
      const pdk = rec.toPaddock || src?.paddock || "";
      const idx = mobs.findIndex(
        (m) => m.property === rec.property && m.cls === rec.newCls && m.tag === (src?.tag || "") && m.paddock === pdk
      );
      if (idx >= 0) mobs[idx] = { ...mobs[idx], head: num(mobs[idx].head) + head };
      else
        mobs = [
          {
            id: uid(),
            property: rec.property,
            paddock: pdk,
            species: src?.species || "Sheep",
            cls: rec.newCls,
            head,
            breed: src?.breed || "",
            tag: src?.tag || "",
            status: "",
            origin: "",
            name: "",
            notes: "Weaned ex " + rec.mobName,
            createdAt: Date.now(),
          },
          ...mobs,
        ];
      setAndSave("mobs", mobs);
    }
    if (typeKey === "pregtest") {
      const src = mobById(rec.mobId);
      rec.mobName = src ? composeName(src) : "";
      rec.property = src?.property || "";
      const head = Math.round(num(rec.head));
      let mobs = data.mobs.map((m) => (m.id === rec.mobId ? { ...m, head: num(m.head) - head } : m));
      const pdk = rec.toPaddock || src?.paddock || "";
      const cls = src?.species === "Sheep" ? "Dry sheep" : src?.cls || "Cows";
      mobs = [
        {
          id: uid(),
          property: rec.property,
          paddock: pdk,
          species: src?.species || "Sheep",
          cls,
          head,
          breed: src?.breed || "",
          tag: src?.tag || "",
          status: "PTE",
          origin: "",
          name: "",
          notes: "PTE ex " + rec.mobName,
          createdAt: Date.now(),
        },
        ...mobs,
      ];
      setAndSave("mobs", mobs);
    }
    if (typeKey === "shearing") {
      const mob = mobById(rec.mobId);
      rec.mobName = mob ? composeName(mob) : "";
      rec.property = mob?.property || "";
      rec.bookHead = num(mob?.head);
      rec.kgHead = num(rec.tally) > 0 ? num(rec.totalKg) / num(rec.tally) : 0;
      rec.cost = num(rec.rate) > 0 ? num(rec.rate) * num(rec.tally) : 0;
      rec.variance = Math.round(num(rec.tally)) - Math.round(num(mob?.head));
      if (rec.variance !== 0) {
        setAppError(
          "Shearing tally " + rec.tally + " vs book " + num(mob?.head) + " — " +
            (rec.variance > 0 ? rec.variance + " more shorn than the book (found?)" : Math.abs(rec.variance) + " short (missing?)") +
            ". Use Found/Missing on the mob to square the count."
        );
      }
    }
    if (typeKey === "adjust") {
      const mob = mobById(rec.mobId);
      rec.mobName = mob ? composeName(mob) : "";
      rec.property = mob?.property || "";
      rec.cls = mob?.cls || "";
      rec.species = mob?.species || "";
      const entered = num(rec.head);
      const minus = rec.reason === "Deaths" || rec.reason === "Mismustered / missing";
      const delta = rec.reason.startsWith("Recount")
        ? Math.round(entered) - Math.round(num(mob?.head))
        : rec.reason.startsWith("Correction")
        ? Math.round(entered)
        : Math.round(Math.abs(entered)) * (minus ? -1 : 1);
      rec.delta = delta;
      const mobs = data.mobs.map((m) => (m.id === rec.mobId ? { ...m, head: num(m.head) + delta } : m));
      setAndSave("mobs", mobs);
    }
    setAndSave(typeKey, [rec, ...data[typeKey]]);
    try {
      const s = summarise(typeKey, rec);
      logAudit(RECORD_TYPES[typeKey].single, [s.title, s.sub].filter(Boolean).join(" · "));
    } catch {}
    setActiveForm(null);
    flash("Saved");
  };

  const saveMob = (mob) => {
    const exists = data.mobs.some((m) => m.id === mob.id);
    const mobs = exists ? data.mobs.map((m) => (m.id === mob.id ? mob : m)) : [mob, ...data.mobs];
    setAndSave("mobs", mobs);
    logAudit(exists ? "Edit mob" : "New mob", composeName(mob) + (mob.property ? " — " + mob.property : ""));
    setActiveForm(null);
    setEditMob(null);
    flash("Mob saved");
  };

  const deleteMob = (id) => {
    const mob = data.mobs.find((m) => m.id === id);
    ask("Delete this mob? Records referencing it will remain.", () => {
      setAndSave(
        "mobs",
        data.mobs.filter((m) => m.id !== id)
      );
      logAudit("Delete mob", mob ? composeName(mob) + (mob.property ? " — " + mob.property : "") : id);
      flash("Mob deleted");
    });
  };

  const decideOrder = (id, decision) => {
    const orders = data.orders.map((o) =>
      o.id === id ? { ...o, status: decision, decidedBy: me || "", decidedAt: Date.now() } : o
    );
    setAndSave("orders", orders);
    const o = data.orders.find((x) => x.id === id);
    logAudit("PO " + decision, o ? (o.item || "") + " — $" + num(o.amount).toLocaleString() : "");
    flash("Order " + decision.toLowerCase());
  };

  const deleteRecord = (typeKey, id) => {
    const rec = (data[typeKey] || []).find((r) => r.id === id);
    const reverses = ["trucking", "adjust", "moves", "marking", "weaning", "pregtest"].includes(typeKey);
    ask(reverses ? "Undo this entry? Stock numbers and paddocks will be put back." : "Delete this record?", () => {
      let mobs = data.mobs;
      if (typeKey === "adjust" && rec && rec.delta) {
        mobs = mobs.map((m) => (m.id === rec.mobId ? { ...m, head: num(m.head) - num(rec.delta) } : m));
      }
      if (typeKey === "moves" && rec) {
        const n = Math.round(num(rec.head));
        if (rec.merged && rec.mobSnapshot) {
          const destIdx = mobs.findIndex(
            (m) => m.property === rec.property && m.paddock === rec.toPaddock && composeName(m) === rec.mobName
          );
          if (destIdx >= 0) mobs = mobs.map((m, i) => (i === destIdx ? { ...m, head: num(m.head) - n } : m));
          mobs = [{ ...rec.mobSnapshot, paddock: rec.fromPaddock || rec.mobSnapshot.paddock }, ...mobs];
        } else if (rec.split && n) {
          mobs = mobs.map((m) => (m.id === rec.mobId ? { ...m, head: num(m.head) + n } : m));
          const destIdx = mobs.findIndex(
            (m) => m.id !== rec.mobId && m.property === rec.property && m.paddock === rec.toPaddock && composeName(m) === rec.mobName
          );
          if (destIdx >= 0) mobs = mobs.map((m, i) => (i === destIdx ? { ...m, head: num(m.head) - n } : m));
        } else {
          mobs = mobs.map((m) => (m.id === rec.mobId ? { ...m, paddock: rec.fromPaddock || m.paddock } : m));
        }
      }
      if (typeKey === "marking" && rec) {
        const mum = mobs.find((m) => m.id === rec.mobId);
        const cls = mum?.species === "Cattle" ? "Calves" : "Lambs";
        const pairs = [
          [Math.round(num(rec.msHead)), "MS"],
          [Math.round(num(rec.femHead)), mum?.species === "Cattle" ? "Heifers" : "Ewes"],
          [Math.round(num(rec.maleHead)), mum?.species === "Cattle" ? "Bulls" : "Rams"],
        ];
        pairs.forEach(([n, status]) => {
          if (!n) return;
          const idx = mobs.findIndex(
            (m) => m.property === rec.property && m.cls === cls && m.status === status && m.paddock === (mum?.paddock || m.paddock)
          );
          if (idx >= 0) mobs = mobs.map((m, i) => (i === idx ? { ...m, head: num(m.head) - n } : m));
        });
      }
      if (typeKey === "weaning" && rec) {
        const n = Math.round(num(rec.head));
        mobs = mobs.map((m) => (m.id === rec.mobId ? { ...m, head: num(m.head) + n } : m));
        const idx = mobs.findIndex(
          (m) => m.id !== rec.mobId && m.property === rec.property && m.cls === rec.newCls && (rec.toPaddock ? m.paddock === rec.toPaddock : true)
        );
        if (idx >= 0) mobs = mobs.map((m, i) => (i === idx ? { ...m, head: num(m.head) - n } : m));
      }
      if (typeKey === "pregtest" && rec) {
        const n = Math.round(num(rec.head));
        mobs = mobs.map((m) => (m.id === rec.mobId ? { ...m, head: num(m.head) + n } : m));
        const idx = mobs.findIndex(
          (m) => m.id !== rec.mobId && m.property === rec.property && m.status === "PTE" && (m.notes || "").includes(rec.mobName)
        );
        if (idx >= 0) mobs = mobs.map((m, i) => (i === idx ? { ...m, head: num(m.head) - n } : m));
      }
      if (typeKey === "trucking" && rec) {
        const head = Math.round(num(rec.head));
        const loads = rec.loads || (rec.mobId ? { [rec.mobId]: head } : {});
        if (rec.ttype === "Sale to market") {
          mobs = mobs.map((m) => (loads[m.id] !== undefined ? { ...m, head: num(m.head) + Math.round(num(loads[m.id])) } : m));
        }
        if (rec.ttype === "Property transfer") {
          mobs = mobs.map((m) => (loads[m.id] !== undefined ? { ...m, head: num(m.head) + Math.round(num(loads[m.id])) } : m));
          Object.keys(loads).forEach((srcId) => {
            const src = mobs.find((m) => m.id === srcId);
            const n = Math.round(num(loads[srcId]));
            const destIdx = mobs.findIndex(
              (m) => m.id !== srcId && m.property === rec.toProperty && src && composeName(m) === composeName(src)
            );
            if (destIdx >= 0) mobs = mobs.map((m, i) => (i === destIdx ? { ...m, head: num(m.head) - n } : m));
          });
        }
        if (rec.ttype === "Purchase") {
          const idx = mobs.findIndex(
            (m) => m.property === rec.property && m.species === rec.species && m.cls === rec.cls && num(m.head) >= head
          );
          if (idx >= 0) mobs = mobs.map((m, i) => (i === idx ? { ...m, head: num(m.head) - head } : m));
        }
      }
      if (mobs !== data.mobs) setAndSave("mobs", mobs);
      setAndSave(
        typeKey,
        data[typeKey].filter((r) => r.id !== id)
      );
      try {
        const s = rec ? summarise(typeKey, rec) : { title: id, sub: "" };
        logAudit(reverses ? "Undo / delete" : "Delete", (RECORD_TYPES[typeKey]?.single || typeKey) + " · " + [s.title, s.sub].filter(Boolean).join(" · "));
      } catch {}
      flash(reverses ? "Deleted — stock numbers restored" : "Deleted");
    });
  };

  /* ---- derived stats ---- */
  const stats = useMemo(() => {
    const filt = propFilter === "All" ? data.mobs : data.mobs.filter((m) => m.property === propFilter);
    const cattle = filt.filter((m) => m.species === "Cattle").reduce((a, m) => a + num(m.head), 0);
    const sheep = filt.filter((m) => m.species === "Sheep").reduce((a, m) => a + num(m.head), 0);
    const dse = filt.reduce((a, m) => a + num(m.head) * dseFor(m), 0);
    const groups = {};
    filt.forEach((m) => {
      const g = groupFor(m);
      groups[g] = (groups[g] || 0) + num(m.head);
    });
    const cutoff = Date.now() - 30 * 86400000;
    const rain30 = {};
    properties.forEach((p) => (rain30[p] = 0));
    data.rain.forEach((r) => {
      const t = new Date(r.date).getTime();
      if (t >= cutoff && rain30[r.property] !== undefined) rain30[r.property] += num(r.mm);
    });
    const whpSrc = propFilter === "All" ? data.health : data.health.filter((h) => h.property === propFilter);
    const activeWhp = whpSrc.filter(
      (h) => (h.whpClear && h.whpClear >= todayStr()) || (h.esiClear && h.esiClear >= todayStr())
    );
    // 12-month reconciliation for budget allowances
    const yearAgo = Date.now() - 365 * 86400000;
    const adjSrc = (propFilter === "All" ? data.adjust : data.adjust.filter((a) => a.property === propFilter)).filter(
      (a) => new Date(a.date).getTime() >= yearAgo
    );
    const sumBy = (reason) => adjSrc.filter((a) => a.reason === reason).reduce((t, a) => t + Math.abs(num(a.delta)), 0);
    const trkSrc = (propFilter === "All" ? data.trucking : data.trucking.filter((t) => t.property === propFilter)).filter(
      (t) => new Date(t.date).getTime() >= yearAgo
    );
    const sold = trkSrc.filter((t) => t.ttype === "Sale to market").reduce((a, t) => a + num(t.head), 0);
    const bought = trkSrc.filter((t) => t.ttype === "Purchase").reduce((a, t) => a + num(t.head), 0);
    const recon = { deaths: sumBy("Deaths"), missing: sumBy("Mismustered / missing"), found: sumBy("Found"), sold, bought };
    const nlisOutstanding = (propFilter === "All" ? data.trucking : data.trucking.filter((t) => t.property === propFilter)).filter(
      (t) => t.nlis === "Not yet recorded"
    );
    return { cattle, sheep, dse, rain30, activeWhp, recon, nlisOutstanding, groups };
  }, [data, propFilter, properties]);

  const byProp = (arr) => (propFilter === "All" ? arr : arr.filter((r) => r.property === propFilter));

  const activity = useMemo(() => {
    const cutoff = Date.now() - 3 * 86400000; // last 3 days, then it expires
    const all = [];
    ["moves", "health", "rain", "trucking", "maint", "pasture", "adjust", "orders", "musters", "menu", "marking", "weaning", "pregtest", "shearing", "woolsale"].forEach((k) =>
      byProp(data[k]).forEach((r) => {
        if ((r.createdAt || 0) >= cutoff) all.push({ ...r, _type: k });
      })
    );
    return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 15);
  }, [data, propFilter]);

  /* ---- record summaries for list view ---- */
  const summarise = (typeKey, r) => {
    switch (typeKey) {
      case "moves":
        return {
          title: `${r.head ? r.head + " of " : ""}${r.mobName || "Mob"} → ${r.toPaddock}`,
          sub: `${r.fromPaddock ? `from ${r.fromPaddock} · ` : ""}${r.property || ""}`,
        };
      case "health":
        return {
          title: `${r.mobName || "Mob"} — ${r.product}`,
          sub: [
            r.dose,
            r.whpClear ? (r.whpClear >= todayStr() ? `WHP until ${fmtDate(r.whpClear)}` : "WHP clear") : "",
            r.esiClear ? (r.esiClear >= todayStr() ? `ESI until ${fmtDate(r.esiClear)}` : "ESI clear") : "",
          ]
            .filter(Boolean)
            .join(" · "),
        };
      case "rain":
        return { title: `${r.mm} mm — ${r.property}`, sub: r.notes || "" };
      case "trucking": {
        const arrow =
          r.ttype === "Property transfer"
            ? `${r.property} → ${r.toProperty}`
            : r.ttype === "Sale to market"
            ? `${r.property} → ${r.destination}`
            : `→ ${r.toProperty || r.property}`;
        const nlisFlag = r.nlis === "Not yet recorded" ? " · ⚠ NLIS outstanding" : "";
        const freight = num(r.freightCost)
          ? ` · freight $${num(r.freightCost).toLocaleString()} ($${(num(r.freightCost) / Math.max(1, num(r.head))).toFixed(2)}/hd)${
              r.invoiceRef ? " inv " + r.invoiceRef : " · no invoice yet"
            }`
          : "";
        return {
          title: `${r.ttype}: ${r.head} hd${r.mobName ? " " + r.mobName : r.cls ? " " + r.cls : ""}`,
          sub: `${arrow}${r.nvd ? " · NVD " + r.nvd : ""}${nlisFlag}${freight}`,
        };
      }
      case "orders":
        return {
          title: `${r.category}: ${r.item} — $${num(r.amount).toLocaleString()}`,
          sub: `${r.supplier} · ${r.property} · ${r.status}${r.decidedBy ? " by " + r.decidedBy : ""}${
            r.requestedBy ? " · raised by " + r.requestedBy : ""
          }`,
        };
      case "musters":
        return {
          title: `${r.activity} — ${r.property}${r.pdks ? " (" + r.pdks + ")" : ""}`,
          sub: `${r.startAt ? r.startAt + " · " : ""}${r.crew ? "Crew: " + r.crew : ""}`,
        };
      case "marking":
        return {
          title: `Marked ${num(r.msHead) + num(r.femHead) + num(r.maleHead)} — ${r.mobName}`,
          sub: [num(r.msHead) > 0 ? num(r.msHead) + " MS" : "", num(r.femHead) > 0 ? num(r.femHead) + " female" : "", num(r.maleHead) > 0 ? num(r.maleHead) + " male" : "", r.property || ""].filter(Boolean).join(" · "),
        };
      case "weaning":
        return { title: `Weaned ${r.head} into ${r.newCls}`, sub: `ex ${r.mobName}${r.toPaddock ? " → " + r.toPaddock : ""}` };
      case "pregtest":
        return { title: `PTE: ${r.head} drafted off`, sub: `ex ${r.mobName}${r.toPaddock ? " → " + r.toPaddock : ""}` };
      case "shearing":
        return {
          title: `Shorn ${r.tally} — ${r.mobName}`,
          sub: `${num(r.totalKg).toLocaleString()} kg · ${num(r.kgHead).toFixed(1)} kg/hd${r.micron ? " · " + r.micron + "µ" : ""}${
            r.contractor ? " · " + r.contractor : ""
          }${r.variance ? " · ⚠ tally " + (r.variance > 0 ? "+" : "") + r.variance + " vs book" : ""}`,
        };
      case "woolsale":
        return {
          title: `Wool out: ${num(r.kg).toLocaleString()} kg${r.bales ? " (" + r.bales + " bales)" : ""}`,
          sub: `${r.buyer}${r.price ? " · $" + num(r.price).toLocaleString() : ""}`,
        };
      case "menu":
        return { title: `${r.property} menu`, sub: `${r.meals}${r.cook ? " · Cook: " + r.cook : ""}` };
      case "adjust":
        return {
          title: `${r.mobName || "Mob"} — ${r.reason} (${r.delta > 0 ? "+" : ""}${r.delta})`,
          sub: r.property || "",
        };
      case "maint":
        return { title: `${r.asset} — ${r.property}`, sub: r.work };
      case "pasture":
        return {
          title: `${r.paddock} — ${r.condition}`,
          sub: `${r.property}${r.pastureType ? " · " + r.pastureType : ""}${r.sown ? " · sown " + r.sown : ""}${
            r.foo ? " · " + r.foo + " kg DM/ha" : ""
          }`,
        };
      default:
        return { title: "", sub: "" };
    }
  };

  /* ---- settings ops ---- */
  const addProperty = (name) => {
    if (!name.trim()) return;
    const next = { ...settings, properties: [...properties, name.trim()] };
    setSettings(next);
    saveKey(KEYS.settings, next);
  };
  const removeProperty = (name) => {
    ask(`Remove ${name} from the property list?`, () => {
      const next = { ...settings, properties: properties.filter((p) => p !== name) };
      setSettings(next);
      saveKey(KEYS.settings, next);
    });
  };

  const pastureCommentary = async (prop) => {
    setCommentary({ prop, text: "", loading: true });
    const yearAgo = Date.now() - 90 * 86400000;
    const rain90 = data.rain
      .filter((r) => r.property === prop && new Date(r.date).getTime() >= yearAgo)
      .reduce((a, r) => a + num(r.mm), 0);
    const rows = (paddockMap[prop] || []).map((pk) => {
      const inPdk = data.mobs.filter((m) => m.property === prop && m.paddock === pk && num(m.head) !== 0);
      const head = inPdk.reduce((a, m) => a + num(m.head), 0);
      const dse = inPdk.reduce((a, m) => a + num(m.head) * dseFor(m), 0);
      const ha = pdkArea(prop, pk);
      const foo = latestFoo(prop, pk);
      return `${pk}: ${ha} ha, ${head} head (${dse.toFixed(0)} DSE${ha ? ", " + (dse / ha).toFixed(2) + " DSE/ha" : ""})${
        foo ? ", FOO " + foo.foo + " kg DM/ha (as at " + foo.date + ")" : ", no FOO reading"
      }${inPdk.length ? " — " + inPdk.map((m) => composeName(m)).join("; ") : " — empty"}`;
    });
    const prompt =
      "You are a pasture and grazing adviser for an Australian livestock operation. Property: " +
      prop +
      ". Rainfall last 90 days: " +
      Math.round(rain90) +
      " mm. Paddock data (area, current stocking, feed on offer where measured):\n" +
      rows.join("\n") +
      "\n\nGive short practical commentary (under 250 words) on pasture availability and stocking: which paddocks look under pressure (high DSE/ha or low FOO), which have spare feed, suggested moves, and what to watch. Plain language for farm managers. No preamble.";
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const d = await response.json();
      const text = (d.content || [])
        .map((i) => (i.type === "text" ? i.text : ""))
        .filter(Boolean)
        .join("\n");
      setCommentary({ prop, text: text || "No commentary returned — try again.", loading: false });
    } catch (e) {
      setCommentary({ prop, text: "Could not generate commentary — check connection and try again.", loading: false });
    }
  };

  const importFoo = (prop, pasted) => {
    const lines = pasted.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const recs = [];
    const known = new Set(paddockMap[prop] || []);
    lines.forEach((line) => {
      const parts = line.split(/[\t,]+/).map((x) => x.trim());
      if (parts.length < 2) return;
      const val = parseFloat(parts[parts.length - 1].replace(/[^0-9.]/g, ""));
      const name = parts.slice(0, -1).join(", ");
      if (!name || isNaN(val)) return;
      recs.push({
        id: uid(),
        createdAt: Date.now(),
        date: todayStr(),
        property: prop,
        paddock: name,
        condition: val > 2000 ? "Good" : val > 1200 ? "Fair" : "Poor",
        foo: val,
        notes: "CiboLabs import" + (known.has(name) ? "" : " — paddock name not in list, check spelling"),
      });
    });
    if (recs.length) {
      setAndSave("pasture", [...recs, ...data.pasture]);
      flash(recs.length + " FOO readings imported");
    } else {
      flash("Nothing recognised — expected: paddock name, kg DM/ha per line");
    }
  };

  const downloadIcs = (r) => {
    const d = r.date.replace(/-/g, "");
    const end = new Date(r.date);
    end.setDate(end.getDate() + 1);
    const dEnd = end.toISOString().slice(0, 10).replace(/-/g, "");
    const esc = (t) => String(t || "").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Minto Pastoral//Farm Records//EN",
      "BEGIN:VEVENT",
      "UID:" + r.id + "@mintopastoral",
      "DTSTART;VALUE=DATE:" + d,
      "DTEND;VALUE=DATE:" + dEnd,
      "SUMMARY:" + esc(r.activity + " — " + r.property + (r.pdks ? " (" + r.pdks + ")" : "")),
      "DESCRIPTION:" + esc([r.startAt, r.crew ? "Crew: " + r.crew : "", r.notes].filter(Boolean).join(" | ")),
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (r.activity + "-" + r.property + "-" + r.date + ".ics").replace(/\s+/g, "-");
    a.click();
    URL.revokeObjectURL(url);
  };

  const [exportText, setExportText] = useState("");
  const exportData = () => {
    setExportText(JSON.stringify({ exported: new Date().toISOString(), build: BUILD, ...data }));
  };

  /* ---------------- render ---------------- */

  if (!loaded)
    return (
      <div className="app">
        <Style />
        <div className="loading">
          <img className="loading-logo" src={LOGO} alt="Minto Pastoral" />
          <div>Loading records…</div>
        </div>
      </div>
    );

  const formOverlay = activeForm && (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && setActiveForm(null)}>
      <div className="sheet">
        {activeForm === "mob" ? (
          <MobForm
            properties={properties}
            paddocksFor={paddocksFor}
            settings={settings}
            existing={editMob}
            onSave={saveMob}
            onCancel={() => {
              setActiveForm(null);
              setEditMob(null);
            }}
          />
        ) : (
          <RecordForm
            typeKey={activeForm.type || activeForm}
            defaults={activeForm.defaults}
            mobs={data.mobs}
            paddocksFor={paddocksFor}
            properties={properties}
            classes={settings.classes}
            breedList={settings.breeds || []}
            teamNames={[...(settings.team || []).map((t) => t.split(" — ")[0].trim()), ...(settings.contractors || [])]}
            onSave={(rec) => saveRecord(activeForm.type || activeForm, rec)}
            onCancel={() => setActiveForm(null)}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="app">
      <Style />
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo-box">
            <img className="brand-logo" src={LOGO} alt="Minto Pastoral" />
          </div>
          <div className="brand-sub">Farm records · build {BUILD}</div>
        </div>
        <select className="prop-filter" value={propFilter} onChange={(e) => setPropFilter(e.target.value)}>
          <option value="All">All properties</option>
          {properties.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </header>

      <main className="main">
        {PREVIEW && (
          <div className="preview-banner">
            👋 Preview for comment — have a look around, tap everything. Nothing you enter is kept. Send thoughts back
            in the WhatsApp group.
          </div>
        )}
        {!PREVIEW && storageMode === "personal" && (
          <div className="mode-banner">
            Shared storage unavailable on this device — running in device-only mode. Records save on this phone but the
            team will not see them.
          </div>
        )}
        {!PREVIEW && storageMode === "memory" && (
          <div className="mode-banner">
            Trial mode: records you enter last for this session only. Send permanent number changes to Chris to be
            locked into the next build.
          </div>
        )}
        {appError && (
          <div className="err-banner">
            App error: {appError}
            <button className="mini-btn" onClick={() => setAppError("")}>✕</button>
          </div>
        )}
        {/* ============ HOME ============ */}
        {tab === "home" && (
          <>
            <section className="stat-band">
              <div className="stat">
                <div className="stat-n">{stats.cattle.toLocaleString()}</div>
                <div className="stat-l">Cattle</div>
              </div>
              <div className="stat">
                <div className="stat-n">{stats.sheep.toLocaleString()}</div>
                <div className="stat-l">Sheep</div>
              </div>
              <div className="stat">
                <div className="stat-n">{Math.round(stats.dse).toLocaleString()}</div>
                <div className="stat-l">DSE</div>
              </div>
            </section>

            <section className="card">
              <div className="card-title">Stock breakdown</div>
              <div className="bd-grid">
                <div className="bd-col">
                  <div className="bd-sp">Cattle</div>
                  {["Cows", "Bulls", "Young cattle", "Calves at foot", "Other cattle"]
                    .filter((g) => (stats.groups[g] || 0) > 0 || g !== "Other cattle")
                    .map((g) => (
                      <div className="bd-row" key={g}>
                        <span>{g}</span>
                        <span className="bd-n">{(stats.groups[g] || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  <div className="bd-row bd-total">
                    <span>Total cattle</span>
                    <span className="bd-n">{stats.cattle.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bd-col">
                  <div className="bd-sp">Sheep</div>
                  {["Ewes", "Rams", "Young sheep", "Lambs at foot", "Other sheep"]
                    .filter((g) => (stats.groups[g] || 0) > 0 || g !== "Other sheep")
                    .map((g) => (
                      <div className="bd-row" key={g}>
                        <span>{g}</span>
                        <span className="bd-n">{(stats.groups[g] || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  <div className="bd-row bd-total">
                    <span>Total sheep</span>
                    <span className="bd-n">{stats.sheep.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="bd-grand">
                <span>Total stock</span>
                <span className="bd-n">{(stats.cattle + stats.sheep).toLocaleString()}</span>
              </div>
            </section>

            <section className="card">
              <div className="card-title">Stock by property</div>
              {(propFilter === "All" ? properties : properties.filter((p) => p === propFilter)).map((p) => {
                const list = data.mobs.filter((m) => m.property === p);
                const shp = list.filter((m) => m.species === "Sheep").reduce((a, m) => a + num(m.head), 0);
                const ctl = list.filter((m) => m.species === "Cattle").reduce((a, m) => a + num(m.head), 0);
                const pdse = list.reduce((a, m) => a + num(m.head) * dseFor(m), 0);
                return (
                  <div className="prop-stock-row" key={p} onClick={() => setPropFilter(p)}>
                    <span className="prop-stock-name">{p}</span>
                    <span className="prop-stock-nums">
                      <b>{shp.toLocaleString()}</b> sheep · <b>{ctl.toLocaleString()}</b> cattle
                      <span className="prop-stock-dse"> · {Math.round(pdse).toLocaleString()} DSE</span>
                    </span>
                  </div>
                );
              })}
            </section>

            {stats.activeWhp.length > 0 && (
              <section className="card whp-card">
                <div className="card-title">⚠ Active WHP / ESI</div>
                {stats.activeWhp.map((h) => (
                  <div className="rain-row" key={h.id}>
                    <span>
                      {h.mobName} — {h.product}
                    </span>
                    <span className="whp-date">
                      {[
                        h.whpClear && h.whpClear >= todayStr() ? "WHP " + fmtDate(h.whpClear) : "",
                        h.esiClear && h.esiClear >= todayStr() ? "ESI " + fmtDate(h.esiClear) : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                ))}
              </section>
            )}

            {byProp(data.mobs).filter((m) => num(m.head) < 0).length > 0 && (
              <section className="card whp-card">
                <div className="card-title">⚠ Negative counts — recount needed</div>
                {byProp(data.mobs)
                  .filter((m) => num(m.head) < 0)
                  .map((m) => (
                    <div className="rain-row" key={m.id}>
                      <span>
                        {composeName(m)} ({m.property}) — <b className="neg">{num(m.head)}</b>
                      </span>
                      <button
                        className="mini-btn"
                        onClick={() => setActiveForm({ type: "adjust", defaults: { mobId: m.id, reason: "Recount (set head to this number)" } })}
                      >
                        Recount
                      </button>
                    </div>
                  ))}
              </section>
            )}

            {data.mobs.filter((m) => m.paddock === INBOX && num(m.head) > 0 && (propFilter === "All" || m.property === propFilter)).length > 0 && (
              <section className="card inbox-card">
                <div className="card-title">🐂 Receiving yards — stock to allocate</div>
                {data.mobs
                  .filter((m) => m.paddock === INBOX && num(m.head) > 0 && (propFilter === "All" || m.property === propFilter))
                  .map((m) => (
                    <div className="rain-row" key={m.id}>
                      <span>
                        {composeName(m)} — {num(m.head).toLocaleString()} hd ({m.property})
                      </span>
                      <button className="mini-btn allocate" onClick={() => setActiveForm({ type: "moves", defaults: { mobId: m.id } })}>
                        Allocate
                      </button>
                    </div>
                  ))}
              </section>
            )}

            {byProp(data.musters).filter((m) => m.date >= todayStr()).length > 0 && (
              <section className="card muster-card">
                <div className="card-title">Coming up</div>
                {byProp(data.musters)
                  .filter((m) => m.date >= todayStr())
                  .sort((a, b) => (a.date > b.date ? 1 : -1))
                  .slice(0, 6)
                  .map((m) => (
                    <div className="po-row" key={m.id}>
                      <div className="pdk-main">
                        <div className="act-title">
                          {fmtDate(m.date)} — {m.activity} at {m.property}
                        </div>
                        <div className="act-sub">
                          {[m.pdks, m.startAt, m.crew ? "Crew: " + m.crew : ""].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <button className="mini-btn" onClick={() => downloadIcs(m)}>
                        📅
                      </button>
                    </div>
                  ))}
              </section>
            )}

            {byProp(data.menu).filter((m) => m.date >= todayStr()).length > 0 && (
              <section className="card menu-card">
                <div className="card-title">Menu</div>
                {byProp(data.menu)
                  .filter((m) => m.date >= todayStr())
                  .sort((a, b) => (a.date > b.date ? 1 : -1))
                  .slice(0, 4)
                  .map((m) => (
                    <div className="rain-row" key={m.id}>
                      <span>
                        <b>{fmtDate(m.date)} — {m.property}:</b> {m.meals}
                        {m.cook ? " (" + m.cook + ")" : ""}
                      </span>
                    </div>
                  ))}
              </section>
            )}

            {byProp(data.orders).filter((o) => o.status === "Pending").length > 0 && (
              <section className="card po-card">
                <div className="card-title">Purchase orders awaiting approval</div>
                {byProp(data.orders)
                  .filter((o) => o.status === "Pending")
                  .map((o) => (
                    <div className="po-row" key={o.id}>
                      <div className="pdk-main">
                        <div className="act-title">
                          {o.category}: {o.item} — ${num(o.amount).toLocaleString()}
                        </div>
                        <div className="act-sub">
                          {o.supplier} · {o.property}
                          {o.requestedBy ? " · raised by " + o.requestedBy : ""}
                        </div>
                      </div>
                      {canApprove ? (
                        <div className="po-actions">
                          <button className="mini-btn approve" onClick={() => decideOrder(o.id, "Approved")}>
                            Approve
                          </button>
                          <button className="mini-btn danger" onClick={() => decideOrder(o.id, "Declined")}>
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="po-wait">Awaiting approver</span>
                      )}
                    </div>
                  ))}
              </section>
            )}

            <section className="card">
              <div className="card-title">Spend this FY (approved)</div>
              {["Capex", "Maintenance"].map((cat) => {
                const fyStart = new Date("2026-07-01").getTime();
                const total = byProp(data.orders)
                  .filter((o) => o.status === "Approved" && o.category === cat && new Date(o.date).getTime() >= fyStart)
                  .reduce((a, o) => a + num(o.amount), 0);
                return (
                  <div className="rain-row" key={cat}>
                    <span>{cat}</span>
                    <span className="rain-mm">${total.toLocaleString()}</span>
                  </div>
                );
              })}
            </section>

            {stats.nlisOutstanding.length > 0 && (
              <section className="card whp-card">
                <div className="card-title">⚠ NLIS transfers outstanding</div>
                {stats.nlisOutstanding.slice(0, 5).map((t) => (
                  <div className="rain-row" key={t.id}>
                    <span>
                      {fmtDate(t.date)} — {t.head} hd {t.mobName || t.cls || ""}
                    </span>
                    <span className="whp-date">{t.ttype}</span>
                  </div>
                ))}
              </section>
            )}

            <section className="card">
              <div className="card-title">Reconciliation — last 12 months</div>
              <div className="rain-row"><span>Deaths</span><span className="recon-neg">−{stats.recon.deaths}</span></div>
              <div className="rain-row"><span>Mismustered / missing</span><span className="recon-neg">−{stats.recon.missing}</span></div>
              <div className="rain-row"><span>Found</span><span className="recon-pos">+{stats.recon.found}</span></div>
              <div className="rain-row"><span>Sold to market</span><span className="recon-neg">−{stats.recon.sold}</span></div>
              <div className="rain-row"><span>Purchased</span><span className="recon-pos">+{stats.recon.bought}</span></div>
              {stats.cattle + stats.sheep > 0 && (
                <div className="rain-row">
                  <span>Death + missing rate</span>
                  <span className="rain-mm">
                    {(((stats.recon.deaths + stats.recon.missing) / (stats.cattle + stats.sheep)) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </section>

            <section className="card">
              <div className="card-title">Recent activity — last 3 days</div>
              {activity.length === 0 && <div className="empty">Nothing in the last 3 days — full history lives in Recs.</div>}
              {activity.map((r) => {
                const s = summarise(r._type, r);
                return (
                  <div className="act-row" key={r.id}>
                    <span className="act-dot" style={{ background: TAG[r._type] }} />
                    <div className="act-body">
                      <div className="act-title">{s.title}</div>
                      <div className="act-sub">
                        {fmtDate(r.date)}
                        {s.sub ? " · " + s.sub : ""}
                      </div>
                    </div>
                    <button className="mini-btn danger" onClick={() => deleteRecord(r._type, r.id)}>
                      ✕
                    </button>
                  </div>
                );
              })}
            </section>

            {(() => {
              const allKg = data.shearing.reduce((a, r) => a + num(r.totalKg), 0);
              const outKg = data.woolsale.reduce((a, r) => a + num(r.kg), 0);
              const onHand = allKg - outKg;
              const bales = data.shearing.reduce((a, r) => a + num(r.bales), 0) - data.woolsale.reduce((a, r) => a + num(r.bales), 0);
              if (allKg <= 0) return null;
              return (
                <section className="card wool-card">
                  <div className="card-title">Wool on hand</div>
                  <div className="rain-row">
                    <span>In the shed</span>
                    <span className="rain-mm">
                      {Math.round(onHand).toLocaleString()} kg{bales > 0 ? " · " + bales + " bales" : ""}
                    </span>
                  </div>
                </section>
              );
            })()}

            <section className="card">
              <div className="card-title">Land use — ha</div>
              {LAND_USES.map((u) => {
                const props = propFilter === "All" ? properties : [propFilter];
                let ha = 0;
                props.forEach((p) =>
                  (paddockMap[p] || []).forEach((pk) => {
                    if (currentUse(p, pk) === u) ha += pdkArea(p, pk);
                  })
                );
                return (
                  <div className="rain-row" key={u}>
                    <span>{u}</span>
                    <span className="rain-mm">{Math.round(ha).toLocaleString()} ha</span>
                  </div>
                );
              })}
            </section>

            <section className="card">
              <div className="card-title">Rain — last 30 days</div>
              {(propFilter === "All" ? properties : properties.filter((p) => p === propFilter)).map((p) => (
                <div className="rain-row" key={p}>
                  <span>{p}</span>
                  <span className="rain-mm">{Math.round(stats.rain30[p] || 0)} mm</span>
                </div>
              ))}
            </section>
          </>
        )}

        {/* ============ MOBS ============ */}
        {tab === "paddocks" && propFilter !== "All" && pdkView === "list" && (
          <>
            <div className="section-head">
              <h2>Stock register</h2>
              <div className="head-btns">
                <button className="mini-btn" onClick={() => setPdkView("map")}>
                  By paddock
                </button>
                <button className="btn primary sm" onClick={() => setActiveForm("mob")}>
                  + New mob
                </button>
              </div>
            </div>
            {(propFilter === "All" ? properties : properties.filter((p) => p === propFilter)).map((prop) => {
              const list = data.mobs.filter((m) => m.property === prop);
              if (!list.length) return null;
              const head = list.reduce((a, m) => a + num(m.head), 0);
              return (
                <section key={prop} className="card">
                  <div className="card-title">
                    {prop} <span className="card-title-n">{head.toLocaleString()} hd</span>
                  </div>
                  {list.map((m) => (
                    <div className="mob-row" key={m.id}>
                      <div className="mob-info">
                        <div className="mob-name">{composeName(m)}</div>
                        <div className="mob-sub">
                          {m.species}
                          {dropLabel(m.tag) ? " · " + dropLabel(m.tag) : ""}
                        </div>
                        {m.notes && <div className="mob-note">{m.notes}</div>}
                      </div>
                      <div className={"mob-head" + (num(m.head) < 0 ? " neg" : "")}>{num(m.head).toLocaleString()}</div>
                      <div className="mob-actions">
                        <button className="mini-btn" onClick={() => setActiveForm({ type: "moves", defaults: { mobId: m.id } })}>
                          Move
                        </button>
                        <button className="mini-btn" onClick={() => setActiveForm({ type: "health", defaults: { mobId: m.id } })}>
                          Treat
                        </button>
                        {WOOL_ELIGIBLE(m) && (
                          <button className="mini-btn shear-btn" onClick={() => setActiveForm({ type: "shearing", defaults: { mobId: m.id } })}>
                            ✂️ Shear
                          </button>
                        )}
                        <button className="mini-btn" onClick={() => setActiveForm({ type: "marking", defaults: { mobId: m.id } })}>
                          Nat. incr
                        </button>
                        <button className="mini-btn" onClick={() => setActiveForm({ type: "weaning", defaults: { mobId: m.id } })}>
                          Wean
                        </button>
                        <button
                          className="mini-btn"
                          onClick={() => setActiveForm({ type: "trucking", defaults: { loads: { [m.id]: num(m.head) }, ttype: "Sale to market", fromProperty: m.property } })}
                        >
                          Sell
                        </button>
                        <button
                          className="mini-btn"
                          onClick={() => setActiveForm({ type: "trucking", defaults: { loads: { [m.id]: num(m.head) }, ttype: "Property transfer", fromProperty: m.property } })}
                        >
                          Transfer
                        </button>
                        <button className="mini-btn" onClick={() => setActiveForm({ type: "pregtest", defaults: { mobId: m.id } })}>
                          PTE
                        </button>
                        <button
                          className="mini-btn danger"
                          onClick={() => setActiveForm({ type: "adjust", defaults: { mobId: m.id, reason: "Deaths" } })}
                        >
                          Deaths
                        </button>
                        <button
                          className="mini-btn"
                          onClick={() => setActiveForm({ type: "adjust", defaults: { mobId: m.id, reason: "Mismustered / missing" } })}
                        >
                          Missing
                        </button>
                        <button
                          className="mini-btn"
                          onClick={() => setActiveForm({ type: "adjust", defaults: { mobId: m.id, reason: "Found" } })}
                        >
                          Found
                        </button>
                        <button
                          className="mini-btn"
                          onClick={() => {
                            setEditMob(m);
                            setActiveForm("mob");
                          }}
                        >
                          Edit
                        </button>
                        <button className="mini-btn danger" onClick={() => deleteMob(m.id)}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              );
            })}
            {data.mobs.length === 0 && (
              <div className="empty big">No mobs yet. Add your first mob to start tracking stock numbers.</div>
            )}
          </>
        )}

        {/* ============ RECORDS ============ */}
        {tab === "records" && !recordView && (
          <>
            <div className="section-head">
              <h2>Records</h2>
            </div>
            {Object.entries(RECORD_TYPES).map(([k, cfg]) => (
              <button className="rec-cat" key={k} onClick={() => setRecordView(k)}>
                <span className="act-dot lg" style={{ background: cfg.tag }} />
                <span className="rec-cat-label">{cfg.label}</span>
                <span className="rec-cat-n">{byProp(data[k]).length}</span>
                <span className="rec-cat-arrow">›</span>
              </button>
            ))}
          </>
        )}

        {tab === "records" && recordView && (
          <>
            <div className="section-head">
              <button className="back" onClick={() => setRecordView(null)}>
                ‹ Records
              </button>
              <button className="btn primary sm" onClick={() => setActiveForm(recordView)}>
                + Add
              </button>
            </div>
            <h2 className="rec-h">{RECORD_TYPES[recordView].label}</h2>
            {byProp(data[recordView]).length === 0 && <div className="empty big">No {RECORD_TYPES[recordView].label.toLowerCase()} yet.</div>}
            {byProp(data[recordView]).map((r) => {
              const s = summarise(recordView, r);
              return (
                <div className="card rec-item" key={r.id}>
                  <div className="rec-item-main">
                    <div className="act-title">{s.title}</div>
                    <div className="act-sub">
                      {fmtDate(r.date)}
                      {s.sub ? " · " + s.sub : ""}
                    </div>
                    {r.notes && <div className="rec-notes">{r.notes}</div>}
                  </div>
                  <div className="rec-item-actions">
                    {recordView === "musters" && (
                      <button className="mini-btn" onClick={() => downloadIcs(r)}>
                        📅
                      </button>
                    )}
                    {recordView === "orders" && r.status === "Pending" && canApprove && (
                      <>
                        <button className="mini-btn approve" onClick={() => decideOrder(r.id, "Approved")}>
                          Approve
                        </button>
                        <button className="mini-btn danger" onClick={() => decideOrder(r.id, "Declined")}>
                          Decline
                        </button>
                      </>
                    )}
                    <button className="mini-btn danger" onClick={() => deleteRecord(recordView, r.id)}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ============ RAIN ============ */}
        {tab === "rain" && (
          <>
            <div className="section-head">
              <h2>Rainfall</h2>
              <button className="btn primary sm" onClick={() => setActiveForm("rain")}>
                + Add reading
              </button>
            </div>
            <section className="card">
              <div className="card-title">Last 30 days</div>
              {(propFilter === "All" ? properties : properties.filter((p) => p === propFilter)).map((p) => (
                <div className="rain-row" key={p}>
                  <span>{p}</span>
                  <span className="rain-mm">{Math.round(stats.rain30[p] || 0)} mm</span>
                </div>
              ))}
            </section>
            <section className="card">
              <div className="card-title">Last 12 months</div>
              {(propFilter === "All" ? properties : properties.filter((p) => p === propFilter)).map((p) => {
                const yearAgo = Date.now() - 365 * 86400000;
                const mm = data.rain
                  .filter((r) => r.property === p && new Date(r.date).getTime() >= yearAgo)
                  .reduce((a, r) => a + num(r.mm), 0);
                return (
                  <div className="rain-row" key={p}>
                    <span>{p}</span>
                    <span className="rain-mm">{Math.round(mm)} mm</span>
                  </div>
                );
              })}
            </section>
            <section className="card">
              <div className="card-title">Recent readings</div>
              {byProp(data.rain).length === 0 && <div className="empty">No rainfall recorded yet.</div>}
              {byProp(data.rain)
                .slice(0, 15)
                .map((r) => (
                  <div className="rain-row" key={r.id}>
                    <span>
                      {fmtDate(r.date)} — {r.property}
                      {r.notes ? " · " + r.notes : ""}
                    </span>
                    <span className="rain-mm">{r.mm} mm</span>
                  </div>
                ))}
            </section>
          </>
        )}

        {/* ============ PADDOCKS ============ */}
        {tab === "paddocks" && propFilter === "All" && (
          <>
            <div className="section-head">
              <h2>Paddocks</h2>
            </div>
            <p className="note">Pick a property to see its paddocks — each property stays separate.</p>
            {properties.map((p) => (
              <button className="rec-cat" key={p} onClick={() => setPropFilter(p)}>
                <span className="rec-cat-label">{p}</span>
                <span className="rec-cat-n">{(paddockMap[p] || []).length} pdks</span>
                <span className="rec-cat-arrow">›</span>
              </button>
            ))}
          </>
        )}
        {tab === "paddocks" && propFilter !== "All" && pdkView === "map" && (
          <>
            <div className="section-head">
              <h2>Paddocks</h2>
              <div className="head-btns">
                <button className="mini-btn" onClick={() => setPdkView("list")}>
                  Register
                </button>
                <button className="btn primary sm" onClick={() => setActiveForm("mob")}>
                  + Mob
                </button>
                <button className="mini-btn" disabled={commentary.loading} onClick={() => pastureCommentary(propFilter)}>
                  {commentary.loading && commentary.prop === propFilter ? "…" : "🌱"}
                </button>
              </div>
            </div>
            {(() => {
              const recs = data.adjust.filter(
                (a) => a.property === propFilter && (a.reason === "Mismustered / missing" || a.reason === "Found")
              );
              if (!recs.length) return null;
              const missing = recs.filter((a) => a.reason === "Mismustered / missing").reduce((t, a) => t + Math.abs(num(a.delta)), 0);
              const found = recs.filter((a) => a.reason === "Found").reduce((t, a) => t + Math.abs(num(a.delta)), 0);
              const net = found - missing;
              const byCls = {};
              recs.forEach((a) => {
                const k = a.cls || a.mobName || "Unclassed";
                if (!byCls[k]) byCls[k] = { missing: 0, found: 0 };
                byCls[k][a.reason === "Found" ? "found" : "missing"] += Math.abs(num(a.delta));
              });
              return (
                <section className="card tally-card">
                  <div className="card-title">
                    Muster tally — {propFilter}
                    <span className={net >= 0 ? "recon-pos" : "recon-neg"}>
                      {net >= 0 ? net + " in front" : Math.abs(net) + " behind"}
                    </span>
                  </div>
                  {Object.entries(byCls).map(([k, v]) => (
                    <div className="rain-row" key={k}>
                      <span>{k}</span>
                      <span>
                        {v.missing > 0 && <span className="recon-neg">−{v.missing} missing</span>}
                        {v.missing > 0 && v.found > 0 && " · "}
                        {v.found > 0 && <span className="recon-pos">+{v.found} found</span>}
                      </span>
                    </div>
                  ))}
                </section>
              );
            })()}
            {commentary.prop === propFilter && commentary.text && (
              <section className="card commentary-card">
                <div className="card-title">Pasture commentary — {propFilter}</div>
                <div className="commentary-text">{commentary.text}</div>
              </section>
            )}
            {[propFilter].map((prop) => {
              const pdks = paddockMap[prop] || [];
              if (!pdks.length)
                return (
                  <section key={prop} className="card">
                    <div className="card-title">{prop}</div>
                    <div className="empty">No paddocks listed yet.</div>
                  </section>
                );
              const stocked = pdks.filter((pk) => data.mobs.some((m) => m.property === prop && m.paddock === pk && num(m.head) !== 0));
              return (
                <section key={prop} className="card">
                  <div className="card-title">
                    {prop}
                    <span className="card-title-n">
                      {stocked.length} of {pdks.length} stocked · {Math.round((PADDOCKS[prop] || []).reduce((a, x) => a + x[1], 0)).toLocaleString()} ha
                    </span>
                  </div>
                  {data.mobs.filter((m) => m.property === prop && m.paddock !== INBOX && num(m.head) > 0 && (!m.paddock || !(paddockMap[prop] || []).includes(m.paddock))).map((m) => (
                    <div className="inbox-row" key={m.id}>
                      <div className="pdk-main">
                        <div className="pdk-name">Unallocated — no paddock recorded</div>
                        <div className="pdk-mob">
                          <span>
                            {composeName(m)} — {num(m.head).toLocaleString()}
                          </span>
                          <button className="mini-btn allocate" onClick={() => setActiveForm({ type: "moves", defaults: { mobId: m.id } })}>
                            Allocate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {data.mobs.filter((m) => m.property === prop && m.paddock === INBOX && num(m.head) > 0).map((m) => (
                    <div className="inbox-row" key={m.id}>
                      <div className="pdk-main">
                        <div className="pdk-name">🐂 Receiving yards — awaiting allocation</div>
                        <div className="pdk-mob">
                          <span>
                            {composeName(m)} — {num(m.head).toLocaleString()}
                          </span>
                          <button
                            className="mini-btn allocate"
                            onClick={() => setActiveForm({ type: "moves", defaults: { mobId: m.id } })}
                          >
                            Allocate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pdks.map((pk) => {
                    const inPdk = data.mobs.filter((m) => m.property === prop && m.paddock === pk && num(m.head) !== 0);
                    const head = inPdk.reduce((a, m) => a + num(m.head), 0);
                    return (
                      <div className={"pdk-row" + (inPdk.length ? "" : " pdk-empty")} key={pk}>
                        <div className="pdk-main">
                          <div className="pdk-name" onClick={() => setExpandedPdk(expandedPdk === pk ? "" : pk)}>
                            {pk}
                            {pdkArea(prop, pk) > 0 && <span className="pdk-ha"> {pdkArea(prop, pk).toLocaleString()} ha</span>}
                            {currentUse(prop, pk) && <span className="pdk-use-tag"> · {currentUse(prop, pk)}</span>}
                            {latestFoo(prop, pk) && (
                              <span className="pdk-foo"> · {latestFoo(prop, pk).foo.toLocaleString()} kg DM/ha</span>
                            )}
                          </div>
                          {expandedPdk === pk && (
                            <div className="pdk-detail">
                              <select
                                className="use-select"
                                value={currentUse(prop, pk)}
                                onChange={(e) => setUse(prop, pk, e.target.value)}
                              >
                                <option value="">Set land use…</option>
                                {LAND_USES.map((u) => (
                                  <option key={u}>{u}</option>
                                ))}
                              </select>
                              {pdkHistory(prop, pk).length > 0 && (
                                <div className="pdk-hist">
                                  {pdkHistory(prop, pk).map((h, i) => (
                                    <div className="pdk-hist-row" key={i}>
                                      <span className="pdk-hist-date">{fmtDate(h.d)}</span> {h.t}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {inPdk.map((m) => (
                            <div className="pdk-mob-block" key={m.id}>
                              <div className="pdk-mob">
                                <span className={num(m.head) < 0 ? "neg" : ""}>
                                  {composeName(m)} — {num(m.head).toLocaleString()}
                                </span>
                              </div>
                              <div className="pdk-mob-actions">
                                <button className="mini-btn" onClick={() => setActiveForm({ type: "moves", defaults: { mobId: m.id } })}>
                                  Move
                                </button>
                                <button className="mini-btn" onClick={() => setActiveForm({ type: "health", defaults: { mobId: m.id } })}>
                                  Treat
                                </button>
                                {WOOL_ELIGIBLE(m) && (
                                  <button className="mini-btn shear-btn" onClick={() => setActiveForm({ type: "shearing", defaults: { mobId: m.id } })}>
                                    ✂️ Shear
                                  </button>
                                )}
                                <button className="mini-btn" onClick={() => setActiveForm({ type: "marking", defaults: { mobId: m.id } })}>
                                  Nat. incr
                                </button>
                                <button className="mini-btn" onClick={() => setActiveForm({ type: "weaning", defaults: { mobId: m.id } })}>
                                  Wean
                                </button>
                                <button
                                  className="mini-btn"
                                  onClick={() => setActiveForm({ type: "trucking", defaults: { loads: { [m.id]: num(m.head) }, ttype: "Sale to market", fromProperty: m.property } })}
                                >
                                  Sell
                                </button>
                                <button
                                  className="mini-btn"
                                  onClick={() => setActiveForm({ type: "trucking", defaults: { loads: { [m.id]: num(m.head) }, ttype: "Property transfer", fromProperty: m.property } })}
                                >
                                  Transfer
                                </button>
                                <button className="mini-btn" onClick={() => setActiveForm({ type: "pregtest", defaults: { mobId: m.id } })}>
                                  PTE
                                </button>
                                <button
                                  className="mini-btn danger"
                                  onClick={() => setActiveForm({ type: "adjust", defaults: { mobId: m.id, reason: "Deaths" } })}
                                >
                                  Deaths
                                </button>
                                <button
                                  className="mini-btn"
                                  onClick={() => setActiveForm({ type: "adjust", defaults: { mobId: m.id, reason: "Mismustered / missing" } })}
                                >
                                  Missing
                                </button>
                                <button
                                  className="mini-btn"
                                  onClick={() => setActiveForm({ type: "adjust", defaults: { mobId: m.id, reason: "Found" } })}
                                >
                                  Found
                                </button>
                              </div>
                            </div>
                          ))}
                          {!inPdk.length && <div className="pdk-none">Empty</div>}
                        </div>
                        {head !== 0 && (
                          <div className="pdk-nums">
                            <div className={"mob-head" + (head < 0 ? " neg" : "")}>{head.toLocaleString()}</div>
                            {head > 0 && pdkArea(prop, pk) > 0 && (
                              <div className="pdk-dse">
                                {(inPdk.reduce((a, m) => a + num(m.head) * dseFor(m), 0) / pdkArea(prop, pk)).toFixed(1)} DSE/ha
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </>
        )}

        {/* ============ WOOL ============ */}
        {tab === "wool" && (
          <>
            <div className="section-head">
              <h2>Shearing & wool</h2>
              <button className="btn primary sm" onClick={() => setActiveForm("woolsale")}>
                🚚 Truck wool
              </button>
            </div>
            {(() => {
              const shear = byProp(data.shearing);
              const sales = data.woolsale;
              const fy = (r) => new Date(r.date).getTime() >= new Date("2026-07-01").getTime();
              const sfy = shear.filter(fy);
              const shorn = sfy.reduce((a, r) => a + num(r.tally), 0);
              const kg = sfy.reduce((a, r) => a + num(r.totalKg), 0);
              const cost = sfy.reduce((a, r) => a + num(r.cost), 0);
              const micronW = kg > 0 ? sfy.reduce((a, r) => a + num(r.micron) * num(r.totalKg), 0) / sfy.filter((r) => num(r.micron) > 0).reduce((a, r) => a + num(r.totalKg), 0.0001) : 0;
              const outKg = data.woolsale.reduce((a, r) => a + num(r.kg), 0);
              const allKg = data.shearing.reduce((a, r) => a + num(r.totalKg), 0);
              const onHand = allKg - outKg;
              const outBales = data.woolsale.reduce((a, r) => a + num(r.bales), 0);
              const allBales = data.shearing.reduce((a, r) => a + num(r.bales), 0);
              return (
                <>
                  <section className="card wool-card">
                    <div className="card-title">This season (from 1 Jul)</div>
                    <div className="rain-row"><span>Sheep shorn</span><span className="rain-mm">{shorn.toLocaleString()}</span></div>
                    <div className="rain-row"><span>Wool</span><span className="rain-mm">{Math.round(kg).toLocaleString()} kg</span></div>
                    <div className="rain-row"><span>Average cut</span><span className="rain-mm">{shorn > 0 ? (kg / shorn).toFixed(1) : "0"} kg/hd</span></div>
                    {micronW > 0 && <div className="rain-row"><span>Average micron</span><span className="rain-mm">{micronW.toFixed(1)}µ</span></div>}
                    {cost > 0 && <div className="rain-row"><span>Shearing cost</span><span className="rain-mm">${Math.round(cost).toLocaleString()}{shorn > 0 ? " ($" + (cost / shorn).toFixed(2) + "/hd)" : ""}</span></div>}
                  </section>
                  <section className="card wool-card">
                    <div className="card-title">Wool on hand</div>
                    <div className="rain-row"><span>In the shed</span><span className="rain-mm">{Math.round(onHand).toLocaleString()} kg{allBales - outBales > 0 ? " · " + (allBales - outBales) + " bales" : ""}</span></div>
                    <div className="rain-row"><span>Trucked to date</span><span>{Math.round(outKg).toLocaleString()} kg{outBales > 0 ? " · " + outBales + " bales" : ""}</span></div>
                  </section>
                </>
              );
            })()}

            <section className="card">
              <div className="card-title">Shearing records</div>
              {byProp(data.shearing).length === 0 && <div className="empty">Nothing shorn yet.</div>}
              {byProp(data.shearing).map((r) => {
                const su = summarise("shearing", r);
                return (
                  <div className="act-row" key={r.id}>
                    <span className="act-dot" style={{ background: TAG.shearing }} />
                    <div className="act-body">
                      <div className="act-title">{su.title}</div>
                      <div className="act-sub">{fmtDate(r.date)} · {su.sub}</div>
                    </div>
                  </div>
                );
              })}
            </section>
            <section className="card">
              <div className="card-title">Wool trucked</div>
              {data.woolsale.length === 0 && <div className="empty">No wool trucked yet.</div>}
              {data.woolsale.map((r) => {
                const su = summarise("woolsale", r);
                return (
                  <div className="act-row" key={r.id}>
                    <span className="act-dot" style={{ background: TAG.woolsale }} />
                    <div className="act-body">
                      <div className="act-title">{su.title}</div>
                      <div className="act-sub">{fmtDate(r.date)} · {su.sub}</div>
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {/* ============ CHAT ============ */}
        {tab === "chat" && (
          <>
            <div className="section-head">
              <h2>{chatChannel === "General" ? "Minto Pastoral chat" : chatChannel + " chat"}</h2>
            </div>
            <div className="chan-row">
              {["General", ...properties].map((c) => (
                <button
                  key={c}
                  className={"chan-chip" + (chatChannel === c ? " active" : "")}
                  onClick={() => setChatChannel(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <ChatScreen
              property={chatChannel}
              me={me}
              onSetMe={(name) => {
                setMe(name);
                try {
                  window.storage.set("mp2:me", name, false);
                } catch {}
              }}
            />
          </>
        )}

        {/* ============ SETUP ============ */}
        {tab === "setup" && !canApprove && (
          <>
            <div className="section-head">
              <h2>Setup</h2>
            </div>
            <section className="card">
              <div className="card-title">🔒 Managers only</div>
              <p className="note">
                Setup is locked to the managers on the approvers list to prevent accidental changes — property lists,
                stock classes, team, and the stock take reset all live here.
              </p>
              <p className="note">
                You are signed in as: <b>{me || "no name set — enter your name in Chat"}</b>. If you should have
                access, ask Chris or Gwen to add your name to the approvers list.
              </p>
            </section>
          </>
        )}
        {tab === "setup" && canApprove && (
          <>
            <div className="section-head">
              <h2>Setup</h2>
            </div>
            <ActivityLog audit={data.audit || []} />
            <section className="card">
              <div className="card-title">Properties & PICs</div>
              {properties.map((p) => (
                <div className="rain-row" key={p}>
                  <span className="prop-name">{p}</span>
                  <input
                    className="pic-input"
                    placeholder="PIC (NLIS)"
                    value={settings.pics?.[p] || ""}
                    onChange={(e) => {
                      const next = { ...settings, pics: { ...settings.pics, [p]: e.target.value.toUpperCase() } };
                      setSettings(next);
                      saveKey(KEYS.settings, next);
                    }}
                  />
                  <button className="mini-btn danger" onClick={() => removeProperty(p)}>
                    ✕
                  </button>
                </div>
              ))}
              <PropAdder onAdd={addProperty} />
              <div className="f-row" style={{ marginTop: 10 }}>
                <label className="f-label">Add paddock to a property</label>
              </div>
              <PdkAdder
                properties={properties}
                onAdd={(prop, name) => {
                  if (!name.trim()) return;
                  const cur = (settings.customPaddocks || {})[prop] || [];
                  const next = { ...settings, customPaddocks: { ...settings.customPaddocks, [prop]: [...cur, name.trim()] } };
                  setSettings(next);
                  saveKey(KEYS.settings, next);
                  flash(name.trim() + " added to " + prop);
                }}
              />
            </section>
            <section className="card">
              <div className="card-title">Team</div>
              <p className="note">Everyone on the payroll (and the kids). Format: Name — where they are. Used for muster crew picks.</p>
              <ClassEditor
                species="Team"
                list={settings.team || []}
                onChange={(list) => {
                  const next = { ...settings, team: list };
                  setSettings(next);
                  saveKey(KEYS.settings, next);
                }}
              />
              <ClassEditor
                species="Regular contractors"
                list={settings.contractors || []}
                onChange={(list) => {
                  const next = { ...settings, contractors: list };
                  setSettings(next);
                  saveKey(KEYS.settings, next);
                }}
              />
            </section>
            <section className="card">
              <div className="card-title">Purchase order approvers</div>
              <p className="note">
                Only these names can approve or decline purchase orders (e.g. Finance Manager, General Manager). Names
                must match the name entered in Chat. Leave empty to let anyone approve while testing.
              </p>
              <ClassEditor
                species="Approvers"
                list={settings.approvers || []}
                onChange={(list) => {
                  const next = { ...settings, approvers: list };
                  setSettings(next);
                  saveKey(KEYS.settings, next);
                }}
              />
              <p className="note">You are signed in as: {me || "no name set — enter one in Chat"}</p>
            </section>
            <section className="card">
              <div className="card-title">Stock description parts</div>
              <p className="note">
                Mob descriptions are built the same way every time: Breed · Tag · Class · Status · Origin. Add to these
                lists as needed — everyone picks from the same options.
              </p>
              <ClassEditor
                species="Breeds"
                list={settings.breeds || []}
                onChange={(list) => {
                  const next = { ...settings, breeds: list };
                  setSettings(next);
                  saveKey(KEYS.settings, next);
                }}
              />
              <ClassEditor
                species="Tag colours"
                list={settings.tagColours || []}
                onChange={(list) => {
                  const next = { ...settings, tagColours: list };
                  setSettings(next);
                  saveKey(KEYS.settings, next);
                }}
              />
              {["Cattle", "Sheep"].map((sp) => (
                <ClassEditor
                  key={sp}
                  species={sp + " classes"}
                  list={settings.classes?.[sp] || []}
                  onChange={(list) => {
                    const next = { ...settings, classes: { ...settings.classes, [sp]: list } };
                    setSettings(next);
                    saveKey(KEYS.settings, next);
                  }}
                />
              ))}
              {["Cattle", "Sheep"].map((sp) => (
                <ClassEditor
                  key={sp + "st"}
                  species={sp + " statuses"}
                  list={settings.statuses?.[sp] || []}
                  onChange={(list) => {
                    const next = { ...settings, statuses: { ...settings.statuses, [sp]: list } };
                    setSettings(next);
                    saveKey(KEYS.settings, next);
                  }}
                />
              ))}
            </section>
            <FooImport properties={properties} onImport={importFoo} />
            {onSignOut && (
              <section className="card">
                <div className="card-title">Account</div>
                <p className="note">
                  Signed in as <b>{userEmail || "—"}</b>.
                </p>
                <div className="btn-row" style={{ justifyContent: "flex-start" }}>
                  <button className="btn ghost" onClick={onSignOut}>
                    Sign out
                  </button>
                </div>
              </section>
            )}
            <section className="card">
              <div className="card-title">Data</div>
              <p className="note">
                Storage mode: <b>{storageMode}</b>.{" "}
                {storageMode === "shared"
                  ? "Everyone using this app sees and edits the same data."
                  : storageMode === "personal"
                  ? "Device-only — records save on this phone but are not shared with the team."
                  : "Nothing persists — export before closing."}{" "}
                Export a backup any time.
              </p>
              <div className="btn-row" style={{ justifyContent: "flex-start" }}>
                <button
                  className="btn primary"
                  onClick={() => {
                    const doLoad = () => {
                      setAndSave("mobs", JSON.parse(JSON.stringify(BASELINE.mobs)));
                      flash("Baseline stock loaded — check Yards");
                    };
                    if (data.mobs.length === 0) doLoad();
                    else ask("Reset to the 1 July 2026 stock take? This replaces all current mobs.", doLoad);
                  }}
                >
                  Reset to 17 July baseline
                </button>
                <button className="btn ghost" onClick={exportData}>
                  Export (JSON)
                </button>
              </div>
              {exportText && (
                <div className="export-panel">
                  <p className="note">
                    Tap in the box, Select All, Copy — then paste it to Claude or into an email. This is your full
                    backup.
                  </p>
                  <textarea
                    className="export-box"
                    readOnly
                    value={exportText}
                    onFocus={(e) => e.target.select()}
                    rows={6}
                  />
                  <div className="btn-row">
                    <button
                      className="btn primary sm"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(exportText);
                          flash("Copied to clipboard");
                        } catch {
                          flash("Select the text and copy manually");
                        }
                      }}
                    >
                      Copy to clipboard
                    </button>
                    <button className="btn ghost sm" onClick={() => setExportText("")}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Quick add */}
      {tab === "home" && (
        <div className="fab-wrap">
          <QuickAdd onPick={(k) => setActiveForm(k === "mob" ? "mob" : k)} />
        </div>
      )}

      {formOverlay}
      {confirm && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setConfirm(null)}>
          <div className="confirm-box">
            <div className="confirm-msg">{confirm.message}</div>
            <div className="btn-row">
              <button className="btn ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  confirm.onYes();
                  setConfirm(null);
                }}
              >
                Yes, do it
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}

      <nav className="bottomnav">
        {[
          ["home", "Yards"],
          ["paddocks", "Stock"],
          ["rain", "Rain"],
          ["wool", "Wool"],
          ["chat", "Chat"],
          ["records", "Recs"],
          ["setup", "Setup"],
        ].map(([k, label]) => (
          <button
            key={k}
            className={"nav-btn" + (tab === k ? " active" : "")}
            onClick={() => {
              setTab(k);
              setRecordView(null);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function ActivityLog({ audit }) {
  const [who, setWho] = useState("All");
  const [limit, setLimit] = useState(100);
  const users = ["All", ...Array.from(new Set(audit.map((a) => a.user).filter(Boolean)))];
  const fmt = (ts) => {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const rows = audit.filter((a) => who === "All" || a.user === who).slice(0, limit);
  return (
    <section className="card">
      <div className="card-title">
        Activity log <span className="card-title-n">{audit.length} entries</span>
      </div>
      <p className="note">Who did what, newest first — tied to each person's login. Managers only.</p>
      <div className="prop-adder" style={{ marginTop: 0, marginBottom: 8 }}>
        <select value={who} onChange={(e) => setWho(e.target.value)}>
          {users.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </div>
      {rows.length === 0 && <div className="empty">No activity recorded yet.</div>}
      {rows.map((a) => (
        <div className="rain-row" key={a.id}>
          <span>
            <b>{a.user}</b> — {a.action}
            {a.summary ? ": " + a.summary : ""}
          </span>
          <span className="rain-mm" style={{ color: "#8B887A", fontWeight: 600, whiteSpace: "nowrap" }}>
            {fmt(a.ts)}
          </span>
        </div>
      ))}
      {audit.filter((a) => who === "All" || a.user === who).length > limit && (
        <button className="mini-btn" style={{ marginTop: 8 }} onClick={() => setLimit(limit + 200)}>
          Show more
        </button>
      )}
    </section>
  );
}

function PdkAdder({ properties, onAdd }) {
  const [prop, setProp] = useState(properties[0] || "");
  const [v, setV] = useState("");
  return (
    <div className="prop-adder">
      <select value={prop} onChange={(e) => setProp(e.target.value)} style={{ maxWidth: 130 }}>
        {properties.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <input value={v} placeholder="New paddock name" onChange={(e) => setV(e.target.value)} />
      <button
        className="btn primary sm"
        onClick={() => {
          onAdd(prop, v);
          setV("");
        }}
      >
        Add
      </button>
    </div>
  );
}

function PropAdder({ onAdd }) {
  const [v, setV] = useState("");
  return (
    <div className="prop-adder">
      <input value={v} placeholder="Add property…" onChange={(e) => setV(e.target.value)} />
      <button
        className="btn primary sm"
        onClick={() => {
          onAdd(v);
          setV("");
        }}
      >
        Add
      </button>
    </div>
  );
}

function FooImport({ properties, onImport }) {
  const [prop, setProp] = useState(properties[0] || "");
  const [txt, setTxt] = useState("");
  return (
    <section className="card">
      <div className="card-title">Import CiboLabs feed on offer</div>
      <p className="note">
        Paste a CiboLabs export — one paddock per line as: paddock name, kg DM/ha. Readings are dated today and show on
        the Paddocks screen.
      </p>
      <div className="f-row">
        <label className="f-label">Property</label>
        <select value={prop} onChange={(e) => setProp(e.target.value)}>
          {properties.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="f-row">
        <textarea rows={4} value={txt} placeholder={"Trigg, 1450\nEmu, 890\nWalcoola, 2100"} onChange={(e) => setTxt(e.target.value)} />
      </div>
      <div className="btn-row">
        <button
          className="btn primary sm"
          onClick={() => {
            onImport(prop, txt);
            setTxt("");
          }}
        >
          Import readings
        </button>
      </div>
    </section>
  );
}

function ClassEditor({ species, list, onChange }) {
  const [v, setV] = useState("");
  return (
    <div className="class-block">
      <div className="class-sp">{species}</div>
      <div className="class-chips">
        {list.map((c) => (
          <span className="class-chip" key={c}>
            {c}
            <button className="class-x" onClick={() => onChange(list.filter((x) => x !== c))}>
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="prop-adder">
        <input value={v} placeholder={`Add ${species.toLowerCase()} class…`} onChange={(e) => setV(e.target.value)} />
        <button
          className="btn primary sm"
          onClick={() => {
            if (v.trim() && !list.includes(v.trim())) onChange([...list, v.trim()]);
            setV("");
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function QuickAdd({ onPick }) {
  const [open, setOpen] = useState(false);
  const items = [
    ["moves", "Paddock move"],
    ["health", "Treatment"],
    ["rain", "Rainfall"],
    ["trucking", "Trucking / transfer"],
    ["marking", "Marking / branding"],
    ["weaning", "Weaning"],
    ["pregtest", "Preg test (PTE)"],
    ["shearing", "Shearing"],
    ["woolsale", "Wool trucked"],
    ["adjust", "Deaths / adjustment"],
    ["maint", "Maintenance"],
    ["musters", "Muster / job"],
    ["menu", "Menu"],
    ["orders", "Purchase order"],
    ["pasture", "Pasture"],
    ["mob", "New mob"],
  ];
  return (
    <>
      {open && (
        <div className="qa-menu">
          {items.map(([k, label]) => (
            <button
              key={k}
              className="qa-item"
              onClick={() => {
                setOpen(false);
                onPick(k);
              }}
            >
              <span className="act-dot" style={{ background: TAG[k] || TAG.mobs }} />
              {label}
            </button>
          ))}
        </div>
      )}
      <button className="fab" onClick={() => setOpen(!open)}>
        {open ? "✕" : "+ Record"}
      </button>
    </>
  );
}

/* ------------------ Styles ------------------ */

function Style() {
  return (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; }
    body { background: #E9E7DF; }
    .app {
      font-family: 'Barlow', system-ui, sans-serif;
      background: #E9E7DF;
      color: #23281F;
      min-height: 100vh;
      max-width: 560px;
      margin: 0 auto;
      padding-bottom: 76px;
      position: relative;
    }
    .loading { padding: 60px 20px; text-align: center; color: #6a6f60; }

    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 10px;
      background: #2F4A33; color: #F4F3EC;
      position: sticky; top: 0; z-index: 20;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-logo-box {
      background: #F4F3EC; border-radius: 10px; padding: 5px 10px;
      display: flex; align-items: center;
    }
    .brand-logo { height: 40px; width: auto; display: block; }
    .loading-logo { width: 180px; margin: 0 auto 14px; display: block; }
    .brand-mark {
      width: 38px; height: 38px; border-radius: 8px;
      background: #F4F3EC; color: #2F4A33;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Barlow Semi Condensed'; font-weight: 700; font-size: 17px;
      letter-spacing: 0.5px;
    }
    .brand-name { font-family: 'Barlow Semi Condensed'; font-weight: 700; font-size: 17px; letter-spacing: 0.3px; }
    .brand-sub { font-size: 11px; opacity: 0.75; text-transform: uppercase; letter-spacing: 1.2px; }
    .prop-filter {
      background: rgba(255,255,255,0.12); color: #F4F3EC;
      border: 1px solid rgba(255,255,255,0.25); border-radius: 8px;
      padding: 6px 8px; font-family: inherit; font-size: 14px;
    }

    .main { padding: 14px 14px 20px; }

    .stat-band {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;
    }
    .stat {
      background: #2F4A33; color: #F4F3EC; border-radius: 12px;
      padding: 14px 10px; text-align: center;
    }
    .stat-n {
      font-family: 'Barlow Semi Condensed'; font-weight: 700; font-size: 26px;
      font-variant-numeric: tabular-nums;
    }
    .stat-l { font-size: 11px; text-transform: uppercase; letter-spacing: 1.4px; opacity: 0.8; margin-top: 2px; }

    .card {
      background: #FFFFFF; border-radius: 12px; padding: 14px;
      margin-bottom: 12px; border: 1px solid #D9D6CB;
    }
    .card-title {
      font-family: 'Barlow Semi Condensed'; font-weight: 700; font-size: 15px;
      text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;
      display: flex; justify-content: space-between; align-items: baseline;
    }
    .card-title-n { font-size: 14px; color: #6a6f60; letter-spacing: 0; text-transform: none; font-family: 'Barlow'; font-weight: 600; }

    .rain-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #F0EEE6; font-size: 15px; align-items: center; }
    .rain-row:last-child { border-bottom: none; }
    .rain-mm { font-weight: 600; font-variant-numeric: tabular-nums; color: #3E7CB1; }
    .bd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .bd-sp { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #55594d; margin-bottom: 5px; }
    .bd-row { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; border-bottom: 1px solid #F0EEE6; }
    .bd-row:last-child { border-bottom: none; }
    .bd-total { border-top: 2px solid #23281F; border-bottom: none; margin-top: 3px; padding-top: 6px; font-weight: 700; }
    .bd-grand { display: flex; justify-content: space-between; margin-top: 12px; padding: 8px 10px; background: #2F4A33; color: #F4F3EC; border-radius: 9px; font-weight: 700; font-size: 15px; }
    .bd-grand .bd-n { color: #F4F3EC; }
    .bd-n { font-weight: 700; font-variant-numeric: tabular-nums; font-family: 'Barlow Semi Condensed'; font-size: 15px; }
    .prop-stock-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 8px 0; border-bottom: 1px solid #F0EEE6; cursor: pointer; }
    .prop-stock-row:last-child { border-bottom: none; }
    .prop-stock-name { font-weight: 600; font-size: 15px; }
    .prop-stock-nums { font-size: 13px; color: #40453a; text-align: right; font-variant-numeric: tabular-nums; }
    .prop-stock-dse { color: #8B887A; }

    .whp-card { border-left: 4px solid #B03A2E; }
    .inbox-card { border-left: 4px solid #C25E1F; }
    .po-card { border-left: 4px solid #2E7F8F; }
    .muster-card { border-left: 4px solid #4E5D9E; }
    .menu-card { border-left: 4px solid #B0743A; }
    .po-row { display: flex; gap: 8px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #F0EEE6; }
    .po-row:last-child { border-bottom: none; }
    .po-actions { display: flex; flex-direction: column; gap: 5px; }
    .mini-btn.approve { background: #2F4A33; border-color: #2F4A33; color: #fff; }
    .po-wait { font-size: 12px; color: #8B887A; font-weight: 600; white-space: nowrap; }
    .rec-item-actions { display: flex; flex-direction: column; gap: 5px; align-items: flex-end; }
    .inbox-row { background: #FBF3EA; border: 1px solid #E8CDB0; border-radius: 9px; padding: 8px 10px; margin-bottom: 8px; }
    .mini-btn.allocate { background: #C25E1F; border-color: #C25E1F; color: #fff; }
    .whp-date { font-weight: 600; color: #B03A2E; font-size: 13px; }

    .act-row { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #F0EEE6; align-items: flex-start; }
    .act-row:last-child { border-bottom: none; }
    .act-dot { width: 10px; height: 10px; border-radius: 3px; margin-top: 5px; flex-shrink: 0; }
    .act-dot.lg { width: 14px; height: 14px; border-radius: 4px; margin-top: 0; }
    .act-title { font-weight: 600; font-size: 15px; }
    .act-sub { font-size: 13px; color: #6a6f60; margin-top: 1px; }

    .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .head-btns { display: flex; gap: 6px; align-items: center; }
    .section-head h2 { font-family: 'Barlow Semi Condensed'; font-weight: 700; font-size: 22px; }
    .rec-h { font-family: 'Barlow Semi Condensed'; font-weight: 700; font-size: 20px; margin-bottom: 10px; }
    .back { background: none; border: none; font-family: inherit; font-size: 16px; font-weight: 600; color: #2F4A33; padding: 4px 0; }

    .mob-row { display: flex; align-items: center; gap: 8px; padding: 9px 0; border-bottom: 1px solid #F0EEE6; flex-wrap: wrap; }
    .mob-row:last-child { border-bottom: none; }
    .mob-info { flex: 1; min-width: 0; }
    .mob-name { font-weight: 600; font-size: 15px; }
    .mob-sub { font-size: 12.5px; color: #6a6f60; }
    .mob-note { font-size: 12px; color: #94651E; margin-top: 1px; }
    .mob-head.neg, .neg { color: #B03A2E; }
    .mob-head { font-family: 'Barlow Semi Condensed'; font-weight: 700; font-size: 19px; font-variant-numeric: tabular-nums; }
    .mob-actions { display: flex; gap: 5px; flex-wrap: wrap; width: 100%; margin-top: 4px; }

    .mini-btn {
      background: #EFEDE5; border: 1px solid #D9D6CB; border-radius: 7px;
      padding: 5px 9px; font-family: inherit; font-size: 12.5px; font-weight: 600; color: #23281F;
    }
    .mini-btn.danger { color: #B03A2E; }

    .rec-cat {
      display: flex; align-items: center; gap: 12px; width: 100%;
      background: #FFFFFF; border: 1px solid #D9D6CB; border-radius: 12px;
      padding: 15px 14px; margin-bottom: 9px; font-family: inherit; font-size: 16px;
      font-weight: 600; color: #23281F; text-align: left;
    }
    .rec-cat-label { flex: 1; }
    .rec-cat-n { color: #6a6f60; font-variant-numeric: tabular-nums; }
    .rec-cat-arrow { color: #B8B4A6; font-size: 20px; }

    .rec-item { display: flex; gap: 8px; align-items: flex-start; }
    .rec-item-main { flex: 1; min-width: 0; }
    .rec-notes { font-size: 13px; color: #55594d; margin-top: 4px; white-space: pre-wrap; }

    .chip {
      display: inline-block; color: #fff; border-radius: 6px;
      padding: 4px 10px; font-size: 12px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.8px;
    }
    .form-head { margin-bottom: 12px; }
    .name-preview {
      font-family: 'Barlow Semi Condensed'; font-weight: 700; font-size: 17px;
      background: #EAF0EA; border: 1px dashed #2F4A33; border-radius: 9px;
      padding: 9px 12px; margin-bottom: 12px; color: #2F4A33;
    }
    .form-card { margin-bottom: 0; }
    .f-row { margin-bottom: 11px; display: flex; flex-direction: column; gap: 4px; }
    .f-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .f-label { font-size: 12.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; color: #55594d; }
    .opt { color: #A6A292; font-weight: 500; text-transform: none; letter-spacing: 0; }
    input, select, textarea {
      font-family: inherit; font-size: 16px; padding: 10px 11px;
      border: 1px solid #C9C6B9; border-radius: 9px; background: #FBFAF6;
      width: 100%; color: #23281F;
    }
    input:focus, select:focus, textarea:focus { outline: 2px solid #2F4A33; border-color: #2F4A33; }

    .btn {
      font-family: inherit; font-size: 15.5px; font-weight: 600;
      padding: 11px 18px; border-radius: 10px; border: none;
    }
    .btn.primary { background: #2F4A33; color: #F4F3EC; }
    .btn.ghost { background: #EFEDE5; color: #23281F; border: 1px solid #C9C6B9; }
    .btn.sm { padding: 8px 13px; font-size: 14px; }
    .btn-row { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
    .err { color: #B03A2E; font-size: 13.5px; font-weight: 600; margin-bottom: 8px; }

    .overlay {
      position: fixed; inset: 0; background: rgba(30,34,28,0.5);
      z-index: 50; display: flex; align-items: flex-end; justify-content: center;
    }
    .confirm-box {
      background: #fff; border-radius: 16px; padding: 20px 16px;
      margin: auto 16px; max-width: 400px; width: calc(100% - 32px);
      align-self: center;
    }
    .confirm-msg { font-size: 15.5px; font-weight: 500; margin-bottom: 16px; line-height: 1.45; }
    .sheet {
      width: 100%; max-width: 560px; max-height: 88vh; overflow-y: auto;
      background: #FFFFFF; border-radius: 18px 18px 0 0; padding: 16px 16px 26px;
    }

    .fab-wrap { position: fixed; bottom: 78px; right: 16px; z-index: 40; display: flex; flex-direction: column; align-items: flex-end; max-width: 560px; }
    .fab {
      background: #C25E1F; color: #fff; border: none; border-radius: 28px;
      padding: 14px 20px; font-family: 'Barlow Semi Condensed'; font-weight: 700;
      font-size: 17px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    }
    .qa-menu {
      background: #fff; border-radius: 14px; border: 1px solid #D9D6CB;
      margin-bottom: 10px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.18);
      min-width: 200px;
    }
    .qa-item {
      display: flex; align-items: center; gap: 10px; width: 100%;
      background: none; border: none; border-bottom: 1px solid #F0EEE6;
      padding: 13px 15px; font-family: inherit; font-size: 15.5px; font-weight: 600;
      color: #23281F; text-align: left;
    }
    .qa-item:last-child { border-bottom: none; }
    .qa-item .act-dot { margin-top: 0; }

    .bottomnav {
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: 560px; z-index: 30;
      display: grid; grid-template-columns: repeat(7, 1fr);
      background: #FFFFFF; border-top: 1px solid #D9D6CB;
      padding: 6px 6px calc(6px + env(safe-area-inset-bottom));
    }
    .nav-btn {
      background: none; border: none; padding: 10px 4px;
      font-family: 'Barlow Semi Condensed'; font-weight: 600; font-size: 13px;
      letter-spacing: 0.4px; text-transform: uppercase; color: #8B887A;
      border-radius: 9px;
    }
    .nav-btn.active { color: #2F4A33; background: #EAF0EA; }

    .empty { color: #8B887A; font-size: 14.5px; padding: 6px 0; }
    .pdk-row { display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; border-bottom: 1px solid #F0EEE6; }
    .pdk-row:last-child { border-bottom: none; }
    .pdk-empty .pdk-name { color: #A6A292; font-weight: 500; }
    .pdk-main { flex: 1; min-width: 0; }
    .pdk-name { font-weight: 600; font-size: 15px; }
    .pdk-mob { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 13.5px; color: #40453a; margin-top: 3px; }
    .pdk-mob-block { margin-top: 4px; }
    .pdk-mob-actions { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 3px; }
    .pdk-none { font-size: 12.5px; color: #B8B4A6; }
    .pdk-ha { font-size: 12px; font-weight: 500; color: #8B887A; }
    .pdk-nums { text-align: right; }
    .pdk-dse { font-size: 11.5px; color: #2F4A33; font-weight: 600; }
    .pdk-foo { font-size: 12px; font-weight: 600; color: #6BA542; }
    .pdk-use-tag { font-size: 12px; font-weight: 700; color: #B0743A; }
    .pdk-detail { margin-top: 6px; }
    .use-select { font-size: 13.5px; padding: 7px 9px; max-width: 220px; }
    .pdk-hist { margin-top: 6px; border-left: 2px solid #D9D6CB; padding-left: 8px; }
    .pdk-hist-row { font-size: 12.5px; color: #55594d; padding: 2px 0; }
    .pdk-hist-date { font-weight: 700; color: #8B887A; }
    .commentary-card { border-left: 4px solid #6BA542; }
    .tally-card { border-left: 4px solid #94651E; }
    .tag-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag-chip { font-family: inherit; font-size: 13px; font-weight: 600; padding: 6px 11px; border-radius: 15px; border: 1.5px solid #C9C6B9; background: #FBFAF6; color: #55594d; }
    .tag-chip.on { background: #2F4A2E; border-color: #2F4A2E; color: #fff; }
    .wool-card { border-left: 4px solid #C9A227; }
    .shear-btn { background: #C9A227; border-color: #C9A227; color: #fff; }
    .commentary-text { font-size: 14.5px; line-height: 1.5; white-space: pre-wrap; }
    .recon-neg { font-weight: 600; color: #B03A2E; font-variant-numeric: tabular-nums; }
    .recon-pos { font-weight: 600; color: #2F4A33; font-variant-numeric: tabular-nums; }
    .prop-name { flex: 1; font-weight: 600; }
    .pic-input { width: 120px; font-size: 13.5px; padding: 6px 8px; margin-right: 8px; }
    .class-block { margin-bottom: 14px; }
    .class-sp { font-size: 12.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #55594d; margin-bottom: 6px; }
    .class-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .class-chip {
      background: #EFEDE5; border: 1px solid #D9D6CB; border-radius: 7px;
      padding: 4px 6px 4px 10px; font-size: 13px; font-weight: 600;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .class-x { background: none; border: none; color: #B03A2E; font-size: 11px; padding: 2px 4px; }
    .empty.big { text-align: center; padding: 40px 20px; background: #fff; border-radius: 12px; border: 1px dashed #C9C6B9; }
    .note { font-size: 13.5px; color: #6a6f60; margin-bottom: 10px; }
    .prop-adder { display: flex; gap: 8px; margin-top: 10px; }
    .loads-box { border: 1px solid #C9C6B9; border-radius: 9px; padding: 8px 10px; background: #FBFAF6; max-height: 240px; overflow-y: auto; }
    .load-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 0; border-bottom: 1px solid #F0EEE6; }
    .load-row:last-child { border-bottom: none; }
    .load-label { display: flex; align-items: center; gap: 8px; font-size: 14px; flex: 1; }
    .load-label input[type=checkbox] { width: auto; }
    .load-have { color: #8B887A; font-weight: 600; }
    .load-head { width: 84px; padding: 6px 8px; font-size: 14.5px; }
    .export-panel { margin-top: 12px; }
    .export-box { font-family: monospace; font-size: 11px; width: 100%; }

    .chan-row { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 10px; -webkit-overflow-scrolling: touch; }
    .chan-chip {
      background: #FFFFFF; border: 1px solid #C9C6B9; border-radius: 16px;
      padding: 6px 13px; font-family: inherit; font-size: 13.5px; font-weight: 600;
      color: #55594d; white-space: nowrap;
    }
    .chan-chip.active { background: #2F4A33; border-color: #2F4A33; color: #F4F3EC; }
    .chat-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 64px; }
    .chat-msg {
      background: #FFFFFF; border: 1px solid #D9D6CB; border-radius: 12px;
      padding: 9px 12px; max-width: 86%; align-self: flex-start;
    }
    .chat-msg.mine { background: #EAF0EA; border-color: #BFD0BF; align-self: flex-end; }
    .chat-msg.system { background: #EEF0F7; border-color: #C6CCE3; align-self: stretch; max-width: 100%; }
    .chat-meta { font-size: 11.5px; color: #8B887A; font-weight: 600; margin-bottom: 3px; }
    .chat-text { font-size: 15px; white-space: pre-wrap; }
    .chat-img { max-width: 100%; border-radius: 8px; margin-bottom: 4px; display: block; }
    .react-row { display: flex; gap: 4px; margin-top: 5px; flex-wrap: wrap; align-items: center; }
    .react-pill {
      background: #F2F0E8; border: 1px solid #C9C6B9; border-radius: 12px;
      padding: 2px 8px; font-size: 12.5px; font-weight: 600; font-family: inherit;
    }
    .react-pill.mine { background: #EAF0EA; border-color: #2F4A33; }
    .react-add {
      background: none; border: none; font-size: 13px; opacity: 0.35; padding: 2px 3px;
    }
    .react-add:active { opacity: 1; }
    .chat-bar {
      position: fixed; bottom: 62px; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: 560px; display: flex; gap: 8px; align-items: center;
      background: #E9E7DF; padding: 8px 12px calc(8px + env(safe-area-inset-bottom)/2);
      border-top: 1px solid #D9D6CB; z-index: 25;
    }
    .chat-input { flex: 1; }
    .chat-photo-btn {
      background: #FFFFFF; border: 1px solid #C9C6B9; border-radius: 10px;
      font-size: 20px; padding: 8px 11px;
    }
    .preview-banner {
      background: #EAF0EA; border: 1px solid #2F4A33; color: #2F4A33;
      border-radius: 10px; padding: 10px 12px; font-size: 13.5px; font-weight: 600; margin-bottom: 12px;
    }
    .mode-banner {
      background: #FFF7E8; border: 1px solid #E3C98F; color: #7A5A17;
      border-radius: 10px; padding: 10px 12px; font-size: 13px; font-weight: 600; margin-bottom: 12px;
    }
    .err-banner {
      background: #FBEAEA; border: 1px solid #D89B9B; color: #7C2B22;
      border-radius: 10px; padding: 10px 12px; font-size: 13.5px; font-weight: 600;
      margin-bottom: 12px; display: flex; gap: 8px; align-items: center; justify-content: space-between;
    }
    .toast {
      position: fixed; bottom: 130px; left: 50%; transform: translateX(-50%);
      background: #23281F; color: #F4F3EC; padding: 9px 18px; border-radius: 10px;
      font-size: 14.5px; font-weight: 600; z-index: 60;
    }

    @media (prefers-reduced-motion: no-preference) {
      .confirm-box {
      background: #fff; border-radius: 16px; padding: 20px 16px;
      margin: auto 16px; max-width: 400px; width: calc(100% - 32px);
      align-self: center;
    }
    .confirm-msg { font-size: 15.5px; font-weight: 500; margin-bottom: 16px; line-height: 1.45; }
    .sheet { animation: up 0.22s ease; }
      @keyframes up { from { transform: translateY(30px); opacity: 0.6; } to { transform: none; } }
    }
  `}</style>
  );
}