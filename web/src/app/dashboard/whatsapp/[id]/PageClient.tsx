"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getWhatsAppMessage, type WhatsAppMessage } from "@/lib/api/whatsapp";

export default function WhatsAppMessageDetailPage() {
  const params = useParams<{ id: string }>();
  const [message, setMessage] = useState<WhatsAppMessage | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getWhatsAppMessage(params.id, getAccessToken())
      .then((data) => {
        if (!cancelled) {
          setMessage(data);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setLoadError(error instanceof ApiError ? error.message : "Unable to load this message.");
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Message</h1>
        <Link href="/dashboard/whatsapp" className="text-sm text-foreground/70 hover:text-foreground">
          Back to messages
        </Link>
      </div>

      {loadError ? (
        <p role="alert" className="text-sm text-red-600">
          {loadError}
        </p>
      ) : !message ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : (
        <div className="max-w-xl rounded-lg border border-border bg-surface p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-foreground/70">Type</dt>
              <dd className="font-medium">{message.messageType}</dd>
            </div>
            <div>
              <dt className="text-foreground/70">Status</dt>
              <dd className="font-medium">{message.status}</dd>
            </div>
            <div>
              <dt className="text-foreground/70">Sent</dt>
              <dd className="font-medium">{new Date(message.createdAtUtc).toLocaleString()}</dd>
            </div>
            {message.failureReason && (
              <div className="col-span-2">
                <dt className="text-foreground/70">Failure reason</dt>
                <dd className="font-medium text-red-600">{message.failureReason}</dd>
              </div>
            )}
            <div className="col-span-2">
              <dt className="text-foreground/70">Content</dt>
              <dd className="whitespace-pre-wrap font-medium">{message.content}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
