/**
 * How a WhatsApp message reaches a customer.
 *
 * Today there is one provider and it is a person: the shop opens WhatsApp with the message already
 * typed and presses Send themselves. That is a deliberate choice, not a stopgap for a missing
 * integration — nothing is dispatched on the shop's behalf, and nothing claims it was.
 *
 * The interface exists so that when a Business API provider is added (AiSensy, or Meta's own —
 * `MetaWhatsAppSender` already exists on the server for the latter), it slots in beside this one
 * rather than through it. Note what the shape forbids: a provider is handed a finished message and
 * a finished number. It does not compose text, it does not know what an invoice is, and it cannot
 * reach the order. So the day delivery changes, `buildInvoiceMessage` below does not.
 */
export type WhatsAppDelivery = {
  /** What to call this provider where a person has to choose or read one. */
  readonly name: string;

  /**
   * Whether the shop finishes the job by hand.
   *
   * Read by the UI, which must not promise more than the provider does: a manual provider gets a
   * button that says it opens WhatsApp, and no "sent" state anywhere afterwards.
   */
  readonly isManual: boolean;

  /**
   * Hand the message over.
   *
   * Resolves once the message has been *handed to* the provider — for the manual one, that is the
   * moment WhatsApp opens, which is emphatically not the moment anything is delivered. A provider
   * that genuinely sends may resolve on the API's acknowledgement; neither is a delivery receipt,
   * and no caller should treat it as one.
   */
  deliver(phoneNumber: string, message: string): Promise<void>;
};

/** Thrown when the browser refuses to open the tab — almost always a pop-up blocker. */
export class WhatsAppOpenError extends Error {
  constructor() {
    super("Unable to open WhatsApp. Please allow pop-ups for this site and try again.");
    this.name = "WhatsAppOpenError";
  }
}

/**
 * The Click-to-Chat provider: build a wa.me link, open it in a new tab, let the shop press Send.
 *
 * No API key, no account, no approval, and no dependency — wa.me is a plain URL that hands off to
 * whichever WhatsApp the machine already has, desktop app or web.
 */
export const manualWhatsAppProvider: WhatsAppDelivery = {
  name: "Manual WhatsApp",
  isManual: true,

  async deliver(phoneNumber: string, message: string): Promise<void> {
    const url = buildClickToChatUrl(phoneNumber, message);

    // noopener,noreferrer: without them the opened tab gets a handle on this one through
    // window.opener and could navigate the ERP somewhere else. _blank keeps the shop's page where
    // it is, which the whole flow depends on — staff go back to it after pressing Send.
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      throw new WhatsAppOpenError();
    }
  },
};

/**
 * `https://wa.me/<digits>?text=<encoded>`.
 *
 * The message goes through encodeURIComponent, which is what makes an order note containing &, #,
 * + or a line of Tamil arrive as itself rather than truncating the message at the first ampersand.
 * Exported so it can be shown and checked without opening anything.
 */
export function buildClickToChatUrl(phoneNumber: string, message: string): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
