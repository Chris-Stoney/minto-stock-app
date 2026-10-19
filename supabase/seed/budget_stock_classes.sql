-- DRAFT stock class list for the budget schema, taken from the app's
-- classification scheme (NEW_CLASSES, NEW_CLASS_DSE and NON_BREEDING_CLASSES
-- in src/App.jsx). The app is the master list; this mirrors it.
-- Rows marked "confirm" are guesses waiting on Gwen.
set search_path = budget, public;

insert into stock_class (code, name, species, sex, age_band, breeding, app_class) values
  ('C-CALF', 'Calf',        'cattle', 'mixed',  'calf',    false, 'Calf'),
  ('C-MSW',  'M/S Weaners', 'cattle', 'mixed',  'weaner',  false, 'M/S Weaners'),
  ('C-HFR',  'Heifer',      'cattle', 'female', 'young',   true,  'Heifer'),
  ('C-COW',  'Cow',         'cattle', 'female', 'adult',   true,  'Cow'),
  ('C-STR',  'Steer',       'cattle', 'male',   'young',   false, 'Steer'),
  ('C-STG',  'Stag',        'cattle', 'male',   'adult',   false, 'Stag'),
  ('C-BUL',  'Bull',        'cattle', 'male',   'adult',   true,  'Bull'),
  ('S-MSL',  'M/S Lamb',    'sheep',  'mixed',  'lamb',    false, 'M/S Lamb'),
  ('S-MSW',  'M/S Weaners', 'sheep',  'mixed',  'weaner',  false, 'M/S Weaners'),
  ('S-EWL',  'Ewe lamb',    'sheep',  'female', 'young',   true,  'Ewe lamb'),
  ('S-WEL',  'Wether lamb', 'sheep',  'male',   'young',   false, 'Wether lamb'),
  ('S-RAL',  'Ram lamb',    'sheep',  'male',   'young',   true,  'Ram lamb'),
  ('S-EWE',  'Ewe',         'sheep',  'female', 'adult',   true,  'Ewe'),
  ('S-RAM',  'Ram',         'sheep',  'male',   'adult',   true,  'Ram');

insert into class_transition (from_class, to_class, at_event, transition_rule) values
  ('C-CALF', 'C-MSW', 'weaning',  'at weaning'),
  ('C-MSW',  'C-HFR', 'classing', 'heifers drafted off (confirm event)'),
  ('C-MSW',  'C-STR', 'classing', 'steers drafted off (confirm event)'),
  ('C-HFR',  'C-COW', 'calving',  'at first calving (confirm)'),
  ('C-BUL',  'C-STG', 'classing', 'confirm'),
  ('S-MSL',  'S-EWL', 'weaning',  'at weaning, as the app records it'),
  ('S-MSL',  'S-WEL', 'weaning',  'at weaning, as the app records it'),
  ('S-MSL',  'S-MSW', 'weaning',  'confirm: when do lambs go to M/S Weaners instead?'),
  ('S-MSW',  'S-EWL', 'classing', 'confirm'),
  ('S-MSW',  'S-WEL', 'classing', 'confirm'),
  ('S-MSW',  'S-RAL', 'classing', 'confirm'),
  ('S-EWL',  'S-EWE', 'classing', 'confirm age or event'),
  ('S-RAL',  'S-RAM', 'classing', 'confirm age or event');
  -- Wether lamb has no adult class in the app: confirm they are always sold young.

-- DSE as confirmed in the app on 14 Sep 2026 (Ewe|Joined, Ewe|Lambing and
-- M/S Lamb are the app's own estimates, still to confirm).
insert into class_dse (stock_class, status, dse) values
  ('C-BUL', '', 8), ('C-CALF', '', 5), ('C-COW', '', 10), ('C-HFR', '', 8),
  ('C-STR', '', 8), ('C-STG', '', 8), ('C-MSW', '', 6),
  ('S-EWE', '', 3), ('S-EWE', 'LAF', 3), ('S-EWE', 'Dry', 1), ('S-EWE', 'Wet', 3),
  ('S-EWE', 'Joined', 1), ('S-EWE', 'Lambing', 3),
  ('S-EWL', '', 1.2), ('S-WEL', '', 1.2), ('S-RAM', '', 2), ('S-RAL', '', 1.2),
  ('S-MSW', '', 1.2), ('S-MSL', '', 1.2);
