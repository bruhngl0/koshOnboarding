import { db, ensureTableExists } from '@/db';
import { onboardingSubmissions } from '@/db/schema';
import { onboardingSchema } from '@/lib/validations';
import { apiResponse } from '@/lib/response';
import { withErrorHandler } from '@/lib/errorHandler';
import { invalidateSubmissionsCache } from '@/app/api/admin/submissions/route';

/**
 * @openapi
 * /api/onboarding:
 *   post:
 *     summary: Submit Onboarding Application
 *     description: Validates client inputs using Zod, creates reference codes, calculates BMI, and saves to database.
 *     requestBody:
 *       required: true;
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OnboardingInput'
 *     responses:
 *       200:
 *         description: Application created successfully.
 *       400:
 *         description: Input validation failed.
 *       500:
 *         description: Internal server error.
 */
export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  
  // Validate request payload using Zod schema
  const result = onboardingSchema.safeParse(body);
  if (!result.success) {
    return apiResponse({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: result.error.flatten().fieldErrors
      },
      status: 400
    });
  }
  
  const validatedData = result.data;
  
  // Ensure table exists (auto-migration/creation on-demand)
  await ensureTableExists();
  
  if (!db) {
    return apiResponse({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database connection not configured. Please set DATABASE_URL.'
      },
      status: 500
    });
  }
  
  // Generate a unique 5-character reference code, e.g. KSH-H8K3A
  const ref = 'KSH-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  
  // Calculate BMI on the server for consistency
  const w = validatedData.weight;
  const h = validatedData.height / 100;
  const bmi = w / (h * h);
  
  // Insert submission into database
  await db.insert(onboardingSubmissions).values({
    ref,
    name: validatedData.name,
    phone: validatedData.phone,
    email: validatedData.email,
    dob: validatedData.dob,
    age: validatedData.age,
    gender: validatedData.gender,
    weight: validatedData.weight.toString(),
    height: validatedData.height.toString(),
    targetWeight: validatedData.targetWeight ? validatedData.targetWeight.toString() : null,
    bmi: bmi.toFixed(2),
    goal: validatedData.goal,
    activity: validatedData.activity,
    diet: validatedData.diet,
    spice: validatedData.spice,
    allergies: validatedData.allergies,
    cuisines: validatedData.cuisines,
    favDish: validatedData.favDish,
    dislikes: validatedData.dislikes,
    medical: validatedData.medical,
    deliveryPlan: validatedData.deliveryPlan,
    address: validatedData.address,
    landmark: validatedData.landmark,
    deliveryNote: validatedData.deliveryNote,
    notes: validatedData.notes,
  });
  
  // Invalidate cache for admin dashboard list so new submission is visible
  invalidateSubmissionsCache();
  
  return apiResponse({
    success: true,
    data: {
      ref,
      message: 'Onboarding submission recorded successfully.'
    }
  });
});
