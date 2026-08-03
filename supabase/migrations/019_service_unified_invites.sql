-- 019: All invite emails route through Service Desk requests, so the customer
-- always chooses what to raise (review / feedback / complaint). The old email
-- invite tool and the product-review API only collect an email address, so
-- customer_name becomes optional (display name falls back to the email's
-- local part at submission time).

alter table service_requests alter column customer_name drop not null;

-- Where the request originated: 'service' = sent deliberately from the
-- Service Desk form; 'invite' / 'api' = created as the secondary "raise an
-- issue" door inside a review-invite email. The dashboard request log only
-- lists 'service' rows; cases show in the inbox regardless of source.
alter table service_requests add column if not exists source text not null default 'service'
  check (source in ('service', 'invite', 'api'));
