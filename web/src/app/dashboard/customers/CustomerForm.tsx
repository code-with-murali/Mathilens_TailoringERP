"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ApiError } from "@/lib/api-client";
import { GENDERS, RELIGIONS, type CustomerInput, type Gender, type Religion } from "@/lib/api/customers";

type CustomerFormProps = {
  initialValues?: CustomerInput;
  submitLabel: string;
  onSubmit: (input: CustomerInput) => Promise<void>;
};

const emptyValues: CustomerInput = {
  fullName: "",
  phoneNumber: "",
  email: null,
  address: null,
  notes: null,
  gender: null,
  religion: null,
  dateOfBirth: null,
  weddingDate: null,
};

const selectClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

/** Shared by the create and edit customer pages — preserves user input on validation failure (00_MASTER_SPEC.md § 9.5 Forms). */
export function CustomerForm({ initialValues = emptyValues, submitLabel, onSubmit }: CustomerFormProps) {
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [phoneNumber, setPhoneNumber] = useState(initialValues.phoneNumber);
  const [email, setEmail] = useState(initialValues.email ?? "");
  const [address, setAddress] = useState(initialValues.address ?? "");
  const [notes, setNotes] = useState(initialValues.notes ?? "");
  const [gender, setGender] = useState<Gender | "">(initialValues.gender ?? "");
  const [religion, setReligion] = useState<Religion | "">(initialValues.religion ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initialValues.dateOfBirth ?? "");
  const [weddingDate, setWeddingDate] = useState(initialValues.weddingDate ?? "");
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
        // Every one of these is optional — an unanswered field stays unanswered rather than
        // being defaulted to something the customer never told the shop.
        gender: gender === "" ? null : gender,
        religion: religion === "" ? null : religion,
        dateOfBirth: dateOfBirth === "" ? null : dateOfBirth,
        weddingDate: weddingDate === "" ? null : weddingDate,
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="gender" className="text-sm font-medium">
            Gender
          </label>
          <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as Gender | "")} className={selectClassName}>
            <option value="">Not specified</option>
            {GENDERS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="religion" className="text-sm font-medium">
            Religion
          </label>
          <select id="religion" value={religion} onChange={(e) => setReligion(e.target.value as Religion | "")} className={selectClassName}>
            <option value="">Not specified</option>
            {RELIGIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dateOfBirth" className="text-sm font-medium">
            Date of birth
          </label>
          <input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className={selectClassName}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="weddingDate" className="text-sm font-medium">
            Wedding date
          </label>
          <input
            id="weddingDate"
            type="date"
            value={weddingDate}
            onChange={(e) => setWeddingDate(e.target.value)}
            className={selectClassName}
          />
        </div>
      </div>

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
