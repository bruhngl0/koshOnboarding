import { z } from 'zod';

export const personalStepSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  phone: z.string()
    .trim()
    .min(1, 'Phone is required')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\+?[0-9]{10,14}$/, 'Invalid phone number format (only numbers allowed, 10 to 14 digits)'),
  email: z.string().trim().email('Invalid email address').min(1, 'Email is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  age: z.coerce.number().optional().nullable(),
  gender: z.string().optional(),
});

export const bodyStepSchema = z.object({
  weight: z.coerce.number({ message: 'Weight is required' })
    .min(30, 'Weight must be at least 30 kg')
    .max(250, 'Weight must be at most 250 kg'),
  height: z.coerce.number({ message: 'Height is required' })
    .min(100, 'Height must be at least 100 cm')
    .max(250, 'Height must be at most 250 cm'),
  targetWeight: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().min(30, 'Target weight must be at least 30 kg').max(250, 'Target weight must be at most 250 kg').nullable().optional()
  ),
  goal: z.string().optional(),
  activity: z.string().optional(),
});

export const palateStepSchema = z.object({
  diet: z.string().min(1, 'Dietary preference is required'),
  spice: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  cuisines: z.array(z.string()).default([]),
  favDish: z.string().trim().max(300).optional(),
  dislikes: z.string().trim().max(300).optional(),
  medical: z.string().trim().max(500).optional(),
});

export const deliveryStepSchema = z.object({
  deliveryPlan: z.string().optional(),
  address: z.string().trim().min(1, 'Address is required').max(1000, 'Address is too long'),
  landmark: z.string().trim().max(300).optional(),
  deliveryNote: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(1000).optional(),
});

// Full schema that is used by the API endpoint for validating the complete payload
export const onboardingSchema = personalStepSchema
  .merge(bodyStepSchema)
  .merge(palateStepSchema)
  .merge(deliveryStepSchema);

export type OnboardingData = z.infer<typeof onboardingSchema>;
