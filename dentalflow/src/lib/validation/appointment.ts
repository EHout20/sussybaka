import { z } from "zod";

export const appointmentCreateSchema = z
  .object({
    patient_id: z.string().uuid("Patient is required"),
    provider_id: z.string().uuid("Provider is required"),
    room: z.string().max(40).optional().or(z.literal("")),
    appointment_type: z.string().min(1).max(80),
    start_time: z.string().min(1),
    end_time: z.string().min(1),
    status: z.enum([
      "scheduled",
      "checked_in",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ]),
    notes_patient: z.string().max(2000).optional().or(z.literal("")),
    notes_staff: z.string().max(2000).optional().or(z.literal("")),
    is_waitlist: z.coerce.boolean().optional(),
  })
  .refine(
    (d) => new Date(d.end_time) > new Date(d.start_time),
    "End time must be after start time"
  );

export const clinicalNoteSchema = z.object({
  patient_id: z.string().uuid(),
  content: z.string().min(1, "Note is required").max(10000),
  is_internal: z.coerce.boolean(),
});

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  patient_id: z.string().uuid().optional(),
  due_date: z.string().min(1),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  assigned_to: z.string().uuid("Assignee is required"),
});

export const treatmentItemSchema = z.object({
  treatment_plan_id: z.string().uuid(),
  tooth_number: z.string().max(3).optional().or(z.literal("")),
  procedure_code: z.string().max(40).optional().or(z.literal("")),
  description: z.string().min(1).max(2000),
  status: z.enum([
    "planned",
    "approved",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  estimate_usd: z.string().min(1),
  patient_visible: z.coerce.boolean(),
});
