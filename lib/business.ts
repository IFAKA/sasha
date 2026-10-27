const ASSETS = "https://storage.googleapis.com/prod-parra-argentina-assets/clients/133";

export const business = {
  name: "Sasha Pasteles",
  tagline: "Pastelería y café de autor en Recoleta",
  address: "Juncal 2110, CABA",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sasha+Pasteles&query_place_id=ChIJBYCUnpfKvJURyiD_BjcjvMg",
  phone: "+541148233745",
  phoneLabel: "011 4823-3745",
  whatsapp: "5491144753427",
  email: "info.sashapasteles@gmail.com",
  instagram: "https://www.instagram.com/sashapasteles",
  facebook: "https://www.facebook.com/Sasha.Pasteles1",
  logo: `${ASSETS}/profile/profile.webp`,
  cover: `${ASSETS}/portrait/portrait.webp`,
  salonStayLimit: "1:45 hs",
} as const;

// Days use Date#getUTCDay() numbering on Argentina wall-clock time (0 = domingo).
export const openingHours = {
  closedDays: [1],
  opensAt: 9,
  closesAt: 20,
} as const;

export const weekSchedule = [
  { day: "Lunes", hours: null },
  { day: "Martes", hours: "9 a 20 hs" },
  { day: "Miércoles", hours: "9 a 20 hs" },
  { day: "Jueves", hours: "9 a 20 hs" },
  { day: "Viernes", hours: "9 a 20 hs" },
  { day: "Sábado", hours: "9 a 20 hs" },
  { day: "Domingo", hours: "9 a 20 hs" },
] as const;

export function whatsappLink(text: string) {
  return `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(text)}`;
}
