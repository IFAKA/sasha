# Shop template

An ordering site for cafés and bakeries: home page, dine-in menu, made-to-order products with
pickup times, and an orders and sales panel. One codebase serves every shop; each shop is just
configuration in `shops/<slug>/`.

```
shops/
  types.ts            what a shop can configure (every field is documented)
  _template/          copied by `npm run new-shop`
  sasha/
    shop.ts           name, contact, hours, colors, texts, features
    menu.json         categories and products (generated, don't edit by hand)
    stock-photos.json openly licensed photos for products without one (credited at /creditos)
public/shops/<slug>/  that shop's logo, cover and photos
```

The `SHOP` environment variable picks the shop (default: `sasha`). `npm run dev` and
`npm run build` write `shops/current.ts` from it, and the app imports the shop from there.

## Add a shop

```bash
npm run new-shop -- cafe-roma "Café Roma"
```

1. Fill in `shops/cafe-roma/shop.ts`: address, WhatsApp, hours, colors and texts.
2. Put the logo and cover in `public/shops/cafe-roma/` and point to them in `shop.ts`.
3. Load the menu from a spreadsheet. Import `shops/_template/menu-ejemplo.csv` into Google Sheets,
   fill it in, share it as "anyone with the link", then:
   ```bash
   npm run menu-from-csv -- cafe-roma "https://docs.google.com/spreadsheets/d/<id>/edit"
   ```
   For a shop on Parra Marketplace: `npm run import-parra -- <parra-slug> cafe-roma`.
   For a shop on Núcleo Check (`prod.nucleocheck.com/menu/<id>/1`): `npm run import-nucleocheck -- <id> cafe-roma`.
4. Try it locally:
   ```bash
   SHOP=cafe-roma npm run dev               # bash
   $env:SHOP="cafe-roma"; npm run dev       # PowerShell
   ```
5. Deploy: in Vercel, create a new project from this same repo and set the environment
   variable `SHOP=cafe-roma`. Each shop is its own project, so it gets its own domain.

## Plans

Two settings in `shop.ts` decide what the shop gets:

| | Basic | Pro |
|---|---|---|
| `orders.payment` | `"whatsapp"`: the order arrives in the shop's WhatsApp, paid on pickup | `"mercadopago"`: paid online before pickup |
| `admin` | `false` | `true`: orders panel and sales dashboard at `/admin` |

With `"mercadopago"`, payments are simulated until `MP_ACCESS_TOKEN` is set (see `.env.example`).

Other options: leave out `salon` for shops without tables (the Salón page disappears), and set
`orders.leadTimeHours` to `0` for same-day orders (the notice disappears).

## Notes

- Orders and the panel live in the browser's localStorage. That's fine for a demo; a real
  deployment needs a database and a login for `/admin`.
- The site is marked `noindex`, so demos don't show up in Google.
