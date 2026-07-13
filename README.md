# VehicleTrack — Vehicle Inventory Management

VehicleTrack is a focused full-stack vehicle inventory module for field-service teams. It tracks items taken from a central store, loaded onto a vehicle, and later returned after a job.

For every trip, the system records:

- Which vehicle left the store
- Which stock items were taken
- How much of each item was taken
- How much came back
- How much was used
- How the store’s current stock changed

The main reconciliation rule is:

```text
quantity used = quantity taken - quantity returned
```

## Features

### Stock management

- Create stock items
- View all active stock items
- View individual item details
- Edit item information
- Adjust current stock quantities
- Archive items instead of permanently deleting them
- Search items by SKU or name
- Enforce unique SKUs, regardless of letter casing
- Prevent negative stock quantities

Each stock item contains:

- Unique barcode/SKU
- Name
- Unit, such as `piece`, `box`, `metre`, `litre`, or `roll`
- Current quantity on hand
- Reorder threshold
- Active/archived status

### Vehicle management

- Create vehicles
- List vehicles
- Edit vehicle details
- Activate or deactivate vehicles
- Enforce unique vehicle registrations

Each vehicle contains:

- Registration
- Name
- Type, such as `Van`, `Truck`, or `Car`

### Start a trip

- Select an active vehicle
- Add one or more stock items
- Find items using their SKU
- Enter the quantity taken for each item
- Record optional trip notes
- Automatically record the departure time
- Reduce store stock when the trip starts

The system rejects a trip when:

- No items are included
- An item does not exist
- An item is archived
- A quantity is zero or negative
- The same item is added twice
- The requested quantity is greater than available stock
- The selected vehicle already has an active trip

### Return and reconcile a trip

- Open a trip currently marked as `out`
- Record the returned quantity for every trip item
- Calculate the used quantity automatically
- Add returned quantities back to stock
- Record the return time
- Mark the trip as `returned`

The system rejects a return when:

- A returned quantity is negative
- A returned quantity is greater than the quantity taken
- A trip item is omitted
- A trip item is submitted more than once
- The trip has already been returned

### Operational views

- Dashboard summary
- Current stock levels
- Low-stock warnings
- Vehicles
- Trips currently out
- Completed trip history
- Detailed taken, returned, and used quantities
- Inventory movement audit trail

### Bonus features

#### Reorder thresholds

Each item can have a reorder threshold. An item is shown as low stock when:

```text
quantity on hand <= reorder threshold
```

This is a warning only, the application does not automatically place an order.

#### Inventory movement audit trail

Every important stock change is recorded, including:

- Initial stock
- Manual adjustments
- Stock taken on a trip
- Stock returned from a trip

Each movement records:

- Item
- Related trip, when applicable
- Movement type
- Quantity added or removed
- Balance after the movement
- Date and time
- Optional explanation

#### Vehicle availability protection

A vehicle cannot be assigned to two active trips at the same time.

#### Historical data preservation

Items are archived rather than physically deleted, so completed trip records continue to display correctly.

---

## Technology stack

- **Next.js 16 App Router** — pages and server Route Handlers
- **TypeScript** — type-safe application code
- **React 19** — user interface
- **Supabase/Postgres** — hosted database
- **Postgres RPC functions** — atomic stock transactions
- **Zod** — API input validation
- **Vitest** — focused automated tests
- **CSS** — responsive application styling

Authentication is intentionally outside the scope of this version.

---


The application uses a Supabase server secret or legacy `service_role` key only inside server-side code.

Starting and returning trips are implemented as Postgres functions so that all related changes happen in one transaction.

For example, starting a trip performs the following as one operation:

1. Validate the vehicle.
2. Validate all item lines.
3. Lock the selected inventory rows.
4. Confirm sufficient stock is available.
5. Create the trip.
6. Create the trip item records.
7. Reduce stock.
8. Create inventory movement records.

If any line fails, the complete operation is rolled back.

---

## Project structure

```text
vehicle-inventory-system/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dashboard/              # Dashboard API
│   │   │   ├── items/                  # Item CRUD APIs
│   │   │   ├── vehicles/               # Vehicle APIs
│   │   │   ├── trips/                  # Trip start, list, detail and return APIs
│   │   │   └── movements/              # Inventory movement API
│   │   ├── items/
│   │   │   ├── page.tsx                # Stock list
│   │   │   ├── new/page.tsx            # Create item
│   │   │   └── [id]/page.tsx           # View/edit item
│   │   ├── vehicles/page.tsx            # Vehicle management
│   │   ├── trips/
│   │   │   ├── new/page.tsx            # Start a trip
│   │   │   ├── out/page.tsx            # Trips currently out
│   │   │   ├── history/page.tsx        # Completed trips
│   │   │   └── [id]/page.tsx           # Trip detail and return form
│   │   ├── movements/page.tsx           # Stock audit trail
│   │   ├── page.tsx                     # Dashboard
│   │   ├── layout.tsx                   # Root layout
│   │   ├── loading.tsx                  # Loading state
│   │   ├── error.tsx                    # Error boundary
│   │   └── globals.css                  # Global styling
│   ├── components/
│   │   ├── items/                       # Item form and table
│   │   ├── vehicles/                    # Vehicle manager
│   │   ├── trips/                       # Start, return, table and summary components
│   │   ├── layout/                      # Navigation
│   │   └── ui/                          # Shared UI components
│   ├── lib/
│   │   ├── services/                    # Database queries and RPC calls
│   │   ├── supabase/server.ts           # Server-only Supabase client
│   │   ├── validation/                  # Zod request schemas
│   │   ├── api-client.ts                # Browser fetch helper
│   │   ├── api-response.ts              # Consistent API responses
│   │   ├── errors.ts                    # Application error handling
│   │   ├── format.ts                    # Display formatting helpers
│   │   └── trip-calculations.ts         # Trip quantity calculations
│   └── types/models.ts                  # Shared application types
├── supabase/
│   ├── migrations/
│   │   ├── create_schema.sql
│   │   ├── create_functions.sql
│   │   └── secure_database.sql
│   └── seed.sql
├── tests/
│   ├── trip-calculations.test.ts
│   └── validation.test.ts
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## Database model

The database contains five main tables.

### `items`

Stores current inventory information.

Important fields:

- `id`
- `sku`
- `name`
- `unit`
- `quantity_on_hand`
- `reorder_threshold`
- `is_active`
- `created_at`
- `updated_at`

### `vehicles`

Stores the vehicles used by field crews.

Important fields:

- `id`
- `registration`
- `name`
- `type`
- `is_active`
- `created_at`
- `updated_at`

### `trips`

Stores one vehicle departure and its final return.

Important fields:

- `id`
- `trip_number`
- `vehicle_id`
- `status`
- `taken_at`
- `returned_at`
- `notes`
- `created_at`

Trip status is either:

```text
out
returned
```

### `trip_items`

Stores each item included in a trip.

Important fields:

- `trip_id`
- `item_id`
- `qty_taken`
- `qty_returned`
- `qty_used`

`qty_used` is generated automatically by Postgres:

```text
qty_used = qty_taken - qty_returned
```

### `inventory_movements`

Stores an audit record for each stock change.

Important fields:

- `item_id`
- `trip_id`
- `movement_type`
- `quantity_delta`
- `balance_after`
- `note`
- `created_at`

---
## Available pages

| Route | Purpose |
|---|---|
| `/` | Dashboard |
| `/items` | Current stock |
| `/items/new` | Create item |
| `/items/[id]` | View or edit item |
| `/vehicles` | Vehicle management |
| `/trips/new` | Start a trip |
| `/trips/out` | Trips currently out |
| `/trips/history` | Completed trip history |
| `/trips/[id]` | Trip details and return form |
| `/movements` | Inventory movement audit trail |

---

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/dashboard` | Dashboard counts and low-stock data |
| `GET` | `/api/items` | List items |
| `POST` | `/api/items` | Create an item |
| `GET` | `/api/items/:id` | View one item |
| `PATCH` | `/api/items/:id` | Edit item details or stock |
| `DELETE` | `/api/items/:id` | Archive an item |
| `GET` | `/api/vehicles` | List vehicles |
| `POST` | `/api/vehicles` | Create a vehicle |
| `GET` | `/api/vehicles/:id` | View one vehicle |
| `PATCH` | `/api/vehicles/:id` | Edit a vehicle |
| `GET` | `/api/trips?status=out` | List active trips |
| `GET` | `/api/trips?status=returned` | List completed trips |
| `POST` | `/api/trips` | Start a trip |
| `GET` | `/api/trips/:id` | View trip details |
| `POST` | `/api/trips/:id/return` | Return and reconcile a trip |
| `GET` | `/api/movements` | List inventory movements |

---

# Running the project locally

The Next.js application runs on your computer, while the database remains hosted on Supabase.

## 1. Prerequisites

Install:

- Node.js 20.9 or newer
- npm
- Git
- A Supabase account

Check Node and npm:

```bash
node --version
npm --version
```

---

## 2. Clone the repository

```bash
git clone <your-repository-url>
cd vehicle-inventory-system
```

When using a downloaded ZIP instead:

1. Extract the ZIP.
2. Open the extracted project folder in VS Code.
3. Open a terminal in the folder containing `package.json`.

Verify that you are in the correct directory:

```bash
npm run
```

You should see scripts such as:

```text
dev
build
start
lint
test
test:watch
```

---

## 3. Install dependencies

```bash
npm install --no-audit --no-fund
```

---

## 4. Create a hosted Supabase project

1. Sign in to Supabase.
2. Create a new project.
3. Choose a project name.
4. Create and safely store the database password.
5. Choose a region.
6. Wait until the project is ready.

---

## 5. Create the database schema

In the Supabase Dashboard:

1. Open **SQL Editor**.
2. Select **New query**.
3. Open the following project file:

```text
supabase/migrations/create_schema.sql
```

4. Copy the complete SQL file into the SQL Editor.
5. Run it.

This migration creates:

- Database extensions
- Enum types
- `items`
- `vehicles`
- `trips`
- `trip_items`
- `inventory_movements`
- Constraints
- Indexes
- Generated used quantities
- Updated-at triggers

Run each migration against the same Supabase project.

---

## 6. Create the transactional functions

Open and run:

```text
supabase/migrations/create_functions.sql
```

This creates:

- `create_inventory_item`
- `update_inventory_item`
- `take_out_trip`
- `return_trip`

These functions protect stock consistency by running related database operations atomically.

---

## 7. Apply database security

Open and run:

```text
supabase/migrations/secure_database.sql
```

This migration:

- Enables Row Level Security
- Prevents direct browser access to the inventory tables
- Grants the server-side Supabase role access
- Restricts the inventory functions to the server role

---

## 8. Load seed data

The repository includes:

```text
supabase/seed.sql
```

The seed creates:

### Items

| SKU | Name | Unit | Starting quantity | Reorder threshold |
|---|---|---|---:|---:|
| `CABLE-001` | Ethernet Cable | metre | 100 | 20 |
| `BOLT-010` | Steel Bolt | piece | 250 | 50 |
| `PIPE-020` | PVC Pipe | metre | 60 | 15 |
| `GLOVE-001` | Safety Gloves | pair | 40 | 10 |
| `TAPE-001` | Electrical Tape | roll | 25 | 5 |

### Vehicles

| Registration | Name | Type |
|---|---|---|
| `OM-1234` | Maintenance Van 1 | Van |
| `OM-9012` | Field Truck 1 | Truck |

### Trips

The seed also creates:

- One completed trip for the trip-history view
- One active trip for the trips-out view
- Inventory movement records produced by those trips

To load it:

1. Open **SQL Editor** in Supabase.
2. Create a new query.
3. Copy the complete contents of `supabase/seed.sql`.
4. Run it once.

> **Important:** `seed.sql` should be ran only once to prevent errors

### Running without seed data

Seed data is optional. You can also start with an empty database. To start with an empty database:

1. Run the three migrations.
2. Skip `seed.sql`.
3. Start the application.
4. Create items and vehicles from the UI.
5. Start a trip after at least one active item and vehicle exist.

---

## 9. Verify the hosted database

In Supabase, open **Table Editor**.

Confirm these tables exist:

```text
items
vehicles
trips
trip_items
inventory_movements
```

If seed data was loaded, confirm that the item and vehicle rows are visible.

The `vehicles` table should contain:

```text
id
registration
name
type
is_active
created_at
updated_at
```

The `items` table should contain:

```text
id
sku
name
unit
quantity_on_hand
reorder_threshold
is_active
created_at
updated_at
```

---

## 10. Get the Supabase environment values

In the Supabase Dashboard, open the project API settings.

Copy:

- Project URL
- Server secret key, or the legacy `service_role` key

Do not use the publishable or anonymous key for `SUPABASE_SECRET_KEY`.

---

## 11. Create `.env.local`

At the project root, copy `.env.example`:

### Windows PowerShell

```powershell
Copy-Item .env.example .env.local
```

### macOS/Linux

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
SUPABASE_URL=https://your-project-reference.supabase.co
SUPABASE_SECRET_KEY=your-server-secret-key
```

---

## 12. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The dashboard should load data from the hosted Supabase project.

---

