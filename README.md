# FleetStock — Vehicle Inventory Management

A focused full-stack module for tracking stock loaded onto field vehicles and reconciling what comes back. The application records:

- Current store stock by unique barcode/SKU
- Vehicles available for field work
- Items and quantities taken when a trip starts
- Returned and used quantities when the trip finishes
- A complete stock movement audit trail

## Technology

- Next.js App Router and TypeScript
- Supabase/Postgres
- Next.js Route Handlers for the API
- Postgres RPC functions for atomic stock operations
- Zod for API validation
- Vitest for focused unit tests
- Plain responsive CSS to keep dependencies small

## Why stock operations are database functions

Starting and returning a trip each modify several records. These operations are implemented as Postgres functions so they run in one database transaction. If any line fails validation, every change rolls back.

The `FOR UPDATE` locks inside the functions also prevent two concurrent requests from both taking the same remaining stock.

## Product decisions

- A trip has one final reconciliation: `used = taken - returned`.
- A return must include every trip item, including items where zero came back.
- The same vehicle cannot have two open trips at once.
- Items are archived rather than physically deleted, preserving historical trips.
- Quantities support three decimal places.
- Units are displayed independently; the UI never adds metres, pieces, and boxes into a misleading total.
- Authentication and multiple stores are deliberately outside this take-home scope.

## Project structure

```text
vehicle-inventory-system/
├── src/
│   ├── app/
│   │   ├── api/                 # HTTP Route Handlers
│   │   ├── items/               # Stock pages
│   │   ├── vehicles/            # Vehicle page
│   │   ├── trips/               # Start, active, history, detail/return pages
│   │   ├── movements/           # Audit trail page
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Dashboard
│   │   └── globals.css
│   ├── components/
│   │   ├── items/
│   │   ├── vehicles/
│   │   ├── trips/
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/
│   │   ├── services/            # Server-only database access
│   │   ├── supabase/            # Server client
│   │   ├── validation/          # Zod schemas
│   │   ├── api-client.ts
│   │   ├── api-response.ts
│   │   ├── errors.ts
│   │   └── format.ts
│   └── types/
├── supabase/
│   ├── migrations/              # Schema, RPCs, security
│   ├── tests/                   # SQL workflow smoke test
│   ├── seed.sql
│   └── config.toml
├── tests/                       # Vitest unit tests
├── .env.example
└── README.md
```

## File responsibilities

### Database

- `202607120001_create_schema.sql`: tables, constraints, indexes, generated used quantity, timestamps.
- `202607120002_create_functions.sql`: transactional item creation/update, trip take-out, and final return.
- `202607120003_secure_database.sql`: RLS and server-only permissions.
- `seed.sql`: realistic items, vehicles, one completed trip, and one active trip.
- `tests/trip_workflow.sql`: verifies stock 20 → 12 → 15 and used quantity 5.

### Server application

- `src/lib/supabase/server.ts`: creates the secret-key client. It can only be imported on the server.
- `src/lib/services/*`: all database queries and RPC calls.
- `src/lib/validation/*`: validates untrusted API input.
- `src/app/api/*/route.ts`: REST-style API endpoints.

### UI

- `item-form.tsx`: create/edit item and record adjustment reason.
- `vehicle-manager.tsx`: create and edit vehicles.
- `start-trip-form.tsx`: vehicle selection and dynamic typed/pasted SKU lines.
- `return-trip-form.tsx`: final returned quantities with live used calculation.
- `trip-table.tsx` and `trip-summary.tsx`: active/history/detail views.

## Local setup with Supabase CLI

### 1. Requirements

Install:

- Node.js 20.9 or newer
- Docker Desktop
- Git

The Supabase CLI is installed as a development dependency, so a global install is not required.

### 2. Clone and install

```bash
git clone <your-repository-url>
cd vehicle-inventory-system
npm install
```

### 3. Start local Supabase

```bash
npm run db:start
```

This starts local Postgres, Supabase Studio, and the API.

### 4. Apply migrations and seed data

```bash
npm run db:reset
```

`supabase db reset` recreates the local database, applies every file in `supabase/migrations`, and runs `supabase/seed.sql`.

### 5. Get local credentials

```bash
npx supabase status
```

Copy:

- `API URL` into `SUPABASE_URL`
- `service_role key` into `SUPABASE_SECRET_KEY`

Create `.env.local`:

```bash
cp .env.example .env.local
```

Example local values:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SECRET_KEY=<service-role-key-from-supabase-status>
```

Never commit `.env.local`, and never prefix the secret key with `NEXT_PUBLIC_`.

### 6. Run the application

```bash
npm run dev
```

Open `http://localhost:3000`.

Supabase Studio is normally available at `http://127.0.0.1:54323`.

## Hosted Supabase setup

### Option A: Supabase CLI

1. Create a project in Supabase.
2. Authenticate and link this repository:

```bash
npx supabase login
npx supabase link --project-ref <your-project-reference>
```

3. Push migrations:

```bash
npx supabase db push
```

4. Load sample data if desired:

```bash
npx supabase db reset --linked
```

Be careful: resetting a linked database is destructive. For a non-empty project, run `supabase/seed.sql` manually in the SQL Editor instead.

5. Set production environment variables:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<server-side-secret-or-legacy-service-role-key>
```

### Option B: SQL Editor

Run the three migration files in filename order, then run `supabase/seed.sql`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/dashboard` | Dashboard counts and low-stock items |
| `GET` | `/api/items` | List active items |
| `POST` | `/api/items` | Create an item and initial movement |
| `GET` | `/api/items/:id` | View an item |
| `PATCH` | `/api/items/:id` | Edit metadata/quantity and record adjustment |
| `DELETE` | `/api/items/:id` | Archive an item |
| `GET` | `/api/vehicles` | List vehicles |
| `POST` | `/api/vehicles` | Create a vehicle |
| `GET` | `/api/vehicles/:id` | View a vehicle |
| `PATCH` | `/api/vehicles/:id` | Edit or deactivate a vehicle |
| `GET` | `/api/trips?status=out` | List active trips |
| `GET` | `/api/trips?status=returned` | List history |
| `POST` | `/api/trips` | Start a trip atomically |
| `GET` | `/api/trips/:id` | Trip detail |
| `POST` | `/api/trips/:id/return` | Final return and reconciliation |
| `GET` | `/api/movements` | Stock audit trail |

## Example API requests

Create an item:

```json
{
  "sku": "CABLE-100",
  "name": "Network Cable",
  "unit": "metre",
  "quantityOnHand": 80,
  "reorderThreshold": 15
}
```

Start a trip:

```json
{
  "vehicleId": "<vehicle-uuid>",
  "notes": "Site installation",
  "lines": [
    { "itemId": "<item-uuid>", "quantity": 12 }
  ]
}
```

Return a trip:

```json
{
  "lines": [
    { "tripItemId": "<trip-item-uuid>", "quantityReturned": 4 }
  ]
}
```

The example above means 12 were taken, 4 returned, and 8 used.

## Validation and database protection

The system rejects:

- Duplicate SKUs, including different letter casing
- Duplicate vehicle registrations
- Negative stock or reorder thresholds
- Empty trips
- Duplicate items in the same trip
- Taking zero or a negative quantity
- Taking more than is available
- Using an archived item on a new trip
- Returning more than was taken
- Omitting a trip line during final return
- Returning the same trip twice
- Starting another open trip for the same vehicle

Client validation is for usability. The API and database constraints remain the source of truth.

## Tests and quality checks

```bash
npm run test
npm run lint
npm run build
```

Run the SQL transaction smoke test against local Postgres:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -f supabase/tests/trip_workflow.sql
```

## Manual acceptance test

1. Create an item with quantity `20`.
2. Attempt to create the same SKU in different casing; confirm rejection.
3. Create a vehicle.
4. Start a trip taking `8`; stock should become `12`.
5. Attempt to take `13`; confirm rejection and stock remains `12`.
6. Return `3` from the first trip.
7. Stock should become `15`.
8. Trip detail should show taken `8`, returned `3`, used `5`.
9. Attempt to return the trip again; confirm rejection.
10. Archive the item; historical trip information must remain visible.

## Deployment

A straightforward option is:

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` as server environment variables.
4. Deploy.
5. Verify the full take-out and return workflow against the hosted database.

## Suggested five-minute walkthrough

1. `0:00–0:30`: Explain stock → vehicle → return → used.
2. `0:30–1:15`: Create/edit an item and show duplicate validation.
3. `1:15–2:20`: Start a trip and prove stock decreased.
4. `2:20–3:20`: Return part of the stock and show used quantity.
5. `3:20–4:10`: Show history and movement audit trail.
6. `4:10–5:00`: Show the database RPC transaction and one test.

## Known limitations

- No authentication or user roles.
- One store location.
- One final return event per trip rather than multiple partial returns.
- No unit conversion.
- No camera-based scanner; SKU is typed or pasted as requested.
#   V e h i c l e T r a c k  
 