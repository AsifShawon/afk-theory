# AFK THEORY Showcase Catalogue

An animated product showcase that costs nothing to host. Customers browse the collection, pick color, size and quantity, and send a ready-written order on **WhatsApp** or **Messenger**. You manage products from a **local admin** on your own computer. Products and photos live in **Supabase** (free plan), and the public site is rebuilt as static files whenever you press **Publish**.

```
 your computer                         cloud (free)
┌──────────────────────┐   writes    ┌──────────────┐
│ catalogue-admin      │ ──────────► │  Supabase    │  products, photos
│ http://127.0.0.1:8200│             └──────┬───────┘
│ [Publish] ───────────┼── deploy hook ──┐  │ read at build time
└──────────────────────┘                 ▼  ▼
                                   ┌──────────────────┐
                                   │ Cloudflare Pages │ ──► afktheory.pages.dev
                                   │ static site      │
                                   └──────────────────┘
```

Why it is built this way:

- **The live site never talks to Supabase.** Each build copies the published products and photos into the site. Visitors cost you no Supabase bandwidth, and the site keeps working even when Supabase pauses. Free Supabase projects pause after a week with no activity; that only affects the admin, and you restore it in the Supabase dashboard.
- **Cloudflare Pages is the default host** because its free plan serves static sites with unlimited bandwidth. Vercel's free Hobby plan is described as non-commercial only, and a site that exists to take orders likely counts as commercial even without online payment. If you still prefer Vercel, see [Hosting on Vercel or Netlify](#hosting-on-vercel-or-netlify).
- **The admin never goes online.** It holds the Supabase secret key, which can change anything in your database.

## 1. Create the Supabase project (once)

1. Sign up at supabase.com and create a new project (free plan). Pick the Singapore or Mumbai region, closest to Bangladesh.
2. Open **SQL Editor** and run each file in `apps/catalogue-admin/supabase/migrations/`, oldest first: paste the whole file and click **Run**. Running a file twice is safe.
   - `20261120000000_catalogue.sql` creates the tables, the security rules and the `catalogue` storage bucket.
   - `20261121000000_size_guides_seo.sql` adds shared size guides and the search title and description fields. Until it runs, the admin shows a reminder and the site falls back to each product's own chart.
   - `20261122000000_store_structure.sql` adds the store structure: subcategories, category banners and SEO fields, collections, mega menu product picks, Design options (for example Front design / Back design) with photos per design, product badges and "More designs" groups, content pages (About, Delivery and returns, Contact, Privacy, Terms) and the homepage section order. Until it runs, the site keeps building without them and the admin's new screens show a reminder.
3. Open **Project Settings > API Keys** and note three values:
   - the **Project URL** (`https://xxxx.supabase.co`)
   - the **publishable** key (or the legacy **anon** key)
   - the **secret** key (or the legacy **service_role** key). Keep this one private.

## 2. Run the admin on your computer

From the repository root:

```bash
pnpm install
```

Copy `apps/catalogue-admin/.env.template` to `apps/catalogue-admin/.env.local` and fill in `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.

Load the starter product (the Drop 01 tee with its 5 photos) and default settings:

```bash
pnpm catalogue-admin:seed
```

Start the admin:

```bash
pnpm catalogue-admin:dev
```

Open http://127.0.0.1:8200 and go to **Settings** first:

- **WhatsApp number**: with country code, e.g. `8801712345678` (`01712345678` is converted for you).
- **Facebook page username**: the part after `facebook.com/`. This powers the Messenger button.
- Check the delivery zones, FAQ and home page text.

Then manage products:

- **New product**: fill in the basics and create it as a draft, then upload photos on the next screen. Photos are converted to webp at 640, 1080 and 1600 px wide. A 4:5 portrait crop looks best.
- Set each photo's **role** (front, back, on model, detail) and **color**. The first photo is the product card; an "on model" photo makes the card swap on hover; picking a color on the site shows only that color's photos.
- Switch the product to **Published** when it is ready. Drag rows on the product list to change the order on the site. **Featured** products lead the home page.
- **Description**: use the toolbar for headings, bold, italic, quotes, lists and links. The product name is already the page's main title (H1), so sections inside the description start at **H2** (Heading) and **H3** (Subheading). Anything pasted from elsewhere is cleaned up when the site is built.
- **Size guides**: write each measurement chart once in **Settings > Size guides** (for example "Oversized tee"), then pick it under **Size guide** on every product that uses it. Changing a guide updates all of those products at the next Publish. Choose **Custom chart for this product only** for a one-off.
- **Search and sharing**: the search title (about 60 characters) and search description (about 160) control how the product appears in Google and in WhatsApp or Facebook link previews. Leave them empty to use the name and tagline. The preview shows what people will see.
- **Categories** (top menu): put a category inside another with **Parent** (for example T-Shirts > Drop shoulder; its page is `/c/t-shirts/drop-shoulder/`). Add a banner, a short description, search fields, and pick up to 2 **menu products** for its menu panel; with none picked, the newest products show. Categories without published products stay hidden on the site.
- **Collections**: groups such as "Drop 01" that mix categories. Add products in the order you want, a banner, and **Show on home** for the homepage spotlight.
- **Design options**: on a product, add designs (for example Front design and Back design) when customers choose one next to the color. Tag each photo with its design in **Images**. Products without designs show color only. To link separate products instead, give them the same **More designs group**.
- **Badge**: New or Bestseller. Sale (a compare-at price) and Sold out are added automatically, and products created in the last 30 days count as new.
- **Pages** and **Homepage**: write the About, Delivery and returns, Contact, Privacy and Terms pages, and choose the order of the homepage sections and which ones show.

**Before launch, replace the starter values:** the starter price of ৳1,450 comes from the old draft fixture. Size charts and fabric weight (GSM) are empty until you add them.

## 3. Preview the public site locally

Copy `apps/catalogue/.env.template` to `apps/catalogue/.env.local` and fill in `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Then:

```bash
pnpm catalogue:dev
```

Open http://localhost:8100, or use **Preview site** in the admin. In dev mode the site reads Supabase live, so saved changes show after a page refresh. Without a `.env.local` the site shows the starter product so you can still work on the design.

## 4. Put the site online with Cloudflare Pages (free)

1. Push this repository to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages > Create > Pages > Connect to Git**, and pick the repository.
3. Build settings:

   | Setting | Value |
   | --- | --- |
   | Framework preset | None |
   | Build command | `pnpm --filter @dtc/catalogue build` |
   | Build output directory | `apps/catalogue/out` |
   | Root directory | *(leave empty: repository root)* |

4. Environment variables (Production):

   | Name | Value |
   | --- | --- |
   | `NODE_VERSION` | `22` |
   | `PNPM_VERSION` | `10.11.1` (matches the repository) |
   | `SUPABASE_URL` | your project URL |
   | `SUPABASE_PUBLISHABLE_KEY` | the publishable / anon key (**never** the secret key) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-project>.pages.dev` (or your own domain later) |

5. Deploy. The site is live at `https://<your-project>.pages.dev`.
6. **Connect the Publish button:** in the Pages project open **Settings > Builds > Deploy hooks**, create a hook, copy its URL into `CATALOGUE_DEPLOY_HOOK_URL` in `apps/catalogue-admin/.env.local`, and restart the admin.

From then on: edit in the admin, press **Publish**, and the site updates in a minute or two. The admin header shows **Unpublished changes** until you do.

If a build fails with "Sync failed", Supabase is probably paused: restore it in the Supabase dashboard and press Publish again. The previous version of the site stays online until a build succeeds.

## Hosting on Vercel or Netlify

The site is plain static files, so any static host works with the same build command, output directory and environment variables.

- **Netlify**: its free plan explicitly allows commercial sites. It reads `public/_headers` like Cloudflare does. Build hooks are under Site configuration > Build & deploy.
- **Vercel**: set the root directory to `apps/catalogue`, framework to Next.js, and the same env vars. Deploy hooks are under Settings > Git. Read Vercel's fair-use terms for the Hobby plan before using it for a shop.

## How ordering works

- **WhatsApp:** the button opens `wa.me/<your number>` with the whole order already typed in. The customer checks it, adds name, phone and address, and taps send.
- **Messenger:** Messenger cannot reliably pre-type a message, so the site copies the order to the clipboard, shows "Order copied. Paste it in the Messenger chat and send.", and opens your page's chat.
- Every order gets a short code such as `AFK-261120-K7Q`, so you can refer to it in the chat. Nothing about the customer is stored anywhere.
- Customers can collect several items in the **order list** (saved in their browser) and send them as one message.

Example message:

```
Hi AFK THEORY, I would like to order:

Order AFK-261120-K7Q
1) Drop 01 Oversized Tee
   Graphite Black / L x 2 = BDT 2,900

Subtotal: BDT 2,900
Delivery: Inside Dhaka BDT 60 / Dhaka Suburbs BDT 100 / Outside Dhaka BDT 130
Payment: Cash on delivery

Name:
Phone:
Full address:
District:
```

## After the first deploy, check on a real phone

- Send the site link to yourself on WhatsApp and Messenger and check the preview card. The home page uses `src/app/opengraph-image.jpg`. Product pages use the product's first photo, which is webp; if a chat app shows no image for product links, tell the developer so it can switch to JPEG previews.
- Tap **Order on WhatsApp** and **Order on Messenger** on a phone and confirm each opens your chat.

## Limits of the free plans

- Supabase free: 500 MB database, 1 GB file storage, 5 GB bandwidth a month (only the admin and builds use it). Pauses after a week of inactivity.
- Cloudflare Pages free: 500 builds a month (one per Publish) and unlimited bandwidth for static files.
