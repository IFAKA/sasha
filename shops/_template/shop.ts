// Template for a new shop: `npm run new-shop <slug>` copies this folder to shops/<slug>.
// Replace every value with the shop's real data. The types in ../types.ts explain each field.
import { defineShop } from "../types";

export default defineShop({
  name: "Café Ejemplo",
  shortName: "Café Ejemplo",
  kind: "Café y pastelería",
  tagline: "Café de especialidad y pastelería casera",
  description: "Café de especialidad, desayunos y tortas por encargo.",

  address: "Av. Siempreviva 742, CABA",
  neighborhood: "Palermo",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Av.+Siempreviva+742+CABA",
  whatsapp: "5491100000000",
  instagram: "https://www.instagram.com/",
  // Optional links: each one shows up only when it's set, so leave out what the shop doesn't have.
  // PedidosYa: a "Pedí delivery por PedidosYa" button under "Visitanos" and a footer link.
  // pedidosYa: "https://www.pedidosya.com.ar/restaurantes/<ciudad>/<local>-menu",
  // Job application form: a "Trabajá con nosotros" link in the footer.
  // jobsForm: "https://docs.google.com/forms/d/e/<id>/viewform",

  // Put the logo and the cover in public/shops/<slug>/ and point to them here,
  // e.g. "/shops/<slug>/logo.jpg". Without a logo, the first letter of the name is shown.
  // Placeholder: replace it with a photo of the shop before sending the demo.
  cover: "/menu-stock/porcion-torta.jpg",
  coverAlt: "Porción de torta de chocolate",

  theme: { brand: "#9a4a1f", brandInk: "#743514", blush: "#f6e6da", cream: "#fbf7f2" },

  hours: {
    lunes: [8, 19],
    martes: [8, 19],
    miercoles: [8, 19],
    jueves: [8, 19],
    viernes: [8, 19],
    sabado: [9, 14],
    domingo: null,
  },

  home: {
    title: ["Tortas caseras para ", "compartir", "."],
    intro: "Café de especialidad en el salón y tortas por encargo para llevar.",
  },

  salon: {
    summary: "Café, desayunos y meriendas",
  },

  orders: {
    item: { one: "torta", other: "tortas", feminine: true },
    title: "Tortas por encargo",
    leadTimeHours: 24,
    payment: "mercadopago",
    referencePrefix: "EJEMPLO",
    namePrefix: "Torta ",
    sizeLegend: "Tamaño",
    notesPlaceholder: "Ej: escribir “Feliz cumple” en la torta…",
  },

  admin: true,
});
