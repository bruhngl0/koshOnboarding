import { pgTable, uuid, text, numeric, integer, timestamp, date } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

export const onboardingSubmissions = pgTable('onboarding_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  ref: text('ref').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  dob: date('dob').notNull(),
  age: integer('age'),
  gender: text('gender'),
  weight: numeric('weight', { precision: 5, scale: 2 }).notNull(),
  height: numeric('height', { precision: 5, scale: 2 }).notNull(),
  targetWeight: numeric('target_weight', { precision: 5, scale: 2 }),
  bmi: numeric('bmi', { precision: 4, scale: 2 }),
  goal: text('goal'),
  activity: text('activity'),
  diet: text('diet').notNull(),
  spice: text('spice'),
  allergies: text('allergies').array(),
  cuisines: text('cuisines').array(),
  favDish: text('fav_dish'),
  dislikes: text('dislikes'),
  medical: text('medical'),
  deliveryPlan: text('delivery_plan'),
  address: text('address').notNull(),
  landmark: text('landmark'),
  deliveryNote: text('delivery_note'),
  notes: text('notes'),
  status: text('status').default('pending').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull()
});

export const onboardingInsertSchema = createInsertSchema(
  onboardingSubmissions,
  {
    ref: (schema) =>
      schema
        .trim()
        .min(6)
        .max(32)
        .regex(/^[A-Z0-9_-]+$/),

    name: (schema) =>
      schema
        .trim()
        .min(2)
        .max(150),

    phone: (schema) =>
      schema
        .trim()
        .regex(/^\+[1-9]\d{7,14}$/),

    email: (schema) =>
      schema
        .trim()
        .email()
        .min(5)
        .max(255),

    dob: z.iso.date(),

    weight: z.coerce
      .number()
      .min(20)
      .max(500),

    height: z.coerce
      .number()
      .min(50)
      .max(300),

    targetWeight: z.coerce
      .number()
      .min(20)
      .max(500),

    allergies: z
      .array(z.string().trim().min(1).max(100))
      .max(50)
      .default([]),

    cuisines: z
      .array(z.string().trim().min(1).max(100))
      .max(50)
      .default([]),

    address: (schema) =>
      schema
        .trim()
        .min(10)
        .max(1000),
  },
).omit({
  id: true,
  bmi: true,
  status: true,
  submittedAt: true,
});

export const emailQueue = pgTable('email_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  ref: text('ref').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'sent', 'failed'
  attempts: integer('attempts').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const jobQueue = pgTable('job_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobType: text('job_type').notNull(), // 'email', 'pdf', 'webhook', 'report'
  payload: text('payload').notNull(), // JSON string payload
  status: text('status').default('pending').notNull(), // 'pending', 'processing', 'completed', 'failed'
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(5).notNull(),
  lastAttemptAt: timestamp('last_attempt_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
