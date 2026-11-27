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

## Database activity audit history

The append-only `AuditLog` model stores new activity in MongoDB's `auditlogs`
collection. Records are written for supported account, profile, appointment,
review, prescription, and health-report operations. No historical records are
backfilled. Audit entries contain fixed action labels and record/user IDs only;
they do not store passwords, tokens, profile details, diagnoses, report contents,
or other medical data.

- `GET /api/audit-logs` is Admin-only and supports `from`, `to`, `userRole`,
  `operationType`, `module`, `page`, and `limit` query parameters.
- The Admin UI is available at `/audit-history`.
- There are no audit-log update or delete API routes, and the Mongoose model
  rejects update/delete operations.
- Doctors can confirm their own pending appointments with
  `PATCH /api/appointments/:id/confirm`; the confirmation is audited.

## Payments

Payments are stored in the separate MongoDB `payments` collection and are
linked to the authenticated patient and their appointment. Amounts come from
the appointment's server-calculated fee; browser-supplied amounts are ignored.
Payment records contain only provider references and status metadata, never
card numbers, CVV, passwords, or gateway credentials.

- `POST /api/payments/checkout` (Patient) starts checkout for `bkash` or
  `card` (`cardBrand` must be `visa` or `mastercard`).
- `GET /api/payments/mine` and `GET /api/payments/:id` (Patient) return only
  the signed-in patient's payment history.
- `POST /api/payments/:id/resolve` (Patient) checks a pending attempt against
  SSLCOMMERZ's authenticated transaction-query API. It changes status only
  after matching the stored session, transaction reference, amount, and BDT
  currency; successful statuses also pass the existing order-validation checks.
- Browser fail/cancel redirects are not trusted as payment status. A retry is
  permitted only after an attempt is recorded as Failed or Cancelled; Pending
  attempts stay blocked until the provider confirms a terminal outcome. A
  database unique index permits at most one Pending or Paid attempt per
  appointment.
- SSLCOMMERZ posts to `/api/payments/sslcommerz/success`, `/fail`, `/cancel`,
  and `/ipn`. Paid status is set only after server-side order validation
  confirms the transaction reference, amount, BDT currency, and non-risky
  validation status.
- Payment initiation, definitive gateway-initiation failure, provider-confirmed
  failure/cancellation, and verified-payment events are written to `auditlogs`.
- Configure `SSLCOMMERZ_MODE`, `SSLCOMMERZ_STORE_ID`,
  `SSLCOMMERZ_STORE_PASSWORD`, and `PAYMENT_CALLBACK_BASE_URL` in the backend
  `.env`. The callback URL must be publicly reachable over HTTPS outside local
  sandbox development. Keep merchant credentials private.
- Nagad is shown in the UI but checkout remains unavailable until its official
  direct-merchant integration and credentials are configured. No unsupported
  API requests or simulated transactions are made.

### Supported payment methods

The SSLCOMMERZ v4 integration requests these documented gateway channels:

- bKash: `multi_card_name=bkash`
- Visa: `multi_card_name=visacard`
- Mastercard: `multi_card_name=mastercard`

These methods are available only if enabled for the merchant's SSLCOMMERZ
store. This project has no store credentials configured, so the merchant
account's channel activation has not been verified. Nagad checkout remains
disabled; its logo does not mean direct Nagad processing is configured.

### Configure SSLCOMMERZ sandbox credentials

1. Create a sandbox account from the official
   [SSLCOMMERZ sandbox registration page](https://developer.sslcommerz.com/registration/)
   (the page links to the sandbox signup at `sandbox-gw.sslcommerz.com`).
2. Complete the signup and obtain the sandbox Store ID and Store Password from
   the sandbox merchant account. These are test credentials; production
   credentials are separate and require merchant onboarding.
3. Copy this backend folder's `.env.example` to `.env`, then set the credentials
   in the backend environment only:

   ```dotenv
   SSLCOMMERZ_MODE=sandbox
   SSLCOMMERZ_STORE_ID=your_sandbox_store_id
   SSLCOMMERZ_STORE_PASSWORD=your_sandbox_store_password
   PAYMENT_CALLBACK_BASE_URL=https://your-public-api-host
   ```

4. Replace the callback URL with the backend's externally reachable HTTPS
   origin. SSLCOMMERZ must be able to reach the generated `/api/payments/sslcommerz`
   callback endpoints; `localhost` is not reachable by the hosted gateway.
   The integration sends an IPN URL during session creation; confirm that IPN
   delivery is enabled for the sandbox store.
5. Keep `.env` out of source control and never put Store ID/Password in the
   frontend or browser environment. The backend defaults to sandbox mode;
   production mode must use production credentials and HTTPS callbacks.
6. Follow the vendor's
   [v4 hosted checkout and validation guide](https://developer.sslcommerz.com/doc/v4/)
   to run a sandbox transaction and verify the IPN/return round trip before
   enabling production credentials.

No live or sandbox transaction has been performed for this project because
merchant credentials and a reachable callback URL are not configured.
