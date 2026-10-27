import Link from "next/link";
import { InstagramIcon, PhoneIcon, PinIcon, WhatsappIcon } from "@/components/icons";
import { business, weekSchedule, whatsappLink } from "@/lib/business";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-semibold">{business.name}</p>
          <p className="mt-2 max-w-xs text-sm text-cream/70">{business.tagline}.</p>
          <div className="mt-5 flex gap-2">
            <a
              href={business.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="grid size-10 place-items-center rounded-full bg-cream/10 transition-colors hover:bg-brand"
            >
              <InstagramIcon />
            </a>
            <a
              href={whatsappLink("¡Hola Sasha! Tengo una consulta.")}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="grid size-10 place-items-center rounded-full bg-cream/10 transition-colors hover:bg-brand"
            >
              <WhatsappIcon />
            </a>
          </div>
        </div>

        <div className="text-sm">
          <h2 className="font-semibold">Horarios</h2>
          <ul className="mt-3 space-y-1 text-cream/80">
            {weekSchedule.map((d) => (
              <li key={d.day} className="flex justify-between gap-6 tabular-nums">
                <span>{d.day}</span>
                <span>{d.hours ?? "Cerrado"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 text-sm">
          <h2 className="font-semibold">Visitanos</h2>
          <a href={business.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-cream/80 hover:text-cream">
            <PinIcon /> {business.address}
          </a>
          <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-cream/80 hover:text-cream">
            <PhoneIcon /> {business.phoneLabel}
          </a>
          <a href={`mailto:${business.email}`} className="block break-all text-cream/80 hover:text-cream">
            {business.email}
          </a>
        </div>
      </div>
      <p className="border-t border-cream/10 px-4 py-5 text-center text-xs text-cream/50">
        © {business.name} ·{" "}
        <Link href="/creditos" className="underline-offset-2 hover:underline">
          Créditos de fotos
        </Link>
      </p>
    </footer>
  );
}
