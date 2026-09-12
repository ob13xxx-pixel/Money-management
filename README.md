# TRIWEALTH V1

A mobile-first prototype for the TRIWEALTH personal money-management concept.

## Included
- Three Wealth model: Spend / Save / Invest
- Income allocation
- Expense tracking and monthly budget
- Financial goals with weekly/monthly contribution and estimated completion time
- Basic local TriAI assistant (rule-based, no API key required)
- Local app-lock PIN prototype
- Export/delete local data
- No bank connection in V1

## Important security note
This is a front-end prototype. LocalStorage is NOT suitable for storing production financial data or secrets. Before production, move sensitive data to a properly secured backend, use modern authentication/passkeys, server-side authorization, encryption/key management, rate limiting, audit logging, secure session handling, and independent security testing.

## Run on a phone
Open `index.html` in a mobile HTML editor/browser. No build step is required.
