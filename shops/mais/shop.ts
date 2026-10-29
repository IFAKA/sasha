import { defineShop } from "../types";

// Products, prices and photos from their catalog (PDF). Postres by order only: no salón.

export default defineShop({
  name: "Mais Postres",
  shortName: "Mais",
  kind: "Tortas y postres por encargo",
  tagline: "Tortas, tartas y mesa dulce hechas a mano por Amanda Martínez",
  description: "Tortas, tartas, mesas dulces y desayunos de Mais Postres. Encargá online y retiralo en el día que elijas.",

  // She works in Rosario and Roldán; the exact pickup point is agreed over WhatsApp.
  address: "Rosario y Roldán, Santa Fe",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rosario+Santa+Fe",
  locations: [
    {
      name: "Rosario",
      address: "Retiro a coordinar",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rosario+Santa+Fe",
    },
    {
      name: "Roldán",
      address: "Retiro a coordinar",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rold%C3%A1n+Santa+Fe",
    },
  ],
  whatsapp: "5493415315963",
  instagram: "https://www.instagram.com/maispostres/",

  wordmark: { src: "/shops/mais/wordmark.png", width: 592, height: 212 },
  cover: "/shops/mais/hero.webp",
  coverAlt: "Brownie de Mais con dulce de leche, crema chantilly y frutos rojos",

  // The logo's brown for the brand, the catalog's sage for secondary text, on white like the catalog.
  theme: {
    brand: "#7a3a16",
    brandInk: "#5e2a0e",
    blush: "#f4e9e0",
    cream: "#fffdfa",
    ink: "#3b2214",
    muted: "#6b6e4f",
    line: "#eee2d6",
  },

  // TODO: real pickup days and hours.
  hours: {
    lunes: [9, 19],
    martes: [9, 19],
    miercoles: [9, 19],
    jueves: [9, 19],
    viernes: [9, 19],
    sabado: [9, 14],
    domingo: null,
  },

  home: {
    title: ["Postres caseros, ", "hechos a mano", " para tus momentos."],
    intro: "Tortas, tartas, mesas dulces y desayunos por encargo. Elegí, pagá online y retiralo el día que quieras.",
    featured: ["Brownie redonda", "Lemon pie", "Torta Matilda", "Key lime pie", "Rogel", "Red velvet"],
  },

  orders: {
    item: { one: "postre", other: "postres", feminine: false },
    title: "Tortas y postres por encargo",
    cta: "Hacer un pedido",
    leadTimeHours: 48,
    payment: "mercadopago",
    referencePrefix: "MAIS",
    rules: ["Te escribimos por WhatsApp para coordinar el punto de retiro."],
    namePrefix: "Torta ",
    notesPlaceholder: "Ej: escribir “Feliz cumple, Juli” en la torta, o el gusto del budín…",
  },

  admin: true,
});
