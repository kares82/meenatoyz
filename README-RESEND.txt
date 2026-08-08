MEENATOYZ — RESEND CONTACT FORM

Files:
- index.html
- functions/api/contact.js

Cloudflare Production settings:
1. RESEND_API_KEY — Secret — your Resend key (re_...)
2. RESEND_FROM — Variable — e.g. Meenatoyz <contact@meenatoyz.com>
3. CONTACT_TO — Variable — the inbox that should receive submissions

RESEND_FROM must be an address/domain authorized in Resend.

Project structure:
/
├── index.html
└── functions/
    └── api/
        └── contact.js

The browser posts to /api/contact. The Resend API key is only available to the Cloudflare Function.
