"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api-client";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  type EmployeeInput,
  type EmploymentType,
} from "@/lib/api/employees";

type EmployeeFormProps = {
  initialValues?: EmployeeInput;
  submitLabel: string;
  onSubmit: (input: EmployeeInput) => Promise<void>;
};

/** yyyy-MM-dd off the local calendar — a joining date is a day in the shop, not a UTC instant. */
function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const emptyValues: EmployeeInput = {
  employeeCode: "",
  fullName: "",
  jobTitle: null,
  phoneNumber: "",
  email: null,
  joiningDate: todayIsoDate(),
  employmentType: "FullTime",
};

/** Shared by the create and edit employee pages — preserves user input on validation failure (00_MASTER_SPEC.md § 9.5 Forms). */
export function EmployeeForm({ initialValues = emptyValues, submitLabel, onSubmit }: EmployeeFormProps) {
  const [employeeCode, setEmployeeCode] = useState(initialValues.employeeCode);
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [jobTitle, setJobTitle] = useState(initialValues.jobTitle ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialValues.phoneNumber ?? "");
  const [email, setEmail] = useState(initialValues.email ?? "");
  const [joiningDate, setJoiningDate] = useState(initialValues.joiningDate);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(initialValues.employmentType);
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
        employeeCode,
        fullName,
        jobTitle: jobTitle.trim() === "" ? null : jobTitle,
        // Mandatory, so it is sent as typed — blanking it is a validation error to report, not an
        // "unanswered" null to store.
        phoneNumber,
        email: email.trim() === "" ? null : email,
        joiningDate,
        employmentType,
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
        id="employeeCode"
        label="Employee code"
        placeholder="e.g. EMP-014"
        value={employeeCode}
        onChange={(e) => setEmployeeCode(e.target.value)}
        error={fieldErrors.employeecode}
      />
      <Input
        id="fullName"
        label="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={fieldErrors.fullname}
      />
      <Input
        id="jobTitle"
        label="Job title"
        placeholder="e.g. Master Tailor"
        value={jobTitle}
        onChange={(e) => setJobTitle(e.target.value)}
        error={fieldErrors.jobtitle}
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
          <label htmlFor="joiningDate" className="text-sm font-medium">
            Joining date
          </label>
          <input
            id="joiningDate"
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
          {fieldErrors.joiningdate && <p className="text-sm text-danger">{fieldErrors.joiningdate}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="employmentType" className="text-sm font-medium">
            Employment type
          </label>
          <select
            id="employmentType"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {EMPLOYMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

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
