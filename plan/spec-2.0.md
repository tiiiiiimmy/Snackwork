────────────────────────────────────────────────────────
FINAL SPECIFICATION  
SnackSpot Auckland – “Snack, Store & Profile 2.0”  
(ALL outstanding decisions resolved)
────────────────────────────────────────────────────────

0.  Glossary  
    • **Snack** – item shared by a user.  
    • **Store** – physical place that sells snacks; supplies the snack’s lat/lng.  
    • **Soft-delete** – logical delete via `IsDeleted = 1`; data purged after 30 days.

────────────────────────────────────────────────────────
1.  IMAGE UPLOAD & STORAGE
────────────────────────────────────────────────────────
1.1 Accepted formats PNG, JPG/JPEG, WebP (case-insensitive).  
1.2 Client hard-limit reject > 5 MiB; show inline error.  
1.3 Server pipeline  
     a. Verify mime-type & magic bytes; reject if invalid.  
     b. Compress to ≤ 1 MiB (file-size only).  
     c. Discard original file after compression.  
     d. Persist compressed bytes in DB column `Snacks.Image` (BLOB/bytea).  
1.4 Public access `GET /api/v1/images/{snackId}` streams blob  
     • Headers `Content-Type`, `Cache-Control: max-age=31536000, immutable`.  
1.5 Upload rate-limit **5 images / second / user** (rolling one-second window; 429 on exceed).

────────────────────────────────────────────────────────
2.  STORE MODEL & ASSOCIATION
────────────────────────────────────────────────────────
2.1 Table `Stores`
```
Id                GUID  PK
Name              varchar(80)  NOT NULL   -- trimmed, lower-cased for uniqueness check
Address           varchar(120) NULL
Latitude          decimal(9,6) NOT NULL
Longitude         decimal(9,6) NOT NULL
CreatedByUserId   GUID FK → Users.Id
CreatedAt         timestamp(UTC)
IsDeleted         bit          DEFAULT 0
```
• Uniqueness rule Same name may exist at different coordinates (e.g., “Subway”).  
• Editing Not allowed after creation.  
2.2 Snacks  
     – Drop `Latitude`, `Longitude` (legacy migration: current lone snack is deleted).  
     – Add `StoreId` GUID NOT NULL FK → `Stores.Id`.  
2.3 New Endpoints  
```
GET  /api/v1/stores?search=     -- fuzzy search, pagination
POST /api/v1/stores             -- body: {name,address,lat,lng}
DELETE /api/v1/stores/{id}      -- only if no snacks reference; soft-delete (IsDeleted=1)
```
• Backend calls Google Geocoding API to verify/normalise coordinates when a store is created.  
2.4 Snack Endpoints  
     • `POST /snacks` & `PUT /snacks/{id}` must include `storeId`.  
     • Distance filter in `GET /snacks` now uses store coordinates (JOIN).  
     • Default radius unchanged at **1 km**.

────────────────────────────────────────────────────────
3.  SNACK CRUD
────────────────────────────────────────────────────────
• Roles Only **owner** (or future admin) may update/delete snack.  
• On `DELETE /snacks/{id}`  
     1. Remove snack (soft-delete flag).  
     2. Within same transaction, cascade-delete category if no other snacks reference it.  
• Transaction ensures race-condition safety.

────────────────────────────────────────────────────────
4.  CATEGORIES
────────────────────────────────────────────────────────
4.1 `POST /categories` – any **authenticated user** may create.  
     – Input sanitised: trim outer spaces, collapse internal spaces, lowercase.  
     – If existing category after normalisation, return existing row (idempotent).  
4.2 Cascade delete handled in §3.

────────────────────────────────────────────────────────
5.  USER PROFILE
────────────────────────────────────────────────────────
Table `Users` additions  
```
InstagramHandle   varchar(64) NULL
Bio               varchar(200) NULL
AvatarEmoji       varchar(8)  NOT NULL DEFAULT '🍪'
```
• Editable by owner: `username` (unique, ≤ 50 chars), `InstagramHandle`, `Bio`, `AvatarEmoji`.  
• Email & password immutable.  
• Profile page `/users/{id}` shows emoji avatar, username, `@ins`, bio, and grid of that user’s snacks.

────────────────────────────────────────────────────────
6.  VALIDATION & SECURITY
────────────────────────────────────────────────────────
• Extended `InputValidationMiddleware` to validate new fields (bio length, etc.).  
• Image validation (see §1).  
• Rate-limiting untouched except image-upload rule (§1.5).

────────────────────────────────────────────────────────
7.  SOFT-DELETE RETENTION
────────────────────────────────────────────────────────
• Rows flagged `IsDeleted = 1` (Snacks, Categories, Stores) are **purged after 30 days** by a nightly job.

────────────────────────────────────────────────────────
8.  AUDIT LOGGING
────────────────────────────────────────────────────────
Table `AuditLogs`  
```
Id, UserId, Action(string), Entity(string), EntityId, Timestamp, OldValue(JSONB), NewValue(JSONB)
```
• Log events: create/update/delete snack, category, store, profile edits.

────────────────────────────────────────────────────────
9.  RATE LIMITS (SUMMARY)
────────────────────────────────────────────────────────
• General API – existing global/user/IP limits stay.  
• Image upload – **≤ 5 uploads / rolling 1-second window / user**.

────────────────────────────────────────────────────────
10. CONTINUOUS INTEGRATION / TESTING
────────────────────────────────────────────────────────
Mandatory CI checks (backend + frontend):
1. Upload rejects > 5 MiB files & unsupported mime.  
2. Compressed file ≤ 1 MiB.  
3. 5 img/s per-user limit enforced.  
4. Profile update:  
   • username unique & ≤ 50 chars,  
   • bio ≤ 200 chars,  
   • email/password unchanged.  

────────────────────────────────────────────────────────
11. FRONTEND UPDATES
────────────────────────────────────────────────────────
• Add/edit snack UI: searchable Store dropdown + “Add Store” dialog (name + address; lat/lng auto-filled from Google Places Autocomplete).  
• Snack card now shows store name.  
• Avatar picker: fixed emoji palette component.

────────────────────────────────────────────────────────
12. OPEN ITEMS RESOLVED
────────────────────────────────────────────────────────
✓ Category creation → any authenticated user  
✓ Soft-delete purge → 30 days nightly job  
✓ Image URL → `GET /images/{snackId}` (public, long-cache)  
✓ Upload limit definition → rolling 1-second window  
✓ Store uniqueness, geo-coding, editing, migration, distance default all finalised above.

This document is now fully specified and ready for engineering implementation.