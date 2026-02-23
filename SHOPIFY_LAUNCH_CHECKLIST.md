# Shopify Launch Checklist (Animall Gopi MVP)

## 1. Theme File Upload

Preferred method (recommended):

1. From this package folder run:
   - `./scripts/validate-theme-pack.sh`
   - `./scripts/install-into-dawn.sh /absolute/path/to/your-dawn-theme`
   - `./scripts/e2e-check.sh /absolute/path/to/your-dawn-theme`

Manual method (if needed):

Copy these files into your Dawn theme:
- `assets/animall-gopi.css`
- `assets/animall-gopi.js`
- `sections/animall-gopi-marketplace.liquid`
- `sections/animall-gopi-order-flow.liquid`
- `templates/page.animall-gopi.json`
- `templates/product.animall-gopi-order.json`

## 2. Create Marketplace Page

1. Shopify Admin -> Online Store -> Pages -> Add page.
2. Title: `Animall Gopi`.
3. Theme template: `page.animall-gopi`.
4. In theme editor, open this page and set:
   - `Products collection`
   - Labels and colors as needed.

## 3. Assign Product Template

1. Open all ghee products.
2. Set Theme template to `product.animall-gopi-order`.
3. Save.

## 4. Product Data Setup

For each product, set either tags or metafields.

Recommended tags:
- `location:Anand Gujarat`
- `type:A2 Cow Ghee`
- `method:Bilona`

Optional `custom` metafields (override tags):
- `farmer_name`
- `farmer_location`
- `ghee_type`
- `production_method`
- `rating`

## 5. Inventory Rules

- Enable inventory tracking for strict stock limits.
- If inventory tracking is disabled, order page allows up to 25 units per order.
- If tracked stock is `0`, CTA is disabled as sold out.

## 6. Payments and Checkout

- Ensure payment gateway is configured in Shopify.
- Ensure products are on Online Store sales channel.
- Order flow adds product to cart with customer properties and redirects to checkout.

## 7. QA Smoke Test

1. Open Marketplace page.
2. Verify:
   - Location filter works.
   - Search works.
   - Type filters work.
3. Open one in-stock product:
   - Quantity +/- works.
   - Cannot exceed stock.
   - Verify button gates checkout.
   - Required fields enforce input.
4. Submit order and confirm redirect to `/checkout`.
5. Check line item properties in order/cart include:
   - Customer Name
   - Phone Number
   - Phone Verified
   - Address fields

## 8. Optional Real OTP Upgrade

Current phone verification is UI-level validation. For real OTP, integrate Shopify OTP app/provider in next phase.
