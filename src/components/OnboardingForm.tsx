'use client';

import React, { useState } from 'react';
import { 
  personalStepSchema, 
  bodyStepSchema, 
  palateStepSchema, 
  deliveryStepSchema, 
  OnboardingData 
} from '@/lib/validations';

const INITIAL_STATE = {
  name: '',
  phone: '',
  email: '',
  dob: '',
  age: '' as number | '',
  gender: '',
  weight: '' as number | '',
  height: '' as number | '',
  targetWeight: '' as number | '',
  goal: '',
  activity: '',
  diet: '',
  spice: '',
  allergies: [] as string[],
  cuisines: [] as string[],
  favDish: '',
  dislikes: '',
  medical: '',
  deliveryPlan: '',
  address: '',
  landmark: '',
  deliveryNote: '',
  notes: '',
};

export default function OnboardingForm() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allergyInput, setAllergyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedRef, setSubmittedRef] = useState('');

  const TOTAL_STEPS = 5;

  // Calculators
  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const today = new Date();
    const birth = new Date(dobString);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age > 0 ? age : '';
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    const age = calculateAge(dob);
    setFormData(prev => ({ ...prev, dob, age }));
    if (errors.dob) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.dob;
        return copy;
      });
    }
  };

  const bmiDetails = (() => {
    const w = Number(formData.weight);
    const h = Number(formData.height) / 100;
    if (!w || !h || h <= 0) return null;
    const bmi = w / (h * h);
    
    let label = 'Normal', color = 'var(--gr)', pct = 0;
    if (bmi < 18.5) {
      label = 'Underweight';
      color = '#6BA3D6';
      pct = Math.max(2, (bmi / 18.5) * 20);
    } else if (bmi < 25) {
      label = 'Normal';
      color = 'var(--gr)';
      pct = 20 + ((bmi - 18.5) / 6.5) * 30;
    } else if (bmi < 30) {
      label = 'Overweight';
      color = 'var(--copper-lt)';
      pct = 50 + ((bmi - 25) / 5) * 20;
    } else {
      label = 'Obese';
      color = 'var(--re)';
      pct = Math.min(96, 70 + ((bmi - 30) / 10) * 26);
    }
    return { bmi: bmi.toFixed(1), label, color, pct };
  })();

  // Validation
  const validateStep = (step: number): boolean => {
    const stepSchemas = [
      personalStepSchema,
      bodyStepSchema,
      palateStepSchema,
      deliveryStepSchema
    ];

    if (step >= stepSchemas.length) return true;

    const schema = stepSchemas[step];
    const result = schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      
      // Smooth scroll to the first invalid field container
      setTimeout(() => {
        const invalidElement = document.querySelector('.field.invalid input, .field.invalid textarea, .stat-card.invalid input');
        if (invalidElement) {
          invalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return false;
    }

    setErrors({});
    return true;
  };

  // Navigation
  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    goToStep(currentStep + 1);
  };

  const prevStep = () => {
    goToStep(currentStep - 1);
  };

  const goToStep = (step: number) => {
    if (step < 0 || step >= TOTAL_STEPS) return;
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Input Handlers
  const handleTextChange = (key: keyof typeof INITIAL_STATE) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const selectSinglePill = (key: keyof typeof INITIAL_STATE, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const toggleMultiCuisine = (cuisineName: string) => {
    setFormData(prev => {
      const cuisines = prev.cuisines.includes(cuisineName)
        ? prev.cuisines.filter(c => c !== cuisineName)
        : [...prev.cuisines, cuisineName];
      return { ...prev, cuisines };
    });
  };

  // Allergy tags helpers
  const handleAllergyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = allergyInput.trim().replace(/,/g, '');
      if (val && !formData.allergies.includes(val)) {
        setFormData(prev => ({ ...prev, allergies: [...prev.allergies, val] }));
      }
      setAllergyInput('');
    } else if (e.key === 'Backspace' && !allergyInput && formData.allergies.length > 0) {
      setFormData(prev => ({ ...prev, allergies: prev.allergies.slice(0, -1) }));
    }
  };

  const removeAllergyTag = (val: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== val)
    }));
  };

  // Form Submission
  const submitForm = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Submission failed. Please check your data.');
      }

      setSubmittedRef(data.ref);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_STATE);
    setCurrentStep(0);
    setErrors({});
    setAllergyInput('');
    setSubmittedRef('');
    setSubmitError('');
  };

  // Success view
  if (submittedRef) {
    return (
      <div className="success-screen">
        <div className="success-mark">✦</div>
        <h2>Thank You</h2>
        <p>You have been successfully added to our waitlist. We will get back to you soon.</p>
        <div className="success-ref" style={{ marginTop: '16px', fontSize: '14px', letterSpacing: '0.1em', opacity: 0.8 }}>
          Reference Code: <strong>{submittedRef}</strong>
        </div>
        <br />
        <button type="button" className="btn-new" onClick={resetForm}>Submit another</button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Rail */}
      <div className="progress-rail">
        {[
          { label: 'You', index: 0 },
          { label: 'Body', index: 1 },
          { label: 'Palate', index: 2 },
          { label: 'Delivery', index: 3 },
          { label: 'Review', index: 4 }
        ].map((step) => (
          <React.Fragment key={step.index}>
            <button
              type="button"
              className={`prog-step ${currentStep > step.index ? 'done' : ''} ${currentStep === step.index ? 'active' : ''}`}
              onClick={() => {
                // Only allow navigating backwards or forwards if valid
                if (step.index < currentStep) {
                  goToStep(step.index);
                } else if (step.index > currentStep) {
                  // Validate current step before allowing to jump forward
                  if (validateStep(currentStep)) {
                    goToStep(step.index);
                  }
                }
              }}
            >
              <div className="prog-dot">
                <span>{step.index + 1}</span>
              </div>
              <span className="prog-label">{step.label}</span>
            </button>
            {step.index < 4 && (
              <div className={`prog-line ${currentStep > step.index ? 'done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ═══ STEP 0: Personal ═══ */}
      <div className={`form-step ${currentStep === 0 ? 'active' : ''}`}>
        <h2 className="step-title">Personal <em>details</em></h2>
        <p className="step-subtitle">The basics — who you are and how to reach you.</p>

        <div className="field-row">
          <div className={`field ${errors.name ? 'invalid' : ''}`}>
            <label htmlFor="name">Full Name <span className="req">*</span></label>
            <input 
              type="text" 
              id="name" 
              placeholder="Your full name"
              value={formData.name}
              onChange={handleTextChange('name')}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className={`field ${errors.email ? 'invalid' : ''}`}>
            <label htmlFor="email">Email Address <span className="req">*</span></label>
            <input 
              type="email" 
              id="email" 
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleTextChange('email')}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
        </div>

        <div className="field-row">
          <div className={`field ${errors.phone ? 'invalid' : ''}`}>
            <label htmlFor="phone">Phone Number <span className="req">*</span></label>
            <input 
              type="tel" 
              id="phone" 
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleTextChange('phone')}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
          <div className={`field ${errors.dob ? 'invalid' : ''}`}>
            <label htmlFor="dob">Date of Birth <span className="req">*</span></label>
            <input 
              type="date" 
              id="dob" 
              value={formData.dob}
              onChange={handleDobChange}
            />
            {errors.dob && <span className="field-error">{errors.dob}</span>}
          </div>
        </div>

        <div className="field-row">
          <div className="field" style={{ maxWidth: '50%' }}>
            <label htmlFor="age">Age</label>
            <input 
              type="number" 
              id="age" 
              placeholder="Auto-calculated" 
              value={formData.age}
              readOnly 
              style={{ background: 'var(--parchment)', cursor: 'default' }}
            />
          </div>
        </div>

        <div className="field-row full">
          <div className="field">
            <label>Gender</label>
            <div className="pill-group">
              {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`pill ${formData.gender === g ? 'selected' : ''}`}
                  onClick={() => selectSinglePill('gender', g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-nav">
          <button type="button" className="btn-back" disabled>← Back</button>
          <span className="step-counter">Step 1 of 5</span>
          <button type="button" className="btn-next" onClick={nextStep}>Continue →</button>
        </div>
      </div>

      {/* ═══ STEP 1: Body & Goals ═══ */}
      <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
        <h2 className="step-title">Body &amp; <em>Goals</em></h2>
        <p className="step-subtitle">Help us understand where you are and where you want to go.</p>

        <div className="stat-cards">
          <div className={`stat-card ${errors.weight ? 'invalid' : ''}`}>
            <label htmlFor="weight">Current Weight <span className="req">*</span></label>
            <div className="input-unit">
              <input 
                type="number" 
                id="weight" 
                placeholder="70" 
                min="30" 
                max="250"
                value={formData.weight}
                onChange={handleTextChange('weight')}
              />
              <span className="unit">kg</span>
            </div>
            {errors.weight && <span className="field-error">{errors.weight}</span>}
          </div>
          <div className={`stat-card ${errors.height ? 'invalid' : ''}`}>
            <label htmlFor="height">Height <span className="req">*</span></label>
            <div className="input-unit">
              <input 
                type="number" 
                id="height" 
                placeholder="170" 
                min="100" 
                max="250"
                value={formData.height}
                onChange={handleTextChange('height')}
              />
              <span className="unit">cm</span>
            </div>
            {errors.height && <span className="field-error">{errors.height}</span>}
          </div>
          <div className={`stat-card ${errors.targetWeight ? 'invalid' : ''}`}>
            <label htmlFor="targetWeight">Target Weight</label>
            <div className="input-unit">
              <input 
                type="number" 
                id="targetWeight" 
                placeholder="65" 
                min="30" 
                max="250"
                value={formData.targetWeight}
                onChange={handleTextChange('targetWeight')}
              />
              <span className="unit">kg</span>
            </div>
            {errors.targetWeight && <span className="field-error">{errors.targetWeight}</span>}
          </div>
        </div>

        {/* BMI Display */}
        {bmiDetails && (
          <div className="bmi-display visible">
            <div>
              <div className="bmi-num">{bmiDetails.bmi}</div>
              <div className="bmi-label" style={{ color: bmiDetails.color }}>{bmiDetails.label}</div>
            </div>
            <div className="bmi-bar-wrap">
              <div className="bmi-bar">
                <div className="bmi-marker" style={{ left: `${bmiDetails.pct}%` }} />
              </div>
              <div className="bmi-scale">
                <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
              </div>
            </div>
          </div>
        )}

        <div className="field-section-label">Primary Goal</div>
        <div className="goal-grid">
          {[
            { icon: '⬇️', name: 'Lose Weight', desc: 'Caloric deficit, lean protein focus' },
            { icon: '⬆️', name: 'Gain Weight', desc: 'Caloric surplus, nutrient-dense meals' },
            { icon: '⚖️', name: 'Maintain', desc: 'Balanced macros, sustained energy' },
            { icon: '💪', name: 'Build Muscle', desc: 'High protein, strength-oriented' },
            { icon: '🏃', name: 'Athletic Performance', desc: 'Carb timing, recovery nutrition' },
            { icon: '🌿', name: 'Gut Health', desc: 'Anti-inflammatory, whole foods' }
          ].map((goal) => (
            <button
              key={goal.name}
              type="button"
              className={`goal-card ${formData.goal === goal.name ? 'selected' : ''}`}
              onClick={() => selectSinglePill('goal', goal.name)}
            >
              <span className="goal-icon">{goal.icon}</span>
              <div className="goal-name">{goal.name}</div>
              <div className="goal-desc">{goal.desc}</div>
            </button>
          ))}
        </div>

        <div className="field-section-label" style={{ marginTop: '24px' }}>Activity Level</div>
        <div className="scale-wrap">
          {[
            { icon: '🛋️', label: 'Sedentary' },
            { icon: '🚶', label: 'Light' },
            { icon: '🏃', label: 'Moderate' },
            { icon: '🏋️', label: 'Active' },
            { icon: '🔥', label: 'Athlete' }
          ].map((act) => (
            <button
              key={act.label}
              type="button"
              className={`scale-btn ${formData.activity === act.label ? 'selected' : ''}`}
              onClick={() => selectSinglePill('activity', act.label)}
            >
              <span className="scale-icon">{act.icon}</span>
              <span className="scale-label">{act.label}</span>
            </button>
          ))}
        </div>

        <div className="form-nav">
          <button type="button" className="btn-back" onClick={prevStep}>← Back</button>
          <span className="step-counter">Step 2 of 5</span>
          <button type="button" className="btn-next" onClick={nextStep}>Continue →</button>
        </div>
      </div>

      {/* ═══ STEP 2: Palate ═══ */}
      <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
        <h2 className="step-title">Your <em>Palate</em></h2>
        <p className="step-subtitle">Preferences, allergies, and the flavours that move you.</p>

        <div className="field-row full">
          <div className={`field ${errors.diet ? 'invalid' : ''}`}>
            <label>Dietary Preference <span className="req">*</span></label>
            <div className="pill-group">
              {['Omnivore', 'Vegetarian', 'Eggetarian', 'Vegan', 'Pescatarian', 'Jain', 'No Pork', 'No Beef'].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`pill ${formData.diet === d ? 'selected' : ''}`}
                  onClick={() => selectSinglePill('diet', d)}
                >
                  {d}
                </button>
              ))}
            </div>
            {errors.diet && <span className="field-error">{errors.diet}</span>}
          </div>
        </div>

        <div className="field-section-label">Spice Tolerance</div>
        <div className="scale-wrap">
          {[
            { icon: '🫙', label: 'None' },
            { icon: '🌿', label: 'Mild' },
            { icon: '🌶', label: 'Medium' },
            { icon: '🌶🌶', label: 'Hot' },
            { icon: '🔥', label: 'Very Hot' }
          ].map((sp) => (
            <button
              key={sp.label}
              type="button"
              className={`scale-btn ${formData.spice === sp.label ? 'selected' : ''}`}
              onClick={() => selectSinglePill('spice', sp.label)}
            >
              <span className="scale-icon">{sp.icon}</span>
              <span className="scale-label">{sp.label}</span>
            </button>
          ))}
        </div>

        <div className="field-section-label">Allergies &amp; Intolerances</div>
        <div className="field full">
          <label htmlFor="allergy-input">Type and press Enter or comma to add</label>
          <div className="tag-input-wrap" onClick={() => document.getElementById('allergy-input')?.focus()}>
            {formData.allergies.map((allergy) => (
              <div key={allergy} className="tag-item">
                {allergy}
                <button 
                  type="button" 
                  className="tag-remove" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAllergyTag(allergy);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <input 
              type="text"
              className="tag-real-input" 
              id="allergy-input" 
              placeholder={formData.allergies.length === 0 ? 'e.g. Gluten, Dairy, Shellfish…' : ''}
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={handleAllergyKeyDown}
            />
          </div>
        </div>

        <div className="field-section-label">Preferred Cuisines</div>
        <div className="cuisine-grid">
          {[
            { flag: '🇮🇳', name: 'Indian' },
            { flag: '🇯🇵', name: 'Japanese' },
            { flag: '🇮🇹', name: 'Italian' },
            { flag: '🇲🇽', name: 'Mexican' },
            { flag: '🇹🇭', name: 'Thai' },
            { flag: '🇱🇧', name: 'Lebanese' },
            { flag: '🇨🇳', name: 'Chinese' },
            { flag: '🇫🇷', name: 'French' },
            { flag: '🌍', name: 'Mediterranean' },
            { flag: '🇰🇷', name: 'Korean' },
            { flag: '🇻🇳', name: 'Vietnamese' },
            { flag: '🌎', name: 'Continental' }
          ].map((c) => (
            <button
              key={c.name}
              type="button"
              className={`cuisine-pill ${formData.cuisines.includes(c.name) ? 'selected' : ''}`}
              onClick={() => toggleMultiCuisine(c.name)}
            >
              <span className="cuis-flag">{c.flag}</span>
              <span className="cuis-name">{c.name}</span>
            </button>
          ))}
        </div>

        <div className="field-divider" />

        <div className="field-row">
          <div className="field">
            <label htmlFor="fav-dish">Favourite Dish</label>
            <input 
              type="text" 
              id="fav-dish" 
              placeholder="e.g. Dal makhani, Ramen…"
              value={formData.favDish}
              onChange={handleTextChange('favDish')}
            />
          </div>
          <div className="field">
            <label htmlFor="dislikes">Dislikes / Hard Avoids</label>
            <input 
              type="text" 
              id="dislikes" 
              placeholder="e.g. Bitter gourd, Liver…"
              value={formData.dislikes}
              onChange={handleTextChange('dislikes')}
            />
          </div>
        </div>

        <div className="field-row full">
          <div className="field">
            <label htmlFor="medical">Any medical conditions relevant to diet?</label>
            <input 
              type="text" 
              id="medical" 
              placeholder="e.g. Diabetes Type 2, Hypertension, IBS…"
              value={formData.medical}
              onChange={handleTextChange('medical')}
            />
          </div>
        </div>

        <div className="form-nav">
          <button type="button" className="btn-back" onClick={prevStep}>← Back</button>
          <span className="step-counter">Step 3 of 5</span>
          <button type="button" className="btn-next" onClick={nextStep}>Continue →</button>
        </div>
      </div>

      {/* ═══ STEP 3: Delivery ═══ */}
      <div className={`form-step ${currentStep === 3 ? 'active' : ''}`}>
        <h2 className="step-title">Delivery <em>Details</em></h2>
        <p className="step-subtitle">Where and how you'd like your meals delivered.</p>

        <div className="field-section-label">Delivery Plan</div>
        <div className="delivery-grid">
          {[
            { icon: '🌅', title: 'Single Slot', desc: 'All four meals delivered together in the morning. One pickup, everything for the day.', badge: 'Morning Dispatch' },
            { icon: '🔄', title: 'Multi Slot', desc: 'Fresh delivery for each meal window — breakfast, lunch, and dinner delivered separately.', badge: '3× Daily' }
          ].map((plan) => (
            <button
              key={plan.title}
              type="button"
              className={`delivery-card ${formData.deliveryPlan === plan.title ? 'selected' : ''}`}
              onClick={() => selectSinglePill('deliveryPlan', plan.title)}
            >
              <div className="dc-icon">{plan.icon}</div>
              <div className="dc-title">{plan.title}</div>
              <div className="dc-desc">{plan.desc}</div>
              <span className="dc-badge">{plan.badge}</span>
            </button>
          ))}
        </div>

        <div className="field-section-label" style={{ marginTop: '28px' }}>Delivery Address</div>
        <div className="field-row full">
          <div className={`field ${errors.address ? 'invalid' : ''}`}>
            <label htmlFor="address">Full Address <span className="req">*</span></label>
            <textarea 
              id="address" 
              rows={3} 
              placeholder="Flat / House no., Building, Street, Area, Bengaluru…"
              value={formData.address}
              onChange={handleTextChange('address')}
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="landmark">Landmark</label>
            <input 
              type="text" 
              id="landmark" 
              placeholder="Near SBI ATM, opp. park…"
              value={formData.landmark}
              onChange={handleTextChange('landmark')}
            />
          </div>
          <div className="field">
            <label htmlFor="delivery-note">Delivery Instructions</label>
            <input 
              type="text" 
              id="delivery-note" 
              placeholder="Gate code, leave at door…"
              value={formData.deliveryNote}
              onChange={handleTextChange('deliveryNote')}
            />
          </div>
        </div>

        <div className="field-divider" />

        <div className="field-row full">
          <div className="field">
            <label htmlFor="notes">Additional Notes for the Chef</label>
            <textarea 
              id="notes" 
              rows={3} 
              placeholder="Anything else we should know — health goals, meal timing preferences, religious observances, travel plans…"
              value={formData.notes}
              onChange={handleTextChange('notes')}
            />
          </div>
        </div>

        <div className="form-nav">
          <button type="button" className="btn-back" onClick={prevStep}>← Back</button>
          <span className="step-counter">Step 4 of 5</span>
          <button type="button" className="btn-next" onClick={nextStep}>Continue →</button>
        </div>
      </div>

      {/* ═══ STEP 4: Review ═══ */}
      <div className={`form-step ${currentStep === 4 ? 'active' : ''}`}>
        <h2 className="step-title">Almost <em>ready</em></h2>
        <p className="step-subtitle">Review your details before we begin crafting your plan.</p>

        <div className="review-grid">
          {/* Personal Card */}
          <div className="review-card">
            <div className="review-card-title">
              Personal 
              <button type="button" className="review-edit-btn" onClick={() => goToStep(0)}>Edit</button>
            </div>
            <div className="review-item">
              <span className="review-item-label">Name</span>
              <span className="review-item-val" title={formData.name}>{formData.name || '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Phone</span>
              <span className="review-item-val" title={formData.phone}>{formData.phone || '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Email</span>
              <span className="review-item-val" title={formData.email}>{formData.email || '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Date of Birth</span>
              <span className="review-item-val">{formData.dob || '—'}{formData.age ? ` · ${formData.age} yrs` : ''}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Gender</span>
              <span className="review-item-val">{formData.gender || '—'}</span>
            </div>
          </div>

          {/* Body & Goals Card */}
          <div className="review-card">
            <div className="review-card-title">
              Body &amp; Goals 
              <button type="button" className="review-edit-btn" onClick={() => goToStep(1)}>Edit</button>
            </div>
            <div className="review-item">
              <span className="review-item-label">Weight</span>
              <span className="review-item-val">{formData.weight ? `${formData.weight} kg` : '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Height</span>
              <span className="review-item-val">{formData.height ? `${formData.height} cm` : '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Target Weight</span>
              <span className="review-item-val">{formData.targetWeight ? `${formData.targetWeight} kg` : '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">BMI</span>
              <span className="review-item-val">{bmiDetails ? bmiDetails.bmi : '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Goal</span>
              <span className="review-item-val" title={formData.goal}>{formData.goal || '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Activity</span>
              <span className="review-item-val">{formData.activity || '—'}</span>
            </div>
          </div>

          {/* Palate Card */}
          <div className="review-card full">
            <div className="review-card-title">
              Palate 
              <button type="button" className="review-edit-btn" onClick={() => goToStep(2)}>Edit</button>
            </div>
            <div className="review-item">
              <span className="review-item-label">Diet</span>
              <span className="review-item-val">{formData.diet || '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Spice</span>
              <span className="review-item-val">{formData.spice || '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Favourite Dish</span>
              <span className="review-item-val" title={formData.favDish}>{formData.favDish || '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Dislikes</span>
              <span className="review-item-val" title={formData.dislikes}>{formData.dislikes || '—'}</span>
            </div>
            {formData.medical && (
              <div className="review-item">
                <span className="review-item-label">Medical</span>
                <span className="review-item-val" title={formData.medical}>{formData.medical}</span>
              </div>
            )}
            {formData.allergies.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div className="review-item-label" style={{ fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stone)' }}>
                  Allergies
                </div>
                <div className="review-chips">
                  {formData.allergies.map(a => (
                    <span key={a} className="review-chip">{a}</span>
                  ))}
                </div>
              </div>
            )}
            {formData.cuisines.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div className="review-item-label" style={{ fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stone)' }}>
                  Cuisines
                </div>
                <div className="review-chips">
                  {formData.cuisines.map(c => (
                    <span key={c} className="review-chip">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delivery Card */}
          <div className="review-card full">
            <div className="review-card-title">
              Delivery 
              <button type="button" className="review-edit-btn" onClick={() => goToStep(3)}>Edit</button>
            </div>
            <div className="review-item">
              <span className="review-item-label">Plan</span>
              <span className="review-item-val">{formData.deliveryPlan || '—'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Address</span>
              <span className="review-item-val" title={formData.address}>{formData.address || '—'}</span>
            </div>
            {formData.landmark && (
              <div className="review-item">
                <span className="review-item-label">Landmark</span>
                <span className="review-item-val" title={formData.landmark}>{formData.landmark}</span>
              </div>
            )}
            {formData.deliveryNote && (
              <div className="review-item">
                <span className="review-item-label">Instructions</span>
                <span className="review-item-val" title={formData.deliveryNote}>{formData.deliveryNote}</span>
              </div>
            )}
            {formData.notes && (
              <div className="review-item">
                <span className="review-item-label">Notes for Chef</span>
                <span className="review-item-val" title={formData.notes}>{formData.notes}</span>
              </div>
            )}
          </div>
        </div>

        {submitError && (
          <div className="field-error" style={{ marginBottom: '16px', textAlign: 'center', fontSize: '13px' }}>
            ⚠️ {submitError}
          </div>
        )}

        <div className="form-nav">
          <button type="button" className="btn-back" onClick={prevStep} disabled={isSubmitting}>← Back</button>
          <span className="step-counter">Step 5 of 5</span>
          <button 
            type="button" 
            className="btn-next btn-submit" 
            onClick={submitForm}
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="spinner" /> : 'Submit Onboarding ✦'}
          </button>
        </div>
      </div>
    </div>
  );
}
