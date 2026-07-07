'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Home() {
  // Spots bar state
  const [spotsFill, setSpotsFill] = useState('0%');
  const [spotsText, setSpotsText] = useState('Checking availability…');
  
  // BMI & Calorie Calculator inputs
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [activity, setActivity] = useState('');
  
  // BMI & Calorie Calculator outputs
  const [calcResults, setCalcResults] = useState<{
    bmi: string;
    bmiCat: string;
    tdee: number;
  } | null>(null);

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );

    document.querySelectorAll('.rev').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Spots progress bar animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setSpotsFill('15%');
      setSpotsText('34 spots remaining of 40');
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  // Calculate BMI and calorie target
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseFloat(age);
    const act = parseFloat(activity);
    
    if (!h || !w || !a || !sex || !act) {
      alert('Please fill in all fields.');
      return;
    }
    
    const bmi = w / ((h / 100) ** 2);
    let bmr;
    if (sex === 'm') {
      bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a);
    } else {
      bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a);
    }
    const tdee = Math.round(bmr * act);
    
    let bmiCat = 'Healthy weight';
    if (bmi < 18.5) bmiCat = 'Underweight';
    else if (bmi < 25) bmiCat = 'Healthy weight';
    else if (bmi < 30) bmiCat = 'Overweight';
    else bmiCat = 'Obese range';
    
    setCalcResults({
      bmi: bmi.toFixed(1),
      bmiCat,
      tdee
    });
  };

  return (
    <div className="landing-page">
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="hero-l">
          <div className="h-eyebrow">
            <span className="h-eyebrow-line"></span>
            <span className="h-eyebrow-txt">Private kitchen · Sadashivanagar, Bengaluru</span>
          </div>
          <h1 className="hero-h1">
            Precision<br />
            <em>food,</em><br />
            <span className="outline">daily.</span>
          </h1>
          <p className="hero-sub">A private kitchen that cooks for 40 members. Every meal built to your biology. Delivered in your named vessel, every morning. No plastic. No repetition. No guesswork.</p>
          <div className="hero-ctas">
            <Link className="btn-fill" href="/apply">
              Apply for membership
              <span className="arr" style={{ marginLeft: '6px' }}>→</span>
            </Link>
            <a className="btn-ghost" href="#vessel">How it works ↓</a>
          </div>
          <div className="hero-numbers">
            <div className="hn-item">
              <span className="hn-val">40</span>
              <span className="hn-lbl">Members total</span>
            </div>
            <div className="hn-item">
              <span className="hn-val">28</span>
              <span className="hn-lbl">Day cycle</span>
            </div>
            <div className="hn-item">
              <span className="hn-val">0</span>
              <span className="hn-lbl">Repeated dishes</span>
            </div>
            <div className="hn-item">
              <span className="hn-val">5</span>
              <span className="hn-lbl">Meals per day</span>
            </div>
          </div>
        </div>

        <div className="hero-r">
          <div className="hero-r-media">
            <img src="https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=80&fit=crop" alt="Precision meal preparation" />
          </div>
          <div className="hero-r-overlay"></div>
          {/* rings */}
          <div className="hero-ring"></div>
          <div className="hero-ring hero-ring-2"></div>
          <div className="hero-ring hero-ring-3"></div>
          {/* Vessel art */}
          <div className="vessel-comp">
            <div className="vc-handle"></div>
            <div className="vc-lid"></div>
            <div className="vc-body">
              <div className="vc-name">Arjun Mehta · Day 14</div>
            </div>
          </div>
          <div className="vc-copper">
            <div className="vcc-lid"></div>
            <div className="vcc-body"></div>
          </div>
          {/* Floating cards */}
          <div className="hero-card hc-1">
            <div className="hc-label">Today's protein</div>
            <div className="hc-val">142g</div>
            <div className="hc-sub">Your target: 140g</div>
          </div>
          <div className="hero-card hc-2">
            <div className="hc-label">Delivered by</div>
            <div className="hc-val">7:58 am</div>
            <div className="hc-sub">Day 14 of 28</div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-strip">
        <div className="marquee-inner">
          {/* set 1 */}
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Named boxes, every morning</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Zero plastic. Always.</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">28 days, zero repetition</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Portioned to your biology</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">40 members. Hard cap.</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Sadashivanagar · Bengaluru</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Chef-quality, daily</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Yours forever.</span></div>
          {/* set 2 (duplicate for seamless) */}
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Named boxes, every morning</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Zero plastic. Always.</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">28 days, zero repetition</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Portioned to your biology</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">40 members. Hard cap.</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Sadashivanagar · Bengaluru</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Chef-quality, daily</span></div>
          <div className="marquee-item"><span className="mi-dot"></span><span className="mi-txt">Yours forever.</span></div>
        </div>
      </div>

      {/* BOX SECTION */}
      <section className="vessel-section sec-pad" id="vessel">
        <div className="sec-inner">
          <div className="vessel-grid">
            <div>
              <div className="eyebrow rev">Your box</div>
              <h2 className="h2 rev d1">Not a container.<br /><em>A commitment.</em></h2>
              <p className="body-lg rev d2" style={{ marginTop: '24px' }}>Your Kōsh box is ceramic-coated glass — built for food, not plastic. It is made specifically for you, with your name on it. At the end of your subscription, it does not go back to us. It goes home with you. Permanently yours.</p>
              
              <div className="vessel-steps">
                <div className="vstep rev d2">
                  <div className="vs-num">01</div>
                  <div className="vs-content">
                    <h4>Ceramic-coated glass, made for food</h4>
                    <p>No leaching, no plastic, no compromise. Designed to hold heat, keep food fresh, and look like something worth opening.</p>
                  </div>
                </div>
                <div className="vstep rev d3">
                  <div className="vs-num">02</div>
                  <div className="vs-content">
                    <h4>Your name. Only yours.</h4>
                    <p>Every box is individual to the member it is made for. No two are the same. A new member gets a new box — your box is never reused.</p>
                  </div>
                </div>
                <div className="vstep rev d3">
                  <div className="vs-num">03</div>
                  <div className="vs-content">
                    <h4>Portioned to your numbers</h4>
                    <p>Same kitchen. Same menu. Different portion sizes, calibrated to your calorie target and macro split each day.</p>
                  </div>
                </div>
                <div className="vstep rev d4">
                  <div className="vs-num">04</div>
                  <div className="vs-content">
                    <h4>Yours forever at the end</h4>
                    <p>When your subscription ends, the box is handed over to you. A lasting record of the cycle you committed to.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="vessel-art rev d1">
              <div className="va-bg"></div>
              <div className="va-inner">
                <div className="va-steel-lid"></div>
                <div className="va-steel-body">
                  <div className="va-nameplate"><span>Priya Sharma</span></div>
                </div>
              </div>
              <div className="va-note">
                <p>Day 8 · Lunch</p>
                <p style={{ marginTop: '4px' }}>Seared chicken breast · Quinoa tabbouleh · Roasted courgette</p>
                <span>490 kcal · 44g protein</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROMISE */}
      <section className="promise-sec">
        <div className="promise-inner">
          <blockquote className="promise-quote rev">
            "We cook for forty people.<br />
            <em>Every meal is different.</em><br />
            Every portion is personal.<br />
            That is the entire idea."
          </blockquote>
          <p className="promise-attr rev d1">— Kōsh kitchen · Sadashivanagar, Bengaluru</p>
        </div>
      </section>

      {/* 28-DAY CYCLE */}
      <section className="cycle-sec sec-pad" id="cycle">
        <div className="sec-inner">
          <div className="cycle-head">
            <div className="rev">
              <div className="eyebrow light">The 28-day cycle</div>
              <h2 className="h2 light" style={{ marginTop: 0 }}>Sample menu.<br /><em>Nothing is fixed.</em></h2>
            </div>
            <div className="rev d1">
              <p className="body-md" style={{ color: 'rgba(247,244,238,.35)' }}>Each 28-day cycle runs 140 different dishes across all five daily meals. The same dish does not appear twice in a cycle. The menu below is illustrative — actual dishes change with season, sourcing, and craving polls. No repeats. Ever.</p>
            </div>
          </div>
          
          <div className="cycle-grid rev">
            <div className="cday"><div className="cday-n">Day 01</div><div><div className="cday-meal">Egg white omelette · Grilled chicken breast · Zucchini stir-fry</div><div className="cday-note">Cycle begins. First box. Clean slate, high protein.</div></div></div>
            <div className="cday"><div className="cday-n">Day 02</div><div><div className="cday-meal">Greek yoghurt bowl · Tuna brown rice bowl · Seared salmon</div><div className="cday-note">Omega-3 day. Light, fast, precise.</div></div></div>
            <div className="cday"><div className="cday-n">Day 04</div><div><div className="cday-meal">Protein pancakes · Turkey meatballs · Baked cod + greens</div><div className="cday-note">First time a pancake will feel like a responsible decision.</div></div></div>
            <div className="cday"><div className="cday-n">Day 07</div><div><div className="cday-meal">Scrambled eggs + smoked chicken · Grilled sirloin · Roast veg quinoa</div><div className="cday-note">End of week one. Red meat, earned.</div></div></div>
            <div className="cday"><div className="cday-n">Day 09</div><div><div className="cday-meal">Cottage cheese toast · Chicken shawarma bowl · Lamb ragu + lentils</div><div className="cday-note">Mediterranean week. Every bite counts.</div></div></div>
            <div className="cday"><div className="cday-n">Day 12</div><div><div className="cday-meal">Whey smoothie bowl · Chicken Caesar wrap · Grilled prawn + asparagus</div><div className="cday-note">Clean, fast, no shortcuts on quality.</div></div></div>
            <div className="cday"><div className="cday-n">Day 14</div><div><div className="cday-meal">Mid-cycle — optional cohort check-in</div><div className="cday-note">Casual, informal. Meet the other 39. Compare notes.</div></div></div>
            <div className="cday"><div className="cday-n">Day 17</div><div><div className="cday-meal">Smoked salmon bagel · Pulled chicken + sweet potato · Turkey chilli</div><div className="cday-note">Slow-cooked, high-yield. Week three starts strong.</div></div></div>
            <div className="cday"><div className="cday-n">Day 20</div><div><div className="cday-meal">Poached eggs + lean ham · Grilled chicken + farro · Beef tenderloin</div><div className="cday-note">Your body is already used to this rhythm.</div></div></div>
            <div className="cday"><div className="cday-n">Day 22</div><div><div className="cday-meal">Ricotta + berry bowl · Chicken pesto pasta · Pan-seared duck breast</div><div className="cday-note">The craving poll result from week two. We listened.</div></div></div>
            <div className="cday"><div className="cday-n">Day 25</div><div><div className="cday-meal">Protein waffles · Harissa chicken + couscous · Baked sea bass</div><div className="cday-note">North African spice meets Bengaluru precision.</div></div></div>
            <div className="cday"><div className="cday-n">Day 28</div><div><div className="cday-meal">Chef's finale · Dessert drop · Cohort dinner</div><div className="cday-note">The 28th day. The cohort gathers. Cycle 02 begins tomorrow.</div></div></div>
          </div>
          <p className="cycle-fn rev">— 140 unique dishes per cycle · Zero repeats · Menu resets every 28 days —</p>
        </div>
      </section>

      {/* FIVE MEALS */}
      <section className="meals-sec sec-pad" id="box">
        <div className="sec-inner">
          <div className="meals-head">
            <div className="rev">
              <div className="eyebrow">What's in your vessel</div>
              <h2 className="h2" style={{ marginTop: 0 }}>Five meals.<br /><em>Full day covered.</em></h2>
            </div>
            <div className="rev d1">
              <p className="body-md">All meals are portioned to your calorie target and macro split. Same kitchen, same chef-quality dishes — your vessel gets the quantity your body actually needs that day.</p>
            </div>
          </div>
          <div className="meal-track rev d1">
            <div className="meal-item">
              <div className="meal-num">01</div>
              <div className="meal-time">Breakfast · 7–8 am</div>
              <div className="meal-name">High-protein, clean start</div>
              <div className="meal-desc">Egg white omelettes, smoked salmon, Greek yoghurt bowls, ricotta with berries. Calibrated to your morning macro target. Reheats in 3 minutes.</div>
            </div>
            <div className="meal-item">
              <div className="meal-num">02</div>
              <div className="meal-time">Morning snack · 10–11 am</div>
              <div className="meal-name">Macro-counted, portable</div>
              <div className="meal-desc">Cottage cheese with seeds, protein energy balls, turkey roll-ups. Bridges breakfast to lunch. Keeps energy stable.</div>
            </div>
            <div className="meal-item">
              <div className="meal-num">03</div>
              <div className="meal-time">Lunch · 1–2 pm</div>
              <div className="meal-name">The main event</div>
              <div className="meal-desc">Grilled sirloin, seared salmon, chicken pesto, tuna niçoise, harissa lamb. Chef-quality, warm, substantial. Reheats in 4 minutes.</div>
            </div>
            <div className="meal-item">
              <div className="meal-num">04</div>
              <div className="meal-time">Evening snack · 4–5 pm</div>
              <div className="meal-name">Light, satisfying, no spike</div>
              <div className="meal-desc">Whipped cottage cheese, smoked turkey wraps, cucumber with hummus. Prevents the evening binge. Ready to eat.</div>
            </div>
            <div className="meal-item">
              <div className="meal-num">05</div>
              <div className="meal-time">Dinner · 7–8 pm</div>
              <div className="meal-name">Refined, lighter, chef-quality</div>
              <div className="meal-desc">Pan-seared sea bass, duck breast, prawn with asparagus, baked cod. Lighter than lunch, higher in craft. Reheats in 4–5 min.</div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="plans-sec sec-pad" id="plans">
        <div className="sec-inner">
          <div className="plans-head">
            <div className="rev">
              <div className="eyebrow">The membership</div>
              <h2 className="h2" style={{ marginTop: 0 }}>One plan.<br /><em>All five meals.</em></h2>
            </div>
            <p className="body-md rev d1">The same kitchen-crafted menu goes to all 40 members — what changes is your portion. Your calorie target and macro split determine exactly how much of each dish lands in your box. Same quality, built for your numbers.</p>
          </div>
          <div className="plans-container rev d1">
            <div className="plan-card featured">
              <div className="plan-tag pt-feat">Full day · 5 meals</div>
              <div className="plan-name">The Kōsh<br />Programme</div>
              <div className="plan-tagline">Every meal. Every day. All yours.</div>
              <div className="plan-price">₹2,400</div>
              <div className="plan-period">per day · billed per 28-day cycle</div>
              <hr className="plan-div" />
              <ul className="plan-features">
                <li>Breakfast — high-protein, portioned to your target</li>
                <li>Morning snack — macro-counted, portable</li>
                <li>Lunch — full plate, your calorie target</li>
                <li>Evening snack — light, satisfying, no spike</li>
                <li>Dinner — refined, chef-quality, lighter than lunch</li>
                <li>Ceramic-coated glass box, your name on it, yours forever</li>
                <li>Daily macro card with every delivery</li>
                <li>28-day non-repeating menu — 140 unique dishes per cycle</li>
                <li>Weekly macro summary every Sunday</li>
                <li>Access to private @kosh.table community</li>
                <li>Weekly craving personalisation poll</li>
              </ul>
              <div className="plan-cycle">28 days: <b>₹67,200 / cycle</b></div>
              <Link className="plan-btn" href="/apply">Apply for membership</Link>
            </div>
            
            <div className="plan-card plan-info-card">
              <div>
                <div className="eyebrow" style={{ marginBottom: '16px' }}>How your portion works</div>
                <p className="body-md">Fill in your stats when you apply. We set your calorie target and macro split before your first delivery. Every dish is portioned to those numbers — no two boxes are identical.</p>
              </div>
              <div style={{ borderTop: '1px solid var(--sand)', paddingTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', paddingBottom: '14px', borderBottom: '1px solid var(--sand)' }}><span style={{ color: 'var(--stone)' }}>Calorie target</span><span style={{ color: 'var(--ink)', fontWeight: 500 }}>Your number</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', paddingBottom: '14px', borderBottom: '1px solid var(--sand)' }}><span style={{ color: 'var(--stone)' }}>Protein target</span><span style={{ color: 'var(--ink)', fontWeight: 500 }}>Your number</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', paddingBottom: '14px', borderBottom: '1px solid var(--sand)' }}><span style={{ color: 'var(--stone)' }}>Carb / fat split</span><span style={{ color: 'var(--ink)', fontWeight: 500 }}>Goal-based</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', paddingBottom: '14px', borderBottom: '1px solid var(--sand)' }}><span style={{ color: 'var(--stone)' }}>Dietary restrictions</span><span style={{ color: 'var(--ink)', fontWeight: 500 }}>Fully accommodated</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}><span style={{ color: 'var(--stone)' }}>Cycle recalibration</span><span style={{ color: 'var(--ink)', fontWeight: 500 }}>Every 28 days</span></div>
              </div>
              <div style={{ marginTop: '8px', padding: '18px 20px', borderLeft: '2px solid var(--copper)' }}>
                <p style={{ fontFamily: 'var(--ff)', fontStyle: 'italic', fontSize: '17px', color: 'var(--char)', lineHeight: 1.6 }}>"Same kitchen. Same menu. Your portion is the only thing that changes."</p>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '14px', padding: '20px 0', borderTop: '1px solid var(--sand)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }} className="rev d2">
            <p className="body-md" style={{ fontSize: '13px' }}>4 Pause Meals per cycle. Kitchen runs Mon–Sun. Multiple delivery slots at +₹150/day.</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', padding: '5px 14px', border: '1px solid var(--sand)', color: 'var(--stone)' }}>4 Pause Meals</span>
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', padding: '5px 14px', border: '1px solid var(--sand)', color: 'var(--stone)' }}>Mon–Sun</span>
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', padding: '5px 14px', border: '1px solid var(--sand)', color: 'var(--stone)' }}>Dessert add-on</span>
            </div>
          </div>
        </div>
      </section>

      {/* DAILY CARD */}
      <section className="daily-sec sec-pad">
        <div className="sec-inner">
          <div className="daily-head">
            <div className="rev">
              <div className="eyebrow light">Inside your vessel</div>
              <h2 className="h2 light" style={{ marginTop: 0 }}>Everything you need<br /><em>to eat precisely today.</em></h2>
            </div>
            <div className="progress-widget rev d1">
              <div className="pw-label">Weekly progress · sent every Sunday</div>
              <div className="pw-stats">
                <div className="pw-stat"><div className="pw-stat-val">94%</div><div className="pw-stat-lbl">Protein hit</div></div>
                <div className="pw-stat"><div className="pw-stat-val">7/7</div><div className="pw-stat-lbl">Meals received</div></div>
                <div className="pw-stat"><div className="pw-stat-val">Wk 2</div><div className="pw-stat-lbl">Into cycle</div></div>
              </div>
            </div>
          </div>
          
          <div className="day-card rev d1">
            <div className="dc-header">
              <div className="dc-day">14</div>
              <div>
                <div className="dc-name">Arjun Mehta</div>
                <div className="dc-sub">Cycle 01 · Day 14 of 28 · The Kōsh Programme</div>
              </div>
            </div>
            <div className="dc-meals">
              <div className="dc-meal"><div className="dc-meal-t">7:30 am</div><div className="dc-meal-name">Egg white omelette + smoked chicken</div><div className="dc-meal-cal">360 kcal · 42g P</div></div>
              <div className="dc-meal"><div className="dc-meal-t">10:30 am</div><div className="dc-meal-name">Greek yoghurt + mixed berries + walnuts</div><div className="dc-meal-cal">195 kcal · 18g P</div></div>
              <div className="dc-meal"><div className="dc-meal-t">1:00 pm</div><div className="dc-meal-name">Grilled sirloin + roasted sweet potato + greens</div><div className="dc-meal-cal">530 kcal · 48g P</div></div>
              <div className="dc-meal"><div className="dc-meal-t">4:30 pm</div><div className="dc-meal-name">Cottage cheese + cucumber + flaxseed crackers</div><div className="dc-meal-cal">190 kcal · 20g P</div></div>
              <div className="dc-meal"><div className="dc-meal-t">7:30 pm</div><div className="dc-meal-name">Seared salmon + asparagus + quinoa</div><div className="dc-meal-cal">385 kcal · 40g P</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="comm-sec sec-pad" id="community">
        <div className="sec-inner">
          <div className="comm-grid">
            <div>
              <div className="eyebrow rev">The Kōsh community</div>
              <h2 className="h2 rev d1" style={{ marginTop: 0 }}>Private.<br /><em>Members only.</em></h2>
              <p className="body-lg rev d2" style={{ marginTop: '24px' }}>We are building a fixed cohort of 40 people who are serious about eating right — and who can hold each other to it. The private <strong>@kosh.table</strong> Instagram account is the digital layer. The real community happens in person.</p>
              
              <div className="comm-perks">
                <div className="comm-perk">
                  <div className="cp-bullet">01</div>
                  <div className="cp-txt">
                    <h4>@kosh.table Private Network</h4>
                    <p>Exclusive digital space to connect, preview daily cycles, and participate in community voting.</p>
                  </div>
                </div>
                <div className="comm-perk">
                  <div className="cp-bullet">02</div>
                  <div className="cp-txt">
                    <h4>Monthly Cohort Gatherings</h4>
                    <p>We host exclusive dinners and nutrition workshops for members at the end of each 28-day cycle.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rev d1">
              <div className="ig-mock">
                <div className="ig-header">
                  <div className="ig-avatar">K</div>
                  <div>
                    <div className="ig-name">@kosh.table</div>
                    <div className="ig-sub">Private · Members only</div>
                  </div>
                  <div className="ig-badge">Members only</div>
                </div>
                <div className="ig-grid">
                  <div className="ig-cell"><img src="https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=200&q=70&fit=crop" alt="" /><div className="ig-cell-label"><span>Founder story</span></div></div>
                  <div className="ig-cell"><img src="https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=200&q=70&fit=crop" alt="" /><div className="ig-cell-label"><span>Kitchen prep</span></div></div>
                  <div className="ig-cell"><img src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&q=70&fit=crop" alt="" /><div className="ig-cell-label"><span>Day 12</span></div></div>
                  <div className="ig-cell"><img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=70&fit=crop" alt="" /><div className="ig-cell-label"><span>Cycle meetup</span></div></div>
                  <div className="ig-cell"><img src="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&q=70&fit=crop" alt="" /><div className="ig-cell-label"><span>Dessert drop</span></div></div>
                  <div className="ig-cell"><img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&q=70&fit=crop" alt="" /><div className="ig-cell-label"><span>Partner drops</span></div></div>
                  <div className="ig-cell"><img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70&fit=crop" alt="" /><div className="ig-cell-label"><span>Member meals</span></div></div>
                  <div className="ig-cell"><img src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=200&q=70&fit=crop" alt="" /><div className="ig-cell-label"><span>Community</span></div></div>
                  <div className="ig-cell"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?w=200&q=70&fit=crop" alt="" /><div className="ig-cell-label"><span>Cleanliness</span></div></div>
                </div>
                <div className="ig-footer">Follow request sent after your first delivery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DELIVERY */}
      <section className="del-sec sec-pad" id="delivery">
        <div className="sec-inner">
          <div className="del-grid">
            <div className="rev">
              <div className="eyebrow">Delivery zones</div>
              <h2 className="h2" style={{ marginTop: 0 }}>One delivery.<br /><em>Every morning.</em></h2>
              <p className="body-lg" style={{ marginTop: '24px' }}>All meals leave our kitchen together — breakfast, snacks, lunch, and dinner — by 8 am, seven days a week including weekends.</p>
              
              <div className="zones">
                <div className="zone-row">
                  <div className="zone-l"><div className="zone-dot zd-primary"></div><div><div className="zone-name">Sadashivanagar</div><div className="zone-sub">Palace Road · Bhashyam Road · Layout</div></div></div>
                  <span className="zone-badge">Free delivery</span>
                </div>
                <div className="zone-row">
                  <div className="zone-l"><div className="zone-dot zd-primary"></div><div><div className="zone-name">Dollars Colony</div><div className="zone-sub">All sectors</div></div></div>
                  <span className="zone-badge">Free delivery</span>
                </div>
                <div className="zone-row" style={{ opacity: 0.3 }}>
                  <div className="zone-l"><div className="zone-dot zd-inactive"></div><div><div className="zone-name">Other areas</div><div className="zone-sub">Not currently served</div></div></div>
                  <span style={{ fontSize: '12px', color: 'var(--stone)' }}>Waitlist only</span>
                </div>
              </div>
              
              <div style={{ marginTop: '16px', padding: '18px 22px', border: '1px solid var(--sand)' }}>
                <p style={{ fontSize: '13px', color: 'var(--stone)', lineHeight: 1.7 }}>We are hard-capped at <b style={{ color: 'var(--ink)' }}>40 households</b>. This is the number at which the kitchen can maintain precision. When the list is full, it is closed.</p>
              </div>
              
              <div className="vessel-policy">
                <div className="vp-label">Your box</div>
                <p className="vp-txt">Your ceramic-coated glass box is made for you and only you. It travels to our kitchen each night, is sanitised overnight, and returns the next morning with your meals. At the end of your subscription, it is yours to keep — permanently.</p>
              </div>
            </div>
            
            <div className="rev d1" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ border: '1px solid var(--sand)', padding: '36px' }}>
                <div className="eyebrow" style={{ marginBottom: '20px' }}>How the day works</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', padding: '16px 0', borderBottom: '1px solid var(--sand)' }}><span style={{ fontFamily: 'var(--ff)', fontStyle: 'italic', fontSize: '13px', color: 'var(--sand)', minWidth: '72px' }}>7:30 am</span><span style={{ fontSize: '13.5px', color: 'var(--stone)' }}>Box delivered. Breakfast ready in 3 minutes.</span></div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', padding: '16px 0', borderBottom: '1px solid var(--sand)' }}><span style={{ fontFamily: 'var(--ff)', fontStyle: 'italic', fontSize: '13px', color: 'var(--sand)', minWidth: '72px' }}>10:30 am</span><span style={{ fontSize: '13.5px', color: 'var(--stone)' }}>Morning snack. Ready to eat.</span></div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', padding: '16px 0', borderBottom: '1px solid var(--sand)' }}><span style={{ fontFamily: 'var(--ff)', fontStyle: 'italic', fontSize: '13px', color: 'var(--sand)', minWidth: '72px' }}>1:00 pm</span><span style={{ fontSize: '13.5px', color: 'var(--stone)' }}>Lunch. Reheats in 4 minutes.</span></div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', padding: '16px 0', borderBottom: '1px solid var(--sand)' }}><span style={{ fontFamily: 'var(--ff)', fontStyle: 'italic', fontSize: '13px', color: 'var(--sand)', minWidth: '72px' }}>4:30 pm</span><span style={{ fontSize: '13.5px', color: 'var(--stone)' }}>Evening snack. Ready to eat.</span></div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', padding: '16px 0', borderBottom: '1px solid var(--sand)' }}><span style={{ fontFamily: 'var(--ff)', fontStyle: 'italic', fontSize: '13px', color: 'var(--sand)', minWidth: '72px' }}>7:30 pm</span><span style={{ fontSize: '13.5px', color: 'var(--stone)' }}>Dinner. Reheats in 4–5 minutes.</span></div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', padding: '16px 0' }}><span style={{ fontFamily: 'var(--ff)', fontStyle: 'italic', fontSize: '13px', color: 'var(--sand)', minWidth: '72px' }}>9:00 pm</span><span style={{ fontSize: '13.5px', color: 'var(--stone)' }}>Box left at door. Collected overnight. Back tomorrow.</span></div>
                </div>
              </div>
              <div className="del-quote">
                <p>Your box is on its way. Day 14. Something you have not had before.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BMI / CALORIE CALCULATOR */}
      <section className="bmi-sec sec-pad" id="calculator">
        <div className="sec-inner">
          <div style={{ marginBottom: '56px' }} className="rev">
            <div className="eyebrow light">Calorie calculator</div>
            <h2 className="h2 light" style={{ marginTop: 0 }}>Find your<br /><em>numbers first.</em></h2>
          </div>
          
          <div className="bmi-inner">
            <div className="rev d1">
              <p className="body-md" style={{ color: 'rgba(247,244,238,.35)', marginBottom: '32px' }}>Enter your stats to estimate your daily calorie and macro targets. Share these when you apply — we use them to set your exact portion for every meal in the cycle.</p>
              
              <form className="bmi-form" onSubmit={handleCalculate}>
                <div className="bmi-row">
                  <div className="bmi-field">
                    <label className="bf-label" htmlFor="bh">Height (cm)</label>
                    <input 
                      className="bf-input" 
                      type="number" 
                      id="bh" 
                      placeholder="172"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="bmi-field">
                    <label className="bf-label" htmlFor="bw">Weight (kg)</label>
                    <input 
                      className="bf-input" 
                      type="number" 
                      id="bw" 
                      placeholder="70"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                
                <div className="bmi-row">
                  <div className="bmi-field">
                    <label className="bf-label" htmlFor="ba">Age</label>
                    <input 
                      className="bf-input" 
                      type="number" 
                      id="ba" 
                      placeholder="32"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="bmi-field">
                    <label className="bf-label" htmlFor="bg">Biological sex</label>
                    <select 
                      className="bf-select" 
                      id="bg"
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select</option>
                      <option value="m">Male</option>
                      <option value="f">Female</option>
                    </select>
                  </div>
                </div>
                
                <div className="bmi-field">
                  <label className="bf-label" htmlFor="bact">Activity level</label>
                  <select 
                    className="bf-select" 
                    id="bact"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select</option>
                    <option value="1.2">Sedentary (desk job, no exercise)</option>
                    <option value="1.375">Lightly active (1–3 days/week)</option>
                    <option value="1.55">Moderately active (3–5 days/week)</option>
                    <option value="1.725">Very active (6–7 days/week)</option>
                    <option value="1.9">Extremely active (athlete)</option>
                  </select>
                </div>
                
                <button type="submit" className="bmi-btn">Calculate my numbers</button>
                
                {calcResults && (
                  <div className="bmi-out visible">
                    <div className="bmi-out-val">{calcResults.bmi}</div>
                    <div className="bmi-out-sub">BMI</div>
                    <div className="bmi-out-text">
                      <b style={{ color: 'var(--gold)' }}>{calcResults.tdee.toLocaleString()} kcal/day</b> estimated maintenance.<br />
                      BMI category: {calcResults.bmiCat}.<br /><br />
                      To lose fat: ~{(calcResults.tdee - 400).toLocaleString()} kcal<br />
                      To maintain: ~{calcResults.tdee.toLocaleString()} kcal<br />
                      To build: ~{(calcResults.tdee + 250).toLocaleString()} kcal<br /><br />
                      <span style={{ fontSize: '11px', opacity: 0.5 }}>Your Kōsh nutritionist will refine this at consultation.</span>
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            <div className="rev d2" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ border: '1px solid rgba(247,244,238,.07)', padding: '28px' }}>
                <div className="eyebrow light" style={{ marginBottom: '16px' }}>How your portion is set</div>
                <p style={{ fontSize: '14px', color: 'rgba(247,244,238,.35)', lineHeight: 1.75 }}>Share your calorie target and macro goals when you apply. Before your first delivery, we confirm your numbers and calibrate every portion in the cycle accordingly. At Day 28, we recalibrate for the next cycle based on your feedback.</p>
              </div>
              <div style={{ border: '1px solid rgba(247,244,238,.07)', padding: '28px' }}>
                <div className="eyebrow light" style={{ marginBottom: '16px' }}>What your plan covers</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(247,244,238,.05)', fontSize: '13px' }}><span style={{ color: 'rgba(247,244,238,.3)' }}>Calorie target</span><span style={{ color: 'var(--parch)', fontWeight: 500 }}>Your number</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(247,244,238,.05)', fontSize: '13px' }}><span style={{ color: 'rgba(247,244,238,.3)' }}>Protein target</span><span style={{ color: 'var(--parch)', fontWeight: 500 }}>Your number</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(247,244,238,.05)', fontSize: '13px' }}><span style={{ color: 'rgba(247,244,238,.3)' }}>Carb / fat split</span><span style={{ color: 'var(--parch)', fontWeight: 500 }}>Goal-based</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px' }}><span style={{ color: 'rgba(247,244,238,.3)' }}>Dietary restrictions</span><span style={{ color: 'var(--parch)', fontWeight: 500 }}>Fully accommodated</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APPLY */}
      <section className="apply-sec sec-pad" id="apply">
        <div className="sec-inner">
          <div className="apply-grid">
            <div className="rev">
              <div className="eyebrow light">Apply for membership</div>
              <h2 className="h2 light" style={{ marginTop: 0 }}>We cook for 40.<br /><em>You could be one of them.</em></h2>
              <p className="body-md" style={{ color: 'rgba(247,244,238,.35)', marginTop: '24px' }}>Spots are limited to 40 households. Click below to begin your application. Takes under 5 minutes. No payment at this stage — we confirm your spot and set your portion targets before your first delivery.</p>
              <div className="apply-perks">
                <div className="aperk"><b>40</b>Members. Hard cap. Total. Always.</div>
                <div className="aperk"><b>0</b>Plastic. In any form. Ever.</div>
                <div className="aperk"><b>28</b>Days before a dish appears again.</div>
                <div className="aperk"><b>5</b>Meals per day. Full day covered.</div>
                <div className="aperk"><b>1</b>Box. Named. Yours forever.</div>
              </div>
              <div style={{ marginTop: '24px', padding: '18px 22px', border: '1px solid rgba(247,244,238,.06)', background: 'rgba(247,244,238,.02)' }}>
                <div style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(247,244,238,.2)', marginBottom: '6px' }}>On the waitlist</div>
                <p style={{ fontSize: '13px', color: 'rgba(247,244,238,.25)', lineHeight: 1.7 }}>If we are full, you go on the waitlist — not into a void. Waitlisted members receive early access when a spot opens.</p>
              </div>
            </div>
            
            <div className="rev d1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', textAlign: 'center' }}>
              <div className="spots-wrap" style={{ width: '100%' }}>
                <div className="spots-bar">
                  <div className="spots-fill" style={{ width: spotsFill }}></div>
                </div>
                <span className="spots-txt">{spotsText}</span>
              </div>
              <div style={{ border: '1px solid rgba(247,244,238,.08)', padding: '52px 40px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--ff)', fontSize: 'clamp(28px,3vw,42px)', fontWeight: 300, color: 'var(--parch)', lineHeight: 1.1, marginBottom: '12px' }}>Ready to begin<br /><em style={{ color: 'var(--gold)' }}>your cycle?</em></div>
                  <p style={{ fontSize: '13px', color: 'rgba(247,244,238,.3)', lineHeight: 1.7, maxWidth: '320px', margin: '0 auto' }}>Fill in your details, your macro goals, and your delivery area. We'll be in touch within 48 hours.</p>
                </div>
                <Link 
                  href="/apply" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', background: 'var(--copper)', color: 'var(--parch)', fontFamily: 'var(--fs)', fontSize: '12px', fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', padding: '20px 48px', transition: 'background .25s', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--copper-l)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--copper)'}
                >
                  Begin application <span style={{ fontSize: '16px', lineHeight: 1 }}>→</span>
                </Link>
                <p style={{ fontSize: '11px', color: 'rgba(247,244,238,.18)', letterSpacing: '.04em' }}>No payment at this stage</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="ft-inner">
          <div className="ft-top">
            <div>
              <div className="ft-brand">Kō<em>sh</em></div>
              <p className="ft-desc">A private kitchen in Sadashivanagar, Bengaluru. Forty members. Precision nutrition. Named vessels. No plastic. Operated by Table 14.</p>
            </div>
            <div className="ft-col">
              <h5>Navigate</h5>
              <ul className="ft-links">
                <li><a href="#vessel">The box</a></li>
                <li><a href="#cycle">28-day cycle</a></li>
                <li><a href="#plans">Plan</a></li>
                <li><a href="#community">Community</a></li>
                <li><a href="#delivery">Delivery</a></li>
                <li><Link href="/apply">Apply</Link></li>
              </ul>
            </div>
            <div className="ft-col">
              <h5>Contact</h5>
              <ul className="ft-links">
                <li><a href="#">WhatsApp</a></li>
                <li><a href="#">Email</a></li>
                <li><a href="#">Instagram</a></li>
                <li><a href="#">kosh.in</a></li>
              </ul>
            </div>
          </div>
          <div className="ft-bottom">
            <span className="ft-copy">© 2025 Kōsh · Sadashivanagar, Bengaluru</span>
            <span className="ft-by">A cloud kitchen by Table 14</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
