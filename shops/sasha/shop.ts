import { defineShop } from "../types";

const ASSETS = "https://storage.googleapis.com/prod-parra-argentina-assets/clients/133";

export default defineShop({
  name: "Sasha Pasteles",
  shortName: "Sasha",
  kind: "Pastelería y café",
  tagline: "Pastelería y café de autor en Recoleta",
  description: "Tortas por encargo, desayunos, almuerzos y meriendas en Juncal 2110, Recoleta.",

  address: "Juncal 2110, CABA",
  neighborhood: "Recoleta",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sasha+Pasteles&query_place_id=ChIJBYCUnpfKvJURyiD_BjcjvMg",
  phone: { value: "+541148233745", label: "011 4823-3745" },
  whatsapp: "5491144753427",
  email: "info.sashapasteles@gmail.com",
  instagram: "https://www.instagram.com/sashapasteles",
  facebook: "https://www.facebook.com/Sasha.Pasteles1",

  logo: `${ASSETS}/profile/profile.webp`,
  cover: `${ASSETS}/portrait/portrait.webp`,
  coverAlt: "Brownies de Sasha Pasteles apilados junto a una tetera",
  remoteImages: [{ hostname: "storage.googleapis.com", pathname: "/prod-parra-argentina-assets/clients/133/**" }],

  theme: { brand: "#d01d80", brandInk: "#a3135f", blush: "#fbe4ef", cream: "#fbf6f0" },

  hours: {
    lunes: null,
    martes: [9, 20],
    miercoles: [9, 20],
    jueves: [9, 20],
    viernes: [9, 20],
    sabado: [9, 20],
    domingo: [9, 20],
  },

  home: {
    title: ["Tortas por las que vale la pena hacer ", "fila", "."],
    intro: "Desayunos, almuerzos y meriendas en el salón, y tortas por encargo para llevar a casa.",
    featured: ["Torta Banana Split", "Torta Rogel", "Torta Red Velvet", "Torta Franui", "Torta Bombón", "Torta Lemon Pie"],
  },

  salon: {
    summary: "Desayunos, almuerzos, café y mesa dulce",
    stayLimit: "1:45 hs",
  },

  orders: {
    item: { one: "torta", other: "tortas", feminine: true },
    title: "Tortas por encargo",
    leadTimeHours: 48,
    payment: "mercadopago",
    referencePrefix: "SASHA",
    namePrefix: "Torta ",
    sizeLegend: "Tamaño del molde",
    sizePrefix: "Molde de",
    sizeNotes: { "22cm": "≈ 8 porciones", "28cm": "≈ 12 porciones" },
    rules: ["Consumir dentro de las 12 hs de retirada."],
    notesPlaceholder: "Ej: escribir “Feliz cumple, Martu” en la torta…",
    salonUpsell: "¿Querés la torta entera?",
  },

  admin: true,
});
