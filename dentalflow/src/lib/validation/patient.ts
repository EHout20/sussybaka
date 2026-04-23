import { z } from "zod";

export const newPatientSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(120),
  last_name: z.string().min(1, "Last name is required").max(120),
  dob: z.string().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z
    .string()
    .email("Invalid email")
    .max(200)
    .optional()
    .or(z.literal("")),
  insurance_provider: z.string().max(200).optional().or(z.literal("")),
  policy_number: z.string().max(100).optional().or(z.literal("")),
  allergies: z.string().max(2000).optional().or(z.literal("")),
  medical_alerts: z.string().max(2000).optional().or(z.literal("")),
  emergency_contact: z.string().max(200).optional().or(z.literal("")),
  emergency_phone: z.string().max(40).optional().or(z.literal("")),
  consent_status: z.enum(["pending", "obtained", "declined"]),
});

export type NewPatientInput = z.infer<typeof newPatientSchema>;
