// What customers can personalize on a cake, inside the limits set here. Leave the list empty for none.
// Types and meaning of each field: ../types.ts. Delete this file if the shop has no options.
import { defineOptions } from "../types";

export default defineOptions([
  // Example: a required filling, with one choice that costs more.
  // {
  //   id: "relleno",
  //   label: "Relleno",
  //   kind: "one", // "one" picks one, "many" picks several (see `max`), "text" is a message
  //   required: true,
  //   choices: [
  //     { id: "dulce-de-leche", label: "Dulce de leche" },
  //     { id: "frutos-rojos", label: "Frutos rojos", price: 2500, extraLeadHours: 24 },
  //   ],
  //   appliesTo: { categories: ["Tortas"] }, // category names from menu.json, or `products: [product ids]`
  // },
]);
