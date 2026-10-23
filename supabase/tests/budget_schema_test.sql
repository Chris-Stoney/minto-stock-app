-- Behaviour checks for the budget schema, using made-up data.
-- Run against a SCRATCH database after the migration, never production:
--   psql -f supabase/migrations/20261019000000_budget_schema.sql -f supabase/tests/budget_schema_test.sql
-- The last five statements are expected to fail (append-only, rate x quantity,
-- stage going backwards, birth recorded as an outgoing movement).

set search_path=budget;
insert into entity values ('E1','Test Co','company');
insert into stock_class(code,name,species) values ('EWE','Ewe','sheep'),('EWL','Ewe lamb','sheep');
insert into property(code,name,entity,state,tenure) values ('P1','Prop one','E1','VIC','owned'),('P2','Prop two','E1','SA','owned');
insert into location values ('L1','owned_property','P1','Prop one'),('L2','owned_property','P2','Prop two'),('AG','agistment',null,'Agist block');
insert into gst_code values ('GST',0.10,'standard'); insert into account values ('400','Stock sales','revenue','GST'),('500','Freight','expense','GST');
insert into event(id,type,entity,effective_date) values
 ('00000000-0000-0000-0000-000000000001','purchase','E1','2026-07-03'),
 ('00000000-0000-0000-0000-000000000002','transfer','E1','2026-08-10'),
 ('00000000-0000-0000-0000-000000000003','count','E1','2026-09-05');
insert into stock_movement(event,entity,stock_class,direction,reason,head,location_to,owned) values ('00000000-0000-0000-0000-000000000001','E1','EWE','in','purchase',500,'L1',true);
insert into stock_movement(event,entity,stock_class,direction,reason,head,location_from,location_to,owned,weight_kg) values
 ('00000000-0000-0000-0000-000000000002','E1','EWE','out','transfer_out',200,'L1','L2',true,12000),
 ('00000000-0000-0000-0000-000000000002','E1','EWE','in','transfer_in',200,'L1','L2',true,11500);
insert into stock_movement(event,entity,stock_class,direction,reason,head,location_from,owned) values ('00000000-0000-0000-0000-000000000003','E1','EWE','out','discrepancy',12,'L1',true);
insert into discrepancy(event,entity,property,stock_class,head,opened_date,count_confidence) values ('00000000-0000-0000-0000-000000000003','E1','P1','EWE',-12,'2026-09-05','rough');
-- freight per deck
insert into cost(event,entity,account_code,amount_ex_gst,gst_code,rate,rate_basis,quantity,treatment,stage) values ('00000000-0000-0000-0000-000000000002','E1','500',3600,'GST',1800,'per_deck',2,'expense','committed');
insert into cost(event,entity,account_code,amount_ex_gst,gst_code,rate,rate_basis,quantity,treatment,stage,supersedes) select event,entity,account_code,3600,gst_code,1800,'per_deck',2,'expense','invoiced',id from cost;
select property,month,opening_head,purchases,transfers_in,transfers_out,discrepancy_open,closing_head from stock_reconciliation where month<'2026-10-01' order by property,month;
select count(*) as breaks from stock_reconciliation_breaks;
select stage,count(*) from cost_current group by 1;
select status,age_days>0 as aged from discrepancy_status;
\set ON_ERROR_STOP 0
update event set notes='x';
delete from stock_movement;
insert into cost(entity,account_code,amount_ex_gst,gst_code,rate,rate_basis,quantity,treatment,stage) values ('E1','500',999,'GST',1800,'per_deck',2,'expense','committed');
insert into cost(entity,account_code,amount_ex_gst,gst_code,treatment,stage,supersedes) select 'E1','500',3600,'GST','expense','committed',id from cost_current;
insert into stock_movement(event,entity,stock_class,direction,reason,head,location_to,owned) values ('00000000-0000-0000-0000-000000000001','E1','EWE','out','birth',5,'L1',true);
