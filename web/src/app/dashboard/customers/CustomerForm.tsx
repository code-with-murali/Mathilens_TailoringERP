"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { PhoneNumberInput } from "@/components/ui/PhoneNumberInput";
import { DuplicateWarningModal } from "@/components/customers/DuplicateWarningModal";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { emailError, normalizePhoneNumber, phoneNumberError, toNationalDigits } from "@/lib/contact";
import {
  findCustomerDuplicates,
  GENDERS,
  RELIGIONS,
  type CustomerDuplicate,
  type CustomerInput,
  type Gender,
  type Religion,
} from "@/lib/api/customers";

type CustomerFormProps = {
  initialValues?: CustomerInput;
  submitLabel: string;
  onSubmit: (input: CustomerInput) => Promise<void>;
  /** The customer being edited, so the duplicate check doesn't report them against themselves. */
  customerId?: string;
};

/** Long enough that tabbing straight through phone and email asks once, not twice. */
const DUPLICATE_CHECK_DELAY_MS = 350;

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
export function CustomerForm({ initialValues = emptyValues, submitLabel, onSubmit, customerId }: CustomerFormProps) {
  const [fullName, setFullName] = useState(initialValues.fullName);
  // Shown as the ten digits the customer would recite. Saved records hold "+918220070363"; the
  // country code is the database's business, not something to make staff read past on every edit.
  const [phoneNumber, setPhoneNumber] = useState(toNationalDigits(initialValues.phoneNumber));
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
  const [duplicates, setDuplicates] = useState<CustomerDuplicate[]>([]);

  const duplicateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Contact details the operator has already been warned about and chosen to keep. Without this
  // the dialog reappears every time the cursor leaves the field, which trains people to dismiss
  // it without reading — the one habit a duplicate warning cannot afford.
  const acknowledged = useRef(new Set<string>());

  useEffect(() => () => {
    if (duplicateTimer.current) {
      clearTimeout(duplicateTimer.current);
    }
  }, []);

  /**
   * Asks the server who else holds this number or email, once the operator has left the field.
   *
   * Failures are swallowed on purpose: this is an advisory check running while a form is being
   * filled in, and an error toast about a background lookup would interrupt the typing it exists
   * to protect. The save itself still enforces the rule.
   */
  function scheduleDuplicateCheck(phone: string, address: string) {
    if (duplicateTimer.current) {
      clearTimeout(duplicateTimer.current);
    }

    duplicateTimer.current = setTimeout(async () => {
      // A half-typed number matches nothing, so there is no point asking until it is one.
      const normalized = normalizePhoneNumber(phone);
      const searchPhone = normalized ?? "";
      const searchEmail = emailError(address) === null ? address.trim() : "";
      if (searchPhone === "" && searchEmail === "") {
        return;
      }

      const key = `${searchPhone}|${searchEmail.toLowerCase()}`;
      if (acknowledged.current.has(key)) {
        return;
      }

      try {
        const matches = await findCustomerDuplicates(searchPhone, searchEmail, getAccessToken(), customerId);
        if (matches.length > 0) {
          acknowledged.current.add(key);
          setDuplicates(matches);
        }
      } catch {
        // See above — an advisory check stays quiet when it cannot run.
      }
    }, DUPLICATE_CHECK_DELAY_MS);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // Checked here as well as on the server so a mistyped number is caught under the cursor
    // rather than after a round trip. The server is still the authority.
    const clientErrors: Record<string, string> = {};
    const phoneProblem = phoneNumberError(phoneNumber);
    if (phoneProblem) {
      clientErrors.phonenumber = phoneProblem;
    }
    const emailProblem = emailError(email);
    if (emailProblem) {
      clientErrors.email = emailProblem;
    }
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

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
      <PhoneNumberInput
        id="phoneNumber"
        value={phoneNumber}
        onChange={setPhoneNumber}
        onBlur={() => scheduleDuplicateCheck(phoneNumber, email)}
        error={fieldErrors.phonenumber}
      />
      <Input
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => scheduleDuplicateCheck(phoneNumber, email)}
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

      {/* Outside the field flow: the warning is about the record as a whole, and it must not push
          the form around while someone is typing in it. */}
      <DuplicateWarningModal
        matches={duplicates}
        onCreateAnyway={() => setDuplicates([])}
        onClose={() => setDuplicates([])}
      />
    </form>
  );
}
