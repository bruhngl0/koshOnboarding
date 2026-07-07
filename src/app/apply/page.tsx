import Navbar from '@/components/Navbar';
import OnboardingForm from '@/components/OnboardingForm';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="page-wrap" style={{ paddingTop: '140px' }}>
        {/* Header */}
        <header className="form-header">
          <h1>
            Tell us about<br />
            <em>yourself</em>
          </h1>
          <p>A few details help us craft your meals with intention — every bite calibrated to you.</p>
        </header>

        {/* Onboarding Wizard Form */}
        <section aria-label="Onboarding Form Wizard">
          <OnboardingForm />
        </section>
      </main>
    </>
  );
}
