import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarClock, ShieldCheck, Activity, Star } from 'lucide-react';

interface Slide {
  image: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  gradient: string;
  icon: typeof ShieldCheck;
}

const SLIDES: Slide[] = [
  {
    image: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1600',
    badge: '24/7 Emergency Care',
    title: 'Compassionate Care,',
    highlight: 'Advanced Medicine',
    subtitle: 'From emergency services to specialized treatments, we are here for your family around the clock.',
    gradient: 'from-rose-600/80 via-rose-700/60 to-slate-900/40',
    icon: ShieldCheck,
  },
  {
    image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=1600',
    badge: 'State-of-the-Art Surgery',
    title: 'Precision Surgery with',
    highlight: 'Modern Technology',
    subtitle: 'Advanced operation theatres with laparoscopic and robotic surgical capabilities for faster recovery.',
    gradient: 'from-blue-700/80 via-cyan-700/60 to-slate-900/40',
    icon: Activity,
  },
  {
    image: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=1600',
    badge: 'Expert Specialist OPD',
    title: '15+ Specialties Under',
    highlight: 'One Roof',
    subtitle: 'Consult with experienced specialists across cardiology, orthopedics, gynecology, pediatrics and more.',
    gradient: 'from-teal-700/80 via-emerald-700/60 to-slate-900/40',
    icon: CalendarClock,
  },
  {
    image: 'https://images.pexels.com/photos/262500/pexels-photo-262500.jpeg?auto=compress&cs=tinysrgb&w=1600',
    badge: 'Critical Care Excellence',
    title: 'ICU & CCU with',
    highlight: 'Life-Saving Equipment',
    subtitle: 'Round-the-clock critical care with ventilators, cardiac monitors, and dedicated intensivists.',
    gradient: 'from-cyan-700/80 via-blue-800/60 to-slate-900/40',
    icon: ShieldCheck,
  },
];

export function HeroCarousel({ onBookAppointment, onLogin }: { onBookAppointment: () => void; onLogin: () => void }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => setCurrent((prev) => (prev + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next, isPaused]);

  return (
    <section
      className="relative h-[560px] sm:h-[620px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {SLIDES.map((slide, index) => {
        const Icon = slide.icon;
        const isActive = index === current;
        return (
          <div
            key={index}
            className={`carousel-slide absolute inset-0 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            style={{ transform: isActive ? 'scale(1)' : 'scale(1.05)' }}
          >
            <img src={slide.image} alt={slide.badge} className="absolute inset-0 w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className={`max-w-2xl ${isActive ? 'animate-fade-in-up' : ''}`}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-white text-xs font-semibold uppercase tracking-wider mb-5">
                  <Icon size={14} />
                  {slide.badge}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
                  {slide.title}
                  <br />
                  <span className="text-cyan-300 drop-shadow-md">{slide.highlight}</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-100/90 mb-8 max-w-xl leading-relaxed">{slide.subtitle}</p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={onBookAppointment} className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-700 rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <CalendarClock size={20} className="group-hover:rotate-12 transition-transform" />
                    Book Appointment
                  </button>
                  <button onClick={onLogin} className="inline-flex items-center gap-2 px-6 py-3 glass text-white rounded-xl font-semibold border border-white/30 hover:bg-white/20 transition-all duration-300">
                    Patient Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Arrows */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 glass rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-all hover:scale-110" aria-label="Previous slide">
        <ChevronLeft size={22} />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 glass rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-all hover:scale-110" aria-label="Next slide">
        <ChevronRight size={22} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 rounded-full transition-all duration-400 ${index === current ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Stats bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 hidden sm:block">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
          <div className="flex items-center gap-8 text-white">
            <div className="flex items-center gap-2">
              <Star className="text-amber-400 fill-amber-400" size={18} />
              <span className="text-sm font-medium">4.9/5 Patient Rating</span>
            </div>
            <div className="h-4 w-px bg-white/30" />
            <span className="text-sm font-medium">10,000+ Patients Served</span>
            <div className="h-4 w-px bg-white/30" />
            <span className="text-sm font-medium">100+ Beds</span>
          </div>
        </div>
      </div>
    </section>
  );
}
