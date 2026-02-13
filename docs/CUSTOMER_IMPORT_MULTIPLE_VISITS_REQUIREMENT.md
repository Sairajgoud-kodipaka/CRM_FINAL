# Customer Import: Multiple Visits (Same Customer, Different Stores/Dates)

## Business requirement

- **Same customer** (same phone/email) can have **multiple visits** at different stores on different dates.
- Example: phone `9723521333` has an entry on **2/5/2024 at Shivranjani** and another visit on **6/5/2024 at CG Road**. Both must be preserved.
- **No entry must be lost**: every CSV row represents a real visit and must be reflected in the system (either as a new customer + visit, or as an additional visit for an existing customer).

## Current (wrong) behaviour

- Import treats “same phone/email” as duplicate and **skips** the row.
- Result: only the first row is stored; the second visit (e.g. 6/5/2024 at CG Road) is dropped.

## Required behaviour

1. **New customer (first time seeing this phone/email)**  
   - Create **Client** and record this row’s visit (store + date) as a **visit** (e.g. `ClientVisit`).

2. **Existing customer (phone/email already in DB or already seen in this file)**  
   - Do **not** skip.  
   - Find the existing **Client**, then create a **visit** for this row (store + date).  
   - No second Client record; only an additional visit for the same person.

3. **Customer details modal / Journey tab**  
   - Leave the journey tab behaviour and structure as-is.  
   - Backend must expose these visits (e.g. as a new journey item type) so the same timeline shows **all** visits (e.g. 2/5/2024 Shivranjani, 6/5/2024 CG Road) without changing the modal layout.

## What must be in the codebase

1. **Model for multiple visits per customer**  
   - e.g. `ClientVisit`: `client` (FK), `store` (FK), `visit_date` (date), optional `attended_by`, `created_at`.  
   - One row per (customer, store, date) from import (or from manual entry later if needed).

2. **Import logic**  
   - When a row has phone/email that **already exists** (in DB or already in this CSV):  
     - Resolve to the existing **Client**.  
     - Create a **ClientVisit** for this row (store + visit_date from CSV).  
     - Do **not** increment “skipped”; optionally count “visits added” for existing customers.  
   - When a row has **new** phone/email:  
     - Create **Client** (as today) and one **ClientVisit** for this row.  
   - So: every CSV row either creates (Client + ClientVisit) or (ClientVisit only). No row is dropped.

3. **Journey API**  
   - Include `ClientVisit` (or equivalent) in the journey timeline (e.g. new item type `store_visit` with date, store name).  
   - Frontend: minimal change to support the new type (same pattern as existing types: title, description, date, details.store). Do not redesign the journey tab.

4. **Customer details modal / Journey tab**  
   - No structural change; only support the new visit type so that all visits (all stores, all dates) appear in the timeline.

## Summary

- **One customer** (one phone/email) → one **Client** record.  
- **Many visits** (different stores/dates) → many **ClientVisit** records linked to that Client.  
- **Import**: never skip a row; for existing customer add a visit, for new customer add client + visit.  
- **Journey**: show all visits (including imported store+date) in the existing tab without changing its structure.
