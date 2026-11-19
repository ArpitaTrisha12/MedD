# MedD backend

This is a standalone Express API for the existing React app. It connects to
MongoDB before accepting requests and exposes `GET /api/health` and
`GET /api/doctors`.

## Configure MongoDB Atlas

1. Create a cluster in MongoDB Atlas.
2. In **Database Access**, create a database user with a strong password and
   the minimum permissions the app needs.
3. In **Network Access**, add the IP address of the computer running this
   backend. Avoid allowing access from everywhere for a local development
   setup.
4. In the cluster's **Connect** dialog, select **Drivers** and copy the
   connection string.
5. Copy `.env.example` to `.env` in this folder. Put the copied URI in
   `MONGODB_URI` and replace its database name with `medd` if needed. URL-encode
   special characters in the username or password.
6. Keep `.env` private; it is ignored by Git. Never put the Atlas URI in the
   React frontend or commit it.

## Install and run

Use Node.js 20 or newer. From this folder, run:

```powershell
npm install
npm run migrate:doctors
npm run dev
```

The doctor migration uses stable IDs and upserts, so rerunning it does not
create duplicate records. The API listens on port `5000` by default, after
MongoDB connects. Verify the connection at `http://localhost:5000/api/health`;
doctor records are available at `http://localhost:5000/api/doctors`.
Configure `PORT` and `CLIENT_ORIGIN` in `.env` to match your local setup. The
React app defaults to `http://localhost:4000`; set `VITE_API_URL` in the
frontend environment if your API uses another origin.
