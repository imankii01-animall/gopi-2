# Animall Gopi Shopify MVP (Dawn Customization)

This package gives you a **no-backend, no-server** MVP flow in Shopify:
- Farmer listing page with location/search/type filters.
- Product order page with quantity, customer details, phone verification gate, and checkout handoff.
- All logic is Liquid + CSS + JS inside the theme.
- Styles are section-scoped (no global theme overrides).

## Folder Edits (Exact)

Copy these files into your Dawn theme with the same paths:

- `assets/animall-gopi.css`
- `assets/animall-gopi.js`
- `sections/animall-gopi-marketplace.liquid`
- `sections/animall-gopi-order-flow.liquid`
- `templates/page.animall-gopi.json`
- `templates/product.animall-gopi-order.json`

Also included:
- `scripts/validate-theme-pack.sh` (local validation before upload)
- `SHOPIFY_LAUNCH_CHECKLIST.md` (go-live runbook)

## Shopify Setup

1. In Shopify Admin, open your theme and upload the files above.
2. Create a page named `Animall Gopi` and assign template: `page.animall-gopi`.
3. In Theme Editor for that page section, select the collection containing all farmer products.
4. Assign product template `product.animall-gopi-order` to ghee products.
5. Ensure those products are available on Online Store sales channel.

## Quick Validation

Run this before uploading files:

```bash
./scripts/validate-theme-pack.sh
```

It checks:
- Required files exist.
- JavaScript syntax.
- Liquid schema JSON validity.
- Section settings references match schema IDs.

## Theme Editor Controls (New)

Both sections now support:
- Copy labels/messages (buttons, headings, validation text, sold-out text).
- Form field labels/placeholders (name, phone, address, city, state, PIN, unit label).
- Color tokens (background, card, border, text, button, badge, accent).

This lets you match your existing Dawn branding without code edits.

## Product Data Convention (Simple)

Use either metafields or tags. Metafields win if both exist.

Recommended tags:
- `location:Anand Gujarat`
- `type:A2 Cow Ghee`
- `method:Bilona`

Optional metafields (`custom` namespace):
- `farmer_name` (single line text)
- `farmer_location` (single line text)
- `ghee_type` (single line text)
- `production_method` (single line text)
- `rating` (number or text)

## What Works in This MVP

- Listing cards: image, farmer name, location, rating, ghee type, Bilona badge, stock, price/kg.
- Filters: location dropdown, text search, ghee-type chips.
- Order flow: quantity stepper (stock cap), customer details, phone verification gate.
- Checkout: uses Shopify cart add (`/cart/add.js`) then redirects to `/checkout`.
- If inventory tracking is off, quantity is capped at 25 kg per order as a safe default.

## Important Note

Phone verification in this theme is a client-side verification gate (10-digit validation + verify action). For real OTP delivery, connect a dedicated OTP app/service in a later phase.
# gopi-2
# gopi-2
