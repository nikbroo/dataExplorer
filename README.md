# Orders Data Explorer

A searchable, filterable, sortable explorer over 10,000 orders that stays fast and never shows the wrong results. Built for Problem Statement 1 of the Frontend Developer Assignment.

- **Live app:** _add Vercel URL_
- **API:** _add Render URL_
- **Demo video:** _add link_

## Features

- Server-side search, status filter, sort and pagination, all stored in the URL:
  `/orders?q=alex&status=shipped&sortBy=createdAt&sortOrder=desc&page=1&limit=25`
- Refresh, back/forward and shared links restore the exact same view.
- Debounced search (350 ms). Slow, superseded responses never overwrite newer ones.
- Rows virtualized with `react-window`.
- Distinct loading, updating, empty, out-of-range-page and error states, with Retry.
- Order detail as a deep-linkable route (`/orders/:id?…`) rendered as a side panel. Closing it keeps the list's filters, scroll position and keyboard focus.
- Keyboard and screen-reader support: ARIA table semantics with `aria-sort` / `aria-rowindex`, live regions for result counts and errors, visible focus, Escape to close the panel.

## Tech stack

| Area | Choice |
| --- | --- |
| Frontend | React 19, TypeScript (strict), Vite 8 |
| Server state | Redux Toolkit 2 — RTK Query |
| HTTP | Axios, through a custom RTK Query `baseQuery` |
| Routing | react-router-dom 7 |
| Styling | Tailwind CSS 4 |
| Virtualization | react-window 2 |
| Icons / dates | lucide-react, moment |
| Tests | Vitest, Testing Library, jsdom |
| Mock API | Express 5, Zod 4 (in-memory 10k orders) |

## Run locally

Requires Node 20.19+ (Vite 8).

```bash
# 1. API — http://localhost:3000
cd backend
cp .env.example .env
npm install
npm run dev

# 2. App — http://localhost:5173
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Run the Vitest suite |
| `npm run lint` | Run oxlint |
| `npm run build` | Typecheck and build for production |

### Environment variables

| App | Variable | Default | Purpose |
| --- | --- | --- | --- |
| backend | `PORT` | `3000` | HTTP port |
| backend | `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |
| backend | `SIMULATE_LATENCY` | `true` | Random 200 ms – 3 s delay on every `/api` request |
| backend | `SIMULATE_FAILURES` | `true` | ~10% of `/api` requests return `500 RANDOM_FAILURE` |
| frontend | `VITE_API_URL` | `http://localhost:3000/api` | API base URL |

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/orders` | Query params `q`, `status`, `sortBy` (`createdAt` \| `customerName` \| `totalAmount` \| `orderNumber`), `sortOrder` (`asc` \| `desc`), `page`, `limit` (≤ 100). Returns `{ data, pagination: { page, limit, totalRecords, totalPages } }`. Invalid params return `400 INVALID_QUERY`. |
| `GET /api/orders/:id` | Returns `{ data }`, or `404 ORDER_NOT_FOUND`. |

## Architecture

```
frontend/src
├── app/          store + typed hooks
├── services/     axiosBaseQuery (cancellation, error normalisation), ordersApi (RTK Query)
├── hooks/        useOrderQueryParams (URL ⇄ typed query), useDebouncedCallback
├── pages/        OrdersPage (list + <Outlet/>), OrderDetailPanel (nested route)
├── components/   OrderFilters, SearchInput, OrdersTable, Pagination, StatusBadge, StatusMessage
├── types/        shared domain types and enums
└── utils/        formatting
```

### State management decisions

**The URL is the only source of truth for view state.**
- `useOrderQueryParams` parses `URLSearchParams` into a typed `OrdersQuery`.
- Unknown or invalid values fall back to defaults, so a hand-edited or malicious URL can't break the page.
- Defaults are left out of the URL when serialising, so links stay short.
- Changing a filter, sort or page size resets to page 1.
- Filters are not copied into Redux. A copy would need two-way syncing and would drift on back/forward.

**Redux Toolkit holds server state through RTK Query.**
- The cache is keyed by the full query object.
- Going back to a previously viewed page/filter shows instantly from cache and then revalidates.

**Search input keeps a local draft.**
- Typing is instant locally; the value is written to the URL after 350 ms.
- Pressing Enter commits immediately.
- If the URL changes from outside (back/forward, Reset), the draft re-syncs.

### Never showing stale results

1. **Ignore** — The list renders RTK Query's `currentData`, which only ever holds the response for the current arguments. A late response for an older query is cached under its own key and never displayed.
2. **Cancel where RTK Query aborts** — `axiosBaseQuery` passes RTK Query's `AbortSignal` to Axios, so when RTK Query aborts a request, the HTTP call is cancelled too. A request that is merely superseded by a newer query is not aborted; it finishes and is ignored (step 1). Without the debounce, those ignored requests would pile up.
3. **Be honest while loading** — While a new query loads, the previous rows stay visible but are faded and `inert` (not clickable or focusable), with an "Showing previous results — updating…" badge and `aria-busy`.
4. **Errors replace data** — On error, old rows are removed and an error message with Retry is shown. Old data is never presented as current.

### Detail view

`/orders/:id` is a nested route under `/orders`:
- The list stays mounted underneath, so its scroll position, virtualized rows and query cache survive opening and closing the panel.
- The panel keeps the current `location.search`, so closing returns to the same filtered list.
- On open, the background is made `inert`, which also contains keyboard focus inside the panel.
- On close, focus goes back to the row link that opened it.
- Deep links work: the list renders behind the panel from the same URL.

### Performance

- `react-window` renders only the visible rows, plus 6 rows of overscan.
- Row props are memoised.
- The table only scrolls back to the top when the query changes, not when the detail panel opens.

## Tradeoffs

- **Numbered pages instead of infinite scroll.** The URL maps 1:1 to a server page, which makes sharing and back/forward exact. With at most 100 rows per page, virtualization matters less than it would with an accumulating infinite list. It is still used, so a larger page size stays cheap.
- **Detail as an overlay route, not a standalone page.** This keeps scroll and filters without saving them to storage. The downside is that a deep link to a detail also fetches the list behind it.
- **Stale rows stay visible while loading.** This avoids layout flashes. They are clearly labelled and can't be interacted with; the alternative was blanking the table on every keystroke.
- **Mock data is regenerated on each server start** (random status, amount and date). Order ids are stable, but the other fields change between restarts.
- **No offline cache or persistence.** The assignment didn't require it for this problem statement.

## Tests

`frontend/src/**/*.test.ts(x)` — run with `npm test`:

- **Race condition:** a slow response for `q=a` resolving after a fast response for `q=al` never renders.
- **URL restore:** a full URL is turned into the exact API request and control values.
- **Failure and retry:** a failed request hides the old rows, announces the error through `role="alert"`, and Retry recovers.
- **Query param parsing:** defaults, rejecting invalid values, round-tripping, and page reset rules.

## Deployment

- **Backend → Render:** `render.yaml` is a Blueprint (root dir `backend`, `npm ci && npm run build`, `npm start`). Set `FRONTEND_URL` to the Vercel URL.
- **Frontend → Vercel:** set the root directory to `frontend` and `VITE_API_URL` to `https://<render-app>.onrender.com/api`. `vercel.json` rewrites every path to `index.html`, so deep links like `/orders/42` work.

Note: Render's free tier sleeps when idle, so the first request after a pause can take about 30 s on top of the simulated latency.

## Sources & references

- RTK Query — [Conditional fetching & `currentData`](https://redux-toolkit.js.org/rtk-query/usage/queries#query-hook-return-types), [Customizing queries / custom `baseQuery`](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries)
- React Router — [`useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams), nested routes and `<Outlet>`
- react-window v2 — [docs and examples](https://react-window.vercel.app/)
- Axios — [Cancellation with `AbortController`](https://axios-http.com/docs/cancellation)
- React — [Adjusting state when a prop changes](https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
- WAI-ARIA APG — [Table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/), [Dialog (modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- MDN — [`inert`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert), [ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- Tailwind CSS v4 — [Vite installation](https://tailwindcss.com/docs/installation/using-vite)
- Vitest + Testing Library — [Vitest docs](https://vitest.dev/), [user-event](https://testing-library.com/docs/user-event/intro)

## AI usage

The frontend was built with Claude Code (Claude Opus).
- **I directed:** the stack, the choice between numbered pages and infinite scroll, rendering detail as a route panel, and adding latency/failure simulation to the backend.
- **I reviewed:** the generated code, ran the test suite, and checked behaviour in the browser.

Chat history: _add share link_
