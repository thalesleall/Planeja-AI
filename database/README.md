# ToDoList Data Model

## Overview

This repository contains the logical data model for a simple ToDo application implemented with PostgreSQL (naming convention: **snake_case**). The model is designed for use with Supabase (Postgres) and includes tables for users, plans, lists, items and steps. The schema aims to be simple, consistent and ready for production improvements (indexes, constraints, timestamps, RLS rules).

---

## Tables and columns

### `users`

- `id` (`bigserial`, PK)
- `name` (`varchar(255)`, NOT NULL)
- `email` (`varchar(255)`, NOT NULL, unique recommended)

Purpose: store authenticated users (owners) of plans and lists.

### `to_do_plan`

- `id` (`bigserial`, PK)
- `name` (`varchar(128)`, NOT NULL)
- `owner_id` (`bigint`, NOT NULL, FK -> `users.id`)

Purpose: high-level plans (projects) that group lists and steps.

### `to_do_list`

- `id` (`bigserial`, PK)
- `owner_id` (`bigint`, NOT NULL, FK -> `users.id`)

Purpose: logical list of todo items. Each list belongs to a user.

### `to_do_item`

- `id` (`bigserial`, PK)
- `list_id` (`bigint`, NOT NULL, FK -> `to_do_list.id`)
- `item_order` (`int`, NOT NULL) — numeric ordering within the list
- `name` (`varchar(128)`, NOT NULL)
- `description` (`varchar(512)`, NULL)
- `done` (`boolean`, NOT NULL, DEFAULT false)

Purpose: individual tasks inside a `to_do_list`.

### `steps`

- `id` (`bigserial`, PK)
- `plan_id` (`bigint`, NOT NULL, FK -> `to_do_plan.id`)
- `step_order` (`int`, NOT NULL) — numeric ordering for steps in a plan
- `list_id` (`bigint`, NOT NULL, FK -> `to_do_list.id`)

Purpose: steps link a plan to one or more lists (defines an execution order or workflow).

---

## Relationships

- `users.id` → `to_do_plan.owner_id` (one-to-many)
- `users.id` → `to_do_list.owner_id` (one-to-many)
- `to_do_list.id` → `to_do_item.list_id` (one-to-many)
- `to_do_plan.id` → `steps.plan_id` (one-to-many)
- `to_do_list.id` → `steps.list_id` (one-to-many)

This model supports multiple plans and lists per user, multiple items per list and multiple steps per plan. `steps` can reference lists to express a plan workflow composed of lists.

---

## Suggested constraints & extensions

1. **Unique constraints**

   - `users(email)` should be `UNIQUE` to prevent duplicate accounts.

2. **Timestamps**

   - Add `created_at TIMESTAMP WITH TIME ZONE DEFAULT now()` and `updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()` to tables where history is useful (`users`, `to_do_plan`, `to_do_list`, `to_do_item`). Use triggers to update `updated_at` on change.

3. **ON DELETE behavior**

   - Choose appropriate cascade/deny rules. Examples:

     - `ON DELETE CASCADE` on `to_do_item.list_id` so items are removed when a list is deleted.
     - `ON DELETE RESTRICT` or `SET NULL` on `to_do_plan.owner_id` depending on the product requirements.

4. **Indexes**

   - Add indexes on foreign keys: `to_do_item(list_id)`, `to_do_list(owner_id)`, `to_do_plan(owner_id)`, `steps(plan_id)`, `steps(list_id)`.
   - Consider a partial index for `to_do_item` on `done` if queries frequently filter by completion status.

5. **Row Level Security (RLS) — Supabase**

   - If the app needs per-user access controls, enable RLS and create policies that allow users to read/write only their own `to_do_list` and related objects.

6. **Naming conventions**

   - Keep snake_case for table and column names. Avoid reserved keywords (`order` has been renamed to `item_order` and `step_order`).

---

## Seeding data and testing

- Use `INSERT` statements or a seed script to add test data. For larger volumes use a script (Node.js/Python) or generate csv files and import with `COPY` (Postgres) for speed.
- Example quick seed: insert 10 users, 10 plans, 10 lists, 100 items, 100 steps.

---

## Supabase specific steps (quick)

1. In the Supabase Dashboard -> **SQL Editor** paste the schema SQL and run it.
2. Or use the Supabase CLI:

   ```bash
   supabase migration new create_todo_schema
   # paste SQL into the generated file
   supabase db push
   ```

3. After creating tables, open **Table Editor** to inspect relationships and enable RLS if needed.

---

## Common queries

- Get all lists and items for a user:

```sql
SELECT l.id as list_id, l.owner_id, i.id as item_id, i.name, i.done
FROM to_do_list l
JOIN to_do_item i ON i.list_id = l.id
WHERE l.owner_id = $1
ORDER BY l.id, i.item_order;
```

- Get plan steps with list names:

```sql
SELECT s.step_order, s.plan_id, l.id as list_id
FROM steps s
JOIN to_do_list l ON l.id = s.list_id
WHERE s.plan_id = $1
ORDER BY s.step_order;
```

👨‍💻 Autor
Desenvolvido por João Pedro Rosa de Paula
