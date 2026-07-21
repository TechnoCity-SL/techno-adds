# PRODUCT BRIEF — TechnoAds (by Technocity)

## Product

TechnoAds is a free-to-post classifieds marketplace for Sri Lanka, launching
with three categories: Vehicles, Property, and Techno & Gadgets. It competes
directly with ikman.lk. Core mechanics: phone-OTP-verified sellers post ads
for free; sellers can optionally pay to boost an ad's visibility (Top Ad /
Super Ad tiers) via card/wallet (PayHere) or manual bank transfer. Buyers
browse/search, message sellers in-app, call/WhatsApp verified phone numbers,
save searches, and can report bad listings. Moderators review new ads,
reports, and bank-transfer payment proofs from an internal admin panel.

## Brand & visual direction

- Primary brand color: a strong indigo-blue (approx #3B4FD9 / oklch(0.52 0.19
  258)) — deliberately NOT ikman.lk's green, needs to feel distinct at a
  glance.
- Tone: clean, modern, trustworthy, mobile-app-like. Card-based layouts,
  rounded corners, generous tap targets, light use of shadow/elevation.
- Currently using plain emoji as placeholder icons (⭐ Top badge, 👑 Super
  badge, 🚩 Report, 💬 Message Seller, ☆ Favorite) — replace all of these
  with a proper icon set in the final design.
- Needs a visible "verified" trust signal wherever a seller's phone number
  has been OTP-verified (e.g. a small checkmark/badge near their name).
- Support both light and dark mode.

## Platform & device requirements

- Mobile-first. Design the 375px-wide mobile layout FIRST for every screen,
  then adapt up to tablet (768px) and desktop (1280px+). Most real users are
  on Android phones with mid-range screens, so prioritize thumb-reachable
  controls, sticky bottom action bars for multi-step flows, and native-feeling
  inputs (numeric keyboards for price/phone fields, camera-capture-enabled
  file inputs for photo upload).
- Copy should be written so it still fits if translated to Sinhala or Tamil
  later (avoid tight-fixed-width text containers, expect ~20-30% length
  variance).
- Currency is always Sri Lankan Rupees, formatted as "Rs. 1,250,000".

## Global / shared components

- **Site header** (all public pages): logo/wordmark on the left, a search
  bar, and on the right either "Login" (guest) or "Messages" / "My Ads" /
  "Post an Ad" + a user avatar menu (logged in). Sticky on scroll.
- **Ad card**: thumbnail image, price (bold, brand color), title (2-line
  clamp), condition + negotiable tag, and — when boosted — a small badge in
  the corner: amber/gold "Top" badge for Top Ad tier, purple "Super" badge
  - a subtle purple ring around the whole card for Super Ad tier. Used in
    category grids, search results, and a horizontal "Featured" carousel.
- **Bottom sticky action bar**: used on multi-step flows (post-ad wizard,
  boost flow) with Back/Next or a primary CTA, always visible without
  scrolling on mobile.
- **Empty states**: every list screen (My Ads, Messages, Saved Searches,
  moderation queues, search results) needs a friendly empty state with an
  icon/illustration, one line of copy, and a relevant CTA button.
- **Loading states**: skeleton cards for ad grids, a typing/loading
  indicator for chat, a spinner for payment status polling.
- **Toast/inline errors**: form validation errors appear inline under the
  field, not as popups; network/payment failures get a dismissible banner.

---

# PAGES — PUBLIC / GUEST (no login required)

### 1. HOMEPAGE ( / ) — NOT YET DESIGNED, design from scratch

- Header (as above) with a prominent search bar.
- Hero area: short value prop headline + search, mobile-optimized.
- Three large category tiles: Vehicles, Property, Techno & Gadgets — each
  with an icon/photo and tappable straight into that category's listing
  page.
- "Featured" horizontal-scroll carousel of Super Ad listings (crown
  badge, larger card, more visible photo).
- "Recently posted" grid of the newest active ads across all categories.
- Trust strip: "Phone-verified sellers", "Post for free", "No listing
  fees" style badges.
- Footer: links to categories, about, terms/privacy (placeholder), social.

### 2. LOGIN ( /login )

- "Continue with Google" and "Continue with Facebook" buttons (OAuth).
- Divider "or".
- Email + password fields, "Log in" button.
- Link to Signup.
- Supports a redirect-after-login (e.g. arriving here from "Message
  Seller" while logged out) — no special UI needed, just note that login
  is a common interstitial step reached from many other screens.

### 3. SIGNUP ( /signup )

- Same visual shape as Login: OAuth buttons + divider + email/password
  fields + "Sign up" button + link back to Login.

### 4. CATEGORY LISTING ( /vehicles, /property, /techno-gadgets style pages )

- Header, category name as page title, result count ("1,204 ads found").
- Sort control: Newest / Price: Low to High / Price: High to Low.
- "Featured" row: 4 Super Ad cards in a horizontal scroll, shown only
  when featured ads exist for this category.
- Main results: responsive grid of Ad Cards — 2 columns on mobile, 3-4 on
  desktop.
- Pagination at the bottom.
- Empty state: "No ads found in this category yet."

### 5. CATEGORY + LOCATION LISTING

(same as above, scoped to a specific city, e.g. Vehicles in Colombo) —
identical layout to #4, with the location name added to the page title
("Vehicles in Colombo").

### 6. SEARCH RESULTS ( /search?q=... )

- Same grid/sort layout as category listing, but no featured row, and no
  category filter — spans all categories.
- When a query is active: a small "☆ Save this search" button and a "My
  saved searches →" link appear above the results.
- Empty state: "No ads found for '<query>'."

### 7. AD DETAIL PAGE ( /ad/[id]/[slug] )

- Large main photo + horizontal thumbnail strip below it (image gallery,
  swipeable on mobile).
- Title, price (large, bold), "(negotiable)" tag if applicable.
- Meta line: category · location · condition.
- Action row: Favorite (star toggle), "💬 Message Seller" (hidden on your
  own ad), "🚩 Report" (opens an inline textarea + submit/cancel, not a
  popup/dialog).
- Description section (plain text, preserve line breaks).
- Category-specific attributes as a 2-column definition-list-style grid
  (e.g. Brand, Model, Year, Mileage, Fuel Type, Transmission for a
  vehicle).
- Seller section: seller name (with verified badge if phone verified),
  "Call [number]" and "WhatsApp" buttons for each verified phone number
  the seller has chosen to show; "No verified phone number available."
  as a fallback state.
- If boosted: Top/Super badge visible near the title.

### 8. SAVED SEARCHES ( /saved-searches )

- Simple list: each row shows the saved query text (tappable → re-runs
  the search) and a "Remove" button.
- Empty state: "No saved searches yet. Save one from the search results
  page."

---

# PAGES — LOGGED-IN (buyer & seller actions)

### 9. POST AN AD — WIZARD ( /post-ad )

4-step flow with a progress indicator and sticky bottom Back/Next bar:

- **Step 1 — Category & Location**: pick one of the 3 categories, then a city.
- **Step 2 — Details**: title, description, price (numeric keypad), negotiable
  toggle, condition (new/used), plus category-specific fields that change
  dynamically based on the chosen category (e.g. vehicle fields vs.
  property fields vs. gadget fields).
- **Step 3 — Photos**: up to 5 photos, camera-capture-enabled upload button,
  thumbnail grid with a remove (×) control on each, upload-in-progress
  state per photo.
- **Step 4 — Review**: read-only summary of everything entered, with the
  ability to jump back to any step to edit, and a final "Post Ad" submit
  button.

ALSO DESIGN a second entry point at the top of step 1: a prominent
"✨ Post with AI assistance" option/toggle (upload photos first, an AI
analyzes them and pre-fills title/description/attributes in the Review
step for the user to edit and confirm) sitting alongside "Post manually"
— manual stays the default/fallback path.

### 10. POST-AD SUCCESS ( /post-ad/success )

- Confirmation checkmark/illustration, "Your ad has been submitted for
  review" messaging (ads are moderated before going live, not instant),
  button to view "My Ads".

### 11. MY ADS ( /my-ads )

- List of the user's own ads: thumbnail, title, price, status pill
  (Pending Review / Active / Rejected / Removed — each a distinct
  color), and if boosted, the tier + "until <date>" expiry text.
- "Boost this ad" button on active, unboosted ads; "Extend boost" on
  already-boosted active ads.
- Empty state: "You haven't posted any ads yet" + "Post your first ad"
  CTA.

### 12. BOOST AN AD ( /my-ads/[id]/boost )

- Ad title shown as context header.
- Placement options as selectable cards: Top Ad (3/7/15 day options)
  and Super Ad (7/15/30 day options), each showing price in Rs.
- Payment method choice: "Card / Wallet (PayHere)" vs "Bank Transfer" as
  two selectable tiles.
- "Continue to payment" button.

### 13. PAYHERE CHECKOUT ( /orders/[id]/pay/payhere )

- Order summary card: amount, tier + duration purchased.
- Single prominent "Proceed to PayHere" button (this hands off to an
  external hosted payment page, so keep this screen minimal/transitional).

### 14. BANK TRANSFER PAYMENT ( /orders/[id]/pay/bank-transfer )

- Order summary (same as above).
- Design FOUR distinct states this screen can be in:
  1. **Pending**: bank details card (bank name, account name, account
     number, branch, a short reference code) + a receipt-upload control.
  2. **Awaiting confirmation**: "Receipt submitted, a moderator will review
     it shortly" message, no upload control.
  3. **Paid**: green success state, "Your ad's boost is now active."
  4. **Failed**: "This payment couldn't be confirmed, please start a new
     boost order" message.

### 15. ORDER RETURN / CONFIRMATION ( /orders/[id]/return )

- Landing page after returning from PayHere. Two states: "Payment
  confirmed!" (success) or "Payment received, confirming…" (still
  processing, informational, not an error) — link back to My Ads.

### 16. MESSAGES — CONVERSATION LIST ( /messages )

- List of conversations: other person's name, the related ad's title,
  last message preview (truncated).
- Empty state: "No conversations yet. Message a seller from an ad to
  start one."

### 17. MESSAGE THREAD ( /messages/[id] )

- Back link, header showing the other person's name + a link to the ad
  being discussed.
- Scrollable message bubble list: own messages right-aligned in the
  brand primary color, the other person's left-aligned in a neutral/
  muted color. New messages should feel like they arrive live (chat-app
  style, no page refresh).
- Text input + Send button pinned to the bottom.

### 18. ACCOUNT / PHONE VERIFICATION — NOT YET DESIGNED, design from scratch

- A simple account/profile settings page: display name field, and a
  list of the user's phone numbers each with Verified/Unverified status
  and a Hide-from-public toggle.
- "Add a phone number" flow: enter number → 6-digit OTP code entry
  (individual digit boxes or a single code field) → "Resend code"
  with a cooldown timer → verified confirmation state.

---

# PAGES — ADMIN / MODERATOR (internal tool, different visual weight)

### 19. ADMIN MODERATION DASHBOARD ( /admin/moderation )

Give this a denser, more utilitarian "internal ops tool" feel than the
public site (more table-like rows, less card padding) while keeping the
same brand color/typography. Three stacked sections on one page:

1. **Moderation Queue** — pending ads awaiting approval: title + price per
   row, Approve / Reject buttons.
2. **Reports** — pending user reports: target type + id, the reporter's
   reason text, Resolve / Dismiss buttons.
3. **Bank Transfer Payments** — orders awaiting confirmation: a small
   receipt thumbnail, ad title, tier + amount, Approve / Reject buttons.

Each section needs its own empty state ("No ads pending review.", "No
pending reports.", "No payments awaiting confirmation.").

---

# CROSS-CUTTING SCENARIOS TO DESIGN FOR

- Guest vs. logged-in header states, and the common "please log in" bounce
  (guest taps Message Seller / Save Search / Report → sent to Login → back
  to where they were).
- Every list screen needs a designed empty state, not just a happy path.
- Every async action needs a pending/loading micro-state (button shows
  "Saving…", "Uploading…", "Submitting…" etc., disabled while in flight).
- Ad status is always visible where relevant: Pending Review, Active,
  Rejected, Removed — each needs a distinct, consistent color treatment
  used everywhere status appears (My Ads, admin queue).
- Boost tier badges (Top = amber/gold, Super = purple + ring) must look
  identical everywhere an Ad Card appears — homepage, category grid,
  search, featured carousel.
- Design at 375px mobile width first for every single screen, then confirm
  it holds up at 768px and 1280px+.
