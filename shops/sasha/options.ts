// What customers can personalize on a cake. Types and meaning of each field: ../types.ts.
import { defineOptions } from "../types";

const cakes = { categories: ["Tortas por pedidos"] };

export default defineOptions([
  {
    id: "relleno",
    label: "Relleno",
    kind: "one",
    required: true,
    choices: [
      { id: "dulce-de-leche", label: "Dulce de leche" },
      { id: "chocolate", label: "Chocolate" },
      { id: "frutos-rojos", label: "Frutos rojos", price: 2500 },
    ],
    appliesTo: cakes,
  },
  {
    id: "decoracion",
    label: "Decoración",
    kind: "many",
    max: 2,
    choices: [
      { id: "frutillas", label: "Frutillas", price: 3000 },
      { id: "merengue-quemado", label: "Merengue quemado" },
      { id: "flores-comestibles", label: "Flores comestibles", price: 4000, extraLeadHours: 24 },
    ],
    appliesTo: cakes,
  },
  {
    id: "mensaje",
    label: "Mensaje en la torta",
    kind: "text",
    maxLength: 30,
    price: 1500,
    appliesTo: cakes,
  },
  {
    id: "foto",
    label: "Foto impresa",
    kind: "one",
    sizes: ["28cm"],
    choices: [{ id: "con-foto", label: "Con foto comestible", price: 5000, extraLeadHours: 24 }],
    appliesTo: cakes,
  },
]);
