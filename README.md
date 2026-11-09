# Mr Care Design Studio

A responsive interior design discovery, booking, and enquiry platform built with React, Vite, Express, and MongoDB.

## Start the website

Install dependencies with `npm install`, then run `npm run dev`. Vite serves the website at `http://localhost:5173`.

## Enquiry API and database

Copy `.env.example` to `.env`, add a MongoDB connection string, an admin email, a bcrypt password hash, and a long random JWT secret. Start the API with `npm run server`. The website proxies `/api` requests to `http://localhost:4000`.

Enquiries are validated and saved to MongoDB when the database is available. When the API is offline, the demo website keeps enquiries in this browser's local storage so the booking journey remains usable. Before production, connect the admin dashboard login and enquiry list to the protected API endpoints, and configure HTTPS and allowed CORS origins.

## Build

Run `npm run build` to produce the production frontend in `dist/`.

