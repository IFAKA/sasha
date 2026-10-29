import { defineShop } from "../types";

// Menu from their PDF, which has no prices or photos: prices are estimates and the photos are
// illustrative Wikimedia Commons ones (credited in stock-photos.json). The take-away catalog is
// their bakery by the box. TODO: real prices and what they sell to go.

export default defineShop({
  name: "SENS Tienda & Café",
  shortName: "SENS",
  kind: "Tienda & café",
  tagline: "Parador Sens: tienda de café, deco y más en Funes",
  description: "Desayunos, brunch, almuerzos y café de especialidad en SENS, Funes. Mirá el menú y encargá online para retirar.",

  address: "Bernardo Houssay 1608",
  neighborhood: "Funes",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bernardo+Houssay+1608+Funes+Santa+Fe",
  whatsapp: "5493417451768",
  instagram: "https://www.instagram.com/sens.funes/",

  wordmark: { src: "/shops/sens/wordmark.png", width: 484, height: 200 },
  cover: "/shops/sens/hero.webp",
  coverAlt: "Logo de SENS Tienda & Café sobre las rayas doradas de su carta",

  // The menu's gold stripes, darkened for buttons, with the logo's ink for text.
  theme: {
    brand: "#7a6532",
    brandInk: "#5c4b24",
    blush: "#f3eedf",
    cream: "#fdfcf8",
    ink: "#231f20",
    muted: "#6d675c",
    line: "#e8e1cf",
  },

  hours: {
    lunes: [8, 20],
    martes: [8, 20],
    miercoles: [8, 20],
    jueves: [8, 20],
    viernes: [8, 20],
    sabado: [9, 20],
    domingo: [9, 13],
  },

  home: {
    title: ["Café, brunch y ", "cosas ricas", " en Funes."],
    intro: "Desayunos, toasts, pancakes y almuerzos en el salón, y la panadería para llevar. Elegí, pagá online y retirá en el parador.",
    featured: ["Medialunas", "Rolls de canela", "Alfajores surtidos", "Crumble de manzana", "Cookies", "Torta del día"],
  },

  salon: {
    name: "Menú",
    summary: "Desayunos, brunch, almuerzos, café y tragos",
  },

  orders: {
    item: { one: "producto", other: "productos", feminine: false },
    title: "Panadería para llevar",
    cta: "Hacer un pedido",
    leadTimeHours: 24,
    payment: "mercadopago",
    referencePrefix: "SENS",
    sizeLegend: "Cantidad",
    notesPlaceholder: "Ej: los croissants con Nutella, o las cookies de pistacho…",
    salonUpsell: "¿Te llevás algo para casa?",
  },

  admin: true,
});
