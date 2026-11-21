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
7. Set `JWT_SECRET` to a random secret of at least 32 characters. Generate one
   locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64'))"`
   and copy the output into `.env`. Do not reuse the example value or commit
   the generated secret.

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

## Authentication

- `POST /api/auth/register` creates Patient accounts only. Passwords are hashed
  before they are stored.
- `POST /api/auth/login` verifies email, password, and the selected role. The
  session is an HTTP-only cookie; credentials are not stored in browser
  `localStorage`.
- `GET /api/auth/me` returns the signed-in account; `POST /api/auth/logout`
  clears its session.
- Doctor and Admin accounts cannot be self-registered. To provision one from a
  trusted PowerShell session, set the account variables and enter its password
  securely. Do not put passwords in command arguments or committed files:

```powershell
$env:PROVISION_NAME = 'Account name'
$env:PROVISION_EMAIL = 'account@example.com'
$env:PROVISION_ROLE = 'Admin'
$securePassword = Read-Host 'Account password' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $env:PROVISION_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  npm run auth:provision-user
} finally {
  Remove-Item Env:\PROVISION_NAME, Env:\PROVISION_EMAIL, Env:\PROVISION_ROLE, Env:\PROVISION_PASSWORD -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}
```
