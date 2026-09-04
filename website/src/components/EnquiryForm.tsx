"use client";

import { useId, useState } from "react";
import { brand, contact, enquiryEndpoint, whatsappLink } from "@/content/site";
import { track } from "@/lib/analytics";

/**
 * The enquiry form.
 *
 * The site is a static export, so there is no server of ours to post to. Rather than pretend
 * otherwise, the form degrades through three delivery routes in order of preference:
 *
 *   1. NEXT_PUBLIC_ENQUIRY_ENDPOINT — a real POST, if one has been configured.
 *   2. WhatsApp — the enquiry is composed into a message and handed to wa.me.
 *   3. Email — the same text handed to the mail client.
 *
 * If none of the three is configured the submit button is disabled and says so, rather than
 * swallowing an enquiry into nothing. That is the failure mode worth engineering against: a form
 * that appears to work and silently discards a customer is worse than no form.
 */

type Status = "idle" | "sending" | "sent" | "error";

const GARMENTS = [
  "Suit",
  "Blazer",
  "Shirts",
  "Trousers",
  "Wedding / groom wear",
  "Bulk or uniform order",
  "Something else",
];

export function EnquiryForm({
  kind = "general",
  heading,
  tone = "light",
}: {
  /** A bulk enquiry asks two extra questions and reports a different analytics event. */
  kind?: "general" | "bulk";
  heading?: string;
  tone?: "light" | "dark";
}) {
  const fieldId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const bulk = kind === "bulk";
  const wa = whatsappLink();
  const canSend = Boolean(enquiryEndpoint || wa || contact.email);

  const dark = tone === "dark";
  const labelClass = `u-eyebrow mb-2 block ${dark ? "text-gold-soft" : "text-gold-deep"}`;
  const fieldClass = [
    "w-full border bg-transparent px-4 py-3.5 text-base transition-colors",
    dark
      ? "border-ink-line text-cream placeholder:text-ink-muted focus:border-gold"
      : "border-hair-strong text-ink placeholder:text-muted/70 focus:border-ink",
    "focus:outline-none",
  ].join(" ");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    // A hidden field no human fills in. Anything that arrives with it filled is a bot, and is
    // dropped silently — telling a spam script it failed only teaches it to try again.
    if (data.company_website) {
      setStatus("sent");
      return;
    }

    setStatus("sending");
    setMessage(null);

    const lines = [
      `Enquiry — ${bulk ? "Bulk / uniform order" : "Custom tailoring"}`,
      `Name: ${data.name}`,
      data.organisation ? `Organisation: ${data.organisation}` : null,
      `Phone: ${data.phone}`,
      data.email ? `Email: ${data.email}` : null,
      data.town ? `Town: ${data.town}` : null,
      data.garment ? `Interested in: ${data.garment}` : null,
      data.quantity ? `Approximate quantity: ${data.quantity}` : null,
      data.timeline ? `Needed by: ${data.timeline}` : null,
      "",
      data.details ?? "",
    ].filter((line) => line !== null);

    const text = lines.join("\n");

    try {
      if (enquiryEndpoint) {
        const response = await fetch(enquiryEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, ...data, text, source: brand.name }),
        });
        if (!response.ok) throw new Error(`Enquiry endpoint responded ${response.status}`);
        setStatus("sent");
        track(bulk ? "bulk_enquiry_submit" : "enquiry_submit", { method: "endpoint" });
        form.reset();
        return;
      }

      const waLink = whatsappLink(text);
      if (waLink) {
        track(bulk ? "bulk_enquiry_submit" : "enquiry_submit", { method: "whatsapp" });
        window.open(waLink, "_blank", "noopener,noreferrer");
        setStatus("sent");
        setMessage("Your enquiry is ready in WhatsApp — send it there and we will reply.");
        return;
      }

      if (contact.email) {
        track(bulk ? "bulk_enquiry_submit" : "enquiry_submit", { method: "email" });
        window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(
          `${bulk ? "Bulk enquiry" : "Tailoring enquiry"} — ${data.name}`,
        )}&body=${encodeURIComponent(text)}`;
        setStatus("sent");
        setMessage("Your enquiry is ready in your email app — send it there and we will reply.");
        return;
      }

      throw new Error("No delivery route configured");
    } catch {
      setStatus("error");
      track("enquiry_error", { kind });
      setMessage("We could not send that just now. Please try again, or visit the shop in Mannargudi.");
    }
  }

  if (status === "sent" && !message) {
    return (
      <div className={`border p-8 ${dark ? "border-ink-line text-cream" : "border-hair-strong text-ink"}`}>
        <p className="u-eyebrow mb-4 text-gold-deep">Received</p>
        <p className="font-display text-2xl">Thank you — we have your enquiry.</p>
        <p className={`mt-4 ${dark ? "text-ink-muted" : "text-muted"}`}>
          We will come back to you. If it is urgent, the shop in {brand.city} is the fastest way to
          reach us.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate={false}>
      {heading ? (
        <h2 className={`font-display text-title ${dark ? "text-cream" : "text-ink"}`}>{heading}</h2>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${fieldId}-name`} className={labelClass}>
            Your name
          </label>
          <input
            id={`${fieldId}-name`}
            name="name"
            type="text"
            required
            autoComplete="name"
            className={fieldClass}
            onFocus={() => status === "idle" && track("enquiry_start", { kind })}
          />
        </div>

        <div>
          <label htmlFor={`${fieldId}-phone`} className={labelClass}>
            Phone
          </label>
          <input
            id={`${fieldId}-phone`}
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            className={fieldClass}
          />
        </div>

        {bulk ? (
          <div className="sm:col-span-2">
            <label htmlFor={`${fieldId}-organisation`} className={labelClass}>
              Organisation
            </label>
            <input
              id={`${fieldId}-organisation`}
              name="organisation"
              type="text"
              required
              autoComplete="organization"
              className={fieldClass}
            />
          </div>
        ) : null}

        <div>
          <label htmlFor={`${fieldId}-email`} className={labelClass}>
            {/* Not opacity: knocking 40% off gold-deep drops it under 4.5:1, and "optional" is
                exactly the word a reader must not have to squint at. A quieter colour instead. */}
            Email{" "}
            <span className={`normal-case tracking-normal ${dark ? "text-ink-muted" : "text-muted"}`}>
              (optional)
            </span>
          </label>
          <input
            id={`${fieldId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor={`${fieldId}-town`} className={labelClass}>
            Town or city
          </label>
          <input id={`${fieldId}-town`} name="town" type="text" className={fieldClass} />
        </div>

        {bulk ? (
          <>
            <div>
              <label htmlFor={`${fieldId}-quantity`} className={labelClass}>
                Approximate quantity
              </label>
              <input
                id={`${fieldId}-quantity`}
                name="quantity"
                type="text"
                placeholder="e.g. 60 shirts and trousers"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor={`${fieldId}-timeline`} className={labelClass}>
                Needed by
              </label>
              <input
                id={`${fieldId}-timeline`}
                name="timeline"
                type="text"
                placeholder="e.g. before the new academic year"
                className={fieldClass}
              />
            </div>
          </>
        ) : (
          <div className="sm:col-span-2">
            <label htmlFor={`${fieldId}-garment`} className={labelClass}>
              What are you interested in?
            </label>
            <select id={`${fieldId}-garment`} name="garment" className={fieldClass} defaultValue="">
              <option value="" disabled>
                Choose one
              </option>
              {GARMENTS.map((garment) => (
                <option key={garment} value={garment} className="text-ink">
                  {garment}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`${fieldId}-details`} className={labelClass}>
          {bulk ? "Tell us about the requirement" : "Anything else we should know"}
        </label>
        <textarea
          id={`${fieldId}-details`}
          name="details"
          rows={5}
          className={fieldClass}
          placeholder={
            bulk
              ? "Who wears it, what their working day involves, how it is laundered, and any deadline."
              : "The occasion, when you need it, and anything you already have in mind."
          }
        />
      </div>

      {/* Honeypot — visually and semantically hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
        <label htmlFor={`${fieldId}-company-website`}>Company website</label>
        <input id={`${fieldId}-company-website`} name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={!canSend || status === "sending"}
          className={[
            "u-eyebrow px-8 py-4 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            dark ? "bg-gold text-ink hover:bg-gold-soft" : "bg-ink text-cream hover:bg-ink-soft",
          ].join(" ")}
        >
          {status === "sending" ? "Sending…" : bulk ? "Send bulk enquiry" : "Send enquiry"}
        </button>

        {!canSend ? (
          <p className={`text-sm ${dark ? "text-ink-muted" : "text-muted"}`}>
            Enquiries are not yet connected. Visit the shop in {brand.city} in the meantime.
          </p>
        ) : null}
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`min-h-6 text-sm ${
          status === "error" ? "text-gold-deep" : dark ? "text-ink-muted" : "text-muted"
        }`}
      >
        {message}
      </p>
    </form>
  );
}
