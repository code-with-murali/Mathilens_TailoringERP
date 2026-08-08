"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ApiError } from "@/lib/api-client";
import type { CustomerInput } from "@/lib/api/customers";

type CustomerFormProps = {
  initialValues?: CustomerInput;
  submitLabel: string;
  onSubmit: (input: CustomerInput) => Promise<void>;
};

const emptyValues: CustomerInput = { fullName: "", phoneNumber: "", email: null, address: null, notes: null };

/** Shared by the create and edit customer pages — preserves user input on validation failure (00_MASTER_SPEC.md § 9.5 Forms). */
export function CustomerForm({ initialValues = emptyValues, submitLabel, onSubmit }: CustomerFormProps) {
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [phoneNumber, setPhoneNumber] = useState(initialValues.phoneNumber);
  const [email, setEmail] = useState(initialValues.email ?? "");
  const [address, setAddress] = useState(initialValues.address ?? "");
  const [notes, setNotes] = useState(initialValues.notes ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await onSubmit({
        fullName,
        phoneNumber,
        email: email.trim() === "" ? null : email,
        address: address.trim() === "" ? null : address,
        notes: notes.trim() === "" ? null : notes,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details) {
          setFieldErrors(Object.fromEntries(error.details.map((d) => [d.field.toLowerCase(), d.message])));
        }
        setFormError(error.message);
      } else {
        setFormError("Unable to reach the server. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        id="fullName"
        label="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={fieldErrors.fullname}
      />
      <Input
        id="phoneNumber"
        label="Phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        error={fieldErrors.phonenumber}
      />
      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
      />
      <Textarea
        id="address"
        label="Address"
        rows={2}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        error={fieldErrors.address}
      />
      <Textarea
        id="notes"
        label="Notes"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        error={fieldErrors.notes}
      />

      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
