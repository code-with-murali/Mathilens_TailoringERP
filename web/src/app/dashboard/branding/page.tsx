"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getBranding, saveBranding, EMPTY_BRANDING, type Branding } from "@/lib/api/branding";

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export default function BrandingPage() {
  const { showToast } = useToast();
  const [branding, setBranding] = useState<Branding>(EMPTY_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBranding(await getBranding(getAccessToken()).catch(() => EMPTY_BRANDING));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function set<K extends keyof Branding>(field: K, value: Branding[K]) {
    setBranding((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const color = branding.primaryColor.trim();
    if (color !== "" && !HEX_COLOR.test(color)) {
      setFormError("Theme colour must be a hex value like #4f46e5.");
      return;
    }

    setIsSaving(true);
    try {
      await saveBranding(branding, getAccessToken());
      showToast("Branding saved. Reload to see it everywhere.");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to save branding.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-foreground/70">Loading…</p>;
  }

  const previewColor = HEX_COLOR.test(branding.primaryColor.trim()) ? branding.primaryColor.trim() : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Branding</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Your shop&apos;s name, logo and colour. These appear in the sidebar and on printed invoices.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface p-6">
        <Input id="shopName" label="Shop name" value={branding.shopName} onChange={(e) => set("shopName", e.target.value)} />
        <Input
          id="contactNumber"
          label="Contact number"
          value={branding.contactNumber}
          onChange={(e) => set("contactNumber", e.target.value)}
        />
        <Input id="address" label="Address" value={branding.address} onChange={(e) => set("address", e.target.value)} />

        <div className="flex flex-col gap-1">
          <label htmlFor="logoUrl" className="text-sm font-medium">
            Logo URL
          </label>
          <input
            id="logoUrl"
            value={branding.logoUrl}
            onChange={(e) => set("logoUrl", e.target.value)}
            placeholder="https://…/logo.png"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
          <p className="text-xs text-foreground/60">
            A link to your logo image. Uploading a file isn&apos;t supported yet — the settings store holds text, not images.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="primaryColor" className="text-sm font-medium">
            Theme colour
          </label>
          <div className="flex items-center gap-3">
            <input
              id="primaryColor"
              value={branding.primaryColor}
              onChange={(e) => set("primaryColor", e.target.value)}
              placeholder="#4f46e5"
              className="w-40 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            <input
              type="color"
              aria-label="Pick theme colour"
              value={previewColor ?? "#4f46e5"}
              onChange={(e) => set("primaryColor", e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-md border border-border bg-surface"
            />
            {previewColor && (
              <span className="rounded-md px-3 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: previewColor }}>
                Preview
              </span>
            )}
          </div>
        </div>

        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save branding"}
          </Button>
        </div>
      </form>
    </div>
  );
}
