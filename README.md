# Artihcus Backend

Express API for contact and career form emails.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` (or create `.env`) with:
   - `EMAIL_USER` – Gmail address
   - `EMAIL_PASS` – Gmail app password
   - `PORT` – Optional; default 5000

## Run

`npm start` — serves on http://localhost:5000

## Endpoints

- `POST /send-email/contacthome` – Contact form (JSON body)
- `POST /send-email/career` – Career form (multipart: name, email, phone, resume file)
"# website-backend" 
