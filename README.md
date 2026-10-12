# Trip splitter

A small app for splitting trip expenses with friends. Keep as many trips as you like: the home page lists them, and each trip has its own people, expenses, currency and link (`/#/trip/<id>`). One Node.js service serves the page and a JSON API, and stores everything in MongoDB. The code follows an MVC layout: Mongoose models, Express controllers and routes, and a single-page view.

If your database still has data from the single-trip version of the app, the app moves it into a trip of its own the first time it connects, and logs `Moved the existing trip … into the trips list.`

## Run it on your machine

You need Node.js 20.19 or newer and a MongoDB server. The quickest local MongoDB is Docker:

```bash
docker run -d --name trip-mongo -p 27017:27017 mongo:8
```

Then:

```bash
npm install
npm start            # http://localhost:3000
```

Without `MONGODB_URI` the app connects to `mongodb://127.0.0.1:27017/trip_splitter`. You can also point it at a free MongoDB Atlas cluster, as described below. For local runs you can put settings in a `.env` file in the project folder (it is git-ignored):

```bash
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/
```

## Deploy on Vercel (+ MongoDB Atlas)

Vercel runs `app.js` as a single function and serves `public/` from its CDN. No `vercel.json` is needed.

1. In [MongoDB Atlas](https://www.mongodb.com/atlas), under **Network Access**, allow `0.0.0.0/0`, because Vercel's outgoing IP addresses change. Copy the connection string, which looks like `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/`.
2. Push this folder to a GitHub repository and import it at [vercel.com/new](https://vercel.com/new). Vercel detects Express; leave the build settings as they are.
3. Under **Environment Variables**, add `MONGODB_URI` (the connection string) and, optionally, `ACCESS_CODE`.
4. Deploy and open the URL. The first request after a quiet spell takes a moment while it connects to MongoDB; after that the connection is reused.

Or deploy from the terminal with the Vercel CLI:

```bash
npm i -g vercel
vercel link                   # create or pick the Vercel project
vercel env add MONGODB_URI    # paste the Atlas connection string, choose Production
vercel --prod                 # deploy
```

The CLI uploads everything except what `.vercelignore` lists (it does not read `.gitignore`), so `.vercelignore` keeps your `.env` out of the upload. If you change an environment variable later, redeploy for it to take effect.

## Deploy on Render or another Node host

1. Create the Atlas cluster as in step 1 above.
2. On Render, create a **Web Service** from the repository:
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment variable `MONGODB_URI`: the connection string
   - Optional `ACCESS_CODE`: a short code friends must enter once before they can see or change the trips
3. Open the service URL and share it (and the code, if you set one) with your friends.

Railway, Fly.io, a VPS or any host that runs Node 20.19+ works the same way: install, set `MONGODB_URI`, run `npm start`. The app listens on `PORT` if the host sets it.

## Configuration

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string. Defaults to `mongodb://127.0.0.1:27017/trip_splitter`. If the string has no database name (Atlas strings usually don't), the app uses `trip_splitter`. |
| `ACCESS_CODE` | Optional. When set, the page asks for this code and the API rejects requests without it. |
| `PORT` | Port to listen on. Defaults to 3000. |

## Project layout

```
server.js                 entry for npm start: prepares the database, starts the server
app.js                    Express app: middleware, routes, static page, errors (Vercel's entry)
config/
  index.js                settings read from environment variables
  db.js                   Mongoose connection
models/                   M: schemas, validation and queries
  Trip.js                 a trip's name and currency
  Member.js               people on a trip
  Expense.js              expenses and settlements
  plugins/tripScoped.js   adds tripId to members and expenses, keeps ids inside their trip
controllers/              C: one file per resource
  tripController.js       list, open, create/rename and delete trips
  memberController.js     add, rename and remove people
  expenseController.js    add, edit and delete expenses
routes/api.js             maps /api URLs to controllers
middleware/
  auth.js                 checks the trip code
  ensureDb.js             waits for the database before API requests
  loadTrip.js             404 for trips that don't exist
  errorHandler.js         turns unexpected errors into a 500 response
utils/
  setup.js                connects to MongoDB once per process and runs the migration
  migrate.js              moves single-trip data into a trip (runs once)
  http.js, validate.js    shared helpers
public/index.html         V: the page people use (trips list and trip page)
.vercelignore             keeps .env out of Vercel CLI uploads
```

## How it works

- Data lives in three collections: `trips`, `members` and `expenses`. Members and expenses carry the `tripId` of the trip they belong to. Each document's `_id` is the id the page generates, and the API returns it as `id`.
- Amounts are stored in paise or cents as whole numbers, so splits always add up exactly.
- The server validates every write: shares must add up to the total, names must be unique within a trip (ignoring case), an expense can only name people on its own trip, and a person who is part of an expense can't be removed.
- A trip has three pages, each with its own link: **Expenses** (`/#/trip/<id>`: the people and the expense log), **Balances** (`/#/trip/<id>/balances`: who owes whom and the payments that settle up) and **Spending** (`/#/trip/<id>/spending`: what the trip cost each person, with their share of every expense). Switching pages doesn't reload the trip, and Back returns to the trips list.
- Everyone who has the link (and the trip code, if set) can see, edit and delete every trip.
- Open pages check for changes every few seconds, so everyone's view stays current.

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/trips` | list of trips with people, expense count and total spent |
| GET | `/api/trips/:tripId` | one trip with its members and expenses |
| PUT / DELETE | `/api/trips/:tripId` | `{ name, currency }` creates or renames; DELETE removes the trip and everything in it |
| PUT / DELETE | `/api/trips/:tripId/members/:id` | `{ name, createdAt }` |
| PUT / DELETE | `/api/trips/:tripId/expenses/:id` | expense or settlement |
| GET | `/healthz` | health check for your host |

## Starting fresh

Delete trips from the page with **Delete this trip** at the bottom of each one. To wipe everything at once, drop the database (in `mongosh`: `use trip_splitter` then `db.dropDatabase()`, or delete it from the Atlas UI).
