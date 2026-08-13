import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { HeroCarousel } from '@/components/HeroCarousel';
import { ReviewSystem } from '@/components/ReviewSystem';
import {
  Building2, Mail, Lock, User, Eye, EyeOff, AlertCircle, Phone, Stethoscope,
  HeartPulse, Ambulance, Pill, FlaskConical, Scissors, CalendarClock,
  ShieldCheck, Clock, Award, Users, Activity, BedDouble, ArrowLeft, ArrowRight,
  Brain, Bone, Baby, Eye as EyeIcon, Syringe, Heart, Menu, X, MapPin,
  Microscope, Thermometer, ChevronRight, Package, FlaskRound, Beaker,
  Send, CheckCircle, MessageSquare, Navigation, Globe, Star, Sparkles,
  TrendingUp, HeartHandshake, Zap, Plus, Quote,
} from 'lucide-react';

type View = 'home' | 'login' | 'signup' | 'service-detail' | 'department-detail' | 'reviews';

interface ServiceDetail {
  id: string;
  icon: typeof Ambulance;
  title: string;
  desc: string;
  color: string;
  features: string[];
  image: string;
}

interface DeptDetail {
  id: string;
  name: string;
  icon: typeof Stethoscope;
  desc: string;
  services: string[];
}

const SERVICES: ServiceDetail[] = [
  {
    id: 'emergency', icon: Ambulance, title: 'Emergency Care', desc: '24/7 emergency services with rapid response team',
    color: 'rose', image: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: ['24/7 Trauma Care', 'Ambulance Service', 'Critical Care Team', 'Emergency Surgery', 'Cardiac Emergency', 'Poison Control'],
  },
  {
    id: 'ot', icon: Scissors, title: 'Operation Theatre', desc: 'State-of-the-art surgical facilities',
    color: 'brand', image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: ['Modern OT Rooms', 'Laparoscopic Surgery', 'General Surgery', 'Orthopedic Surgery', 'Anesthesia Support', 'Post-Op Recovery'],
  },
  {
    id: 'lab', icon: FlaskConical, title: 'Laboratory & Diagnostics', desc: 'Full range of pathology and diagnostic tests',
    color: 'amber', image: 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: ['Blood Tests', 'Urine Analysis', 'Pathology', 'Microbiology', 'Biochemistry', 'Hormone Tests'],
  },
  {
    id: 'pharmacy', icon: Pill, title: 'Pharmacy', desc: '24/7 pharmacy with all medicines',
    color: 'emerald', image: 'https://images.pexels.com/photos/139398/hospital-ward-medicine-health-139398.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: ['24/7 Service', 'Prescription Filling', 'OTC Medicines', 'Surgical Supplies', 'Cold Storage', 'Home Delivery'],
  },
  {
    id: 'icu', icon: HeartPulse, title: 'ICU & CCU', desc: 'Critical care with modern equipment',
    color: 'rose', image: 'https://images.pexels.com/photos/262500/pexels-photo-262500.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: ['Ventilator Support', 'Cardiac Monitoring', 'Critical Care Nurses', 'Defibrillator', 'Central Oxygen', '24/7 Doctor'],
  },
  {
    id: 'opd', icon: Stethoscope, title: 'Specialist OPD', desc: 'Expert consultation across specialties',
    color: 'brand', image: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: ['General Medicine', 'Specialist Consultation', 'Health Checkup', 'Follow-up Care', 'Chronic Disease Management', 'Preventive Care'],
  },
  {
    id: 'inpatient', icon: BedDouble, title: 'Inpatient Care', desc: 'Comfortable wards and private rooms',
    color: 'blue', image: 'https://images.pexels.com/photos/3580/hospital-ward-ward.jpg?auto=compress&cs=tinysrgb&w=1200',
    features: ['Private Rooms', 'General Wards', 'Semi-Private Rooms', 'Dietary Service', 'Daily Doctor Visit', 'Nursing Care 24/7'],
  },
  {
    id: 'checkup', icon: ShieldCheck, title: 'Health Checkup', desc: 'Comprehensive health packages',
    color: 'emerald', image: 'https://images.pexels.com/photos/4225920/pexels-photo-4225920.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: ['Basic Health Check', 'Master Health Check', 'Cardiac Risk Assessment', 'Diabetes Package', 'Senior Citizen Check', 'Pre-Employment Check'],
  },
  {
    id: 'radiology', icon: Microscope, title: 'Radiology & Imaging', desc: 'Advanced imaging and scanning facilities',
    color: 'blue', image: 'https://images.pexels.com/photos/7659867/pexels-photo-7659867.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: ['X-Ray', 'Ultrasound', 'CT Scan', 'MRI', 'Echocardiogram', 'Mammography'],
  },
  {
    id: 'vaccination', icon: Syringe, title: 'Vaccination', desc: 'Immunization for all age groups',
    color: 'emerald', image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: ['Child Immunization', 'COVID-19 Vaccine', 'Flu Shot', 'Hepatitis B', 'Tetanus', 'Travel Vaccines'],
  },
  {
    id: 'ambulance', icon: Ambulance, title: 'Ambulance Service', desc: '24/7 ambulance with trained paramedics',
    color: 'rose', image: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: ['Basic Life Support', 'Advanced Life Support', 'Cardiac Transport', 'Neonatal Transport', 'Oxygen Support', 'GPS Tracking'],
  },
  {
    id: 'physiotherapy', icon: Activity, title: 'Physiotherapy', desc: 'Rehabilitation and physical therapy',
    color: 'brand', image: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: ['Post-Surgery Rehab', 'Sports Injury', 'Stroke Rehab', 'Spinal Therapy', 'Joint Mobility', 'Pain Management'],
  },
];

const DEPARTMENTS: DeptDetail[] = [
  { id: 'general-medicine', name: 'General Medicine', icon: Stethoscope, desc: 'Diagnosis and treatment of general adult diseases', services: ['Fever Treatment', 'Hypertension', 'Diabetes Management', 'Respiratory Infections'] },
  { id: 'general-surgery', name: 'General Surgery', icon: Scissors, desc: 'Surgical procedures for common conditions', services: ['Appendectomy', 'Hernia Repair', 'Gallbladder Surgery', 'Thyroid Surgery'] },
  { id: 'orthopedics', name: 'Orthopedics', icon: Bone, desc: 'Bone, joint, and musculoskeletal care', services: ['Fracture Treatment', 'Joint Replacement', 'Spine Care', 'Sports Injury'] },
  { id: 'gynecology', name: 'Gynecology & Obstetrics', icon: Baby, desc: "Women's health and maternity care", services: ['Antenatal Care', 'Normal Delivery', 'C-Section', 'PCOS Treatment'] },
  { id: 'pediatrics', name: 'Pediatrics', icon: Baby, desc: 'Medical care for infants and children', services: ['Vaccination', 'Growth Monitoring', 'Newborn Care', 'Child Nutrition'] },
  { id: 'ent', name: 'ENT', icon: Stethoscope, desc: 'Ear, nose, and throat specialist care', services: ['Hearing Test', 'Sinus Treatment', 'Tonsillectomy', 'Allergy Testing'] },
  { id: 'cardiology', name: 'Cardiology', icon: Heart, desc: 'Heart and cardiovascular disease treatment', services: ['ECG', 'Echocardiogram', 'BP Management', 'Heart Failure Treatment'] },
  { id: 'neurology', name: 'Neurology', icon: Brain, desc: 'Nervous system and brain disorders', services: ['Stroke Care', 'Epilepsy Management', 'Headache Treatment', 'Neuropathy'] },
  { id: 'urology', name: 'Urology', icon: Syringe, desc: 'Urinary tract and male reproductive health', services: ['Kidney Stones', 'Prostate Care', 'UTI Treatment', 'Bladder Issues'] },
  { id: 'dermatology', name: 'Dermatology', icon: ShieldCheck, desc: 'Skin, hair, and nail care', services: ['Acne Treatment', 'Eczema Care', 'Skin Allergy', 'Hair Loss'] },
  { id: 'ophthalmology', name: 'Ophthalmology', icon: EyeIcon, desc: 'Eye care and vision treatment', services: ['Cataract Surgery', 'Vision Test', 'Glaucoma Care', 'Eye Checkup'] },
  { id: 'psychiatry', name: 'Psychiatry', icon: Brain, desc: 'Mental health and behavioral disorders', services: ['Depression Treatment', 'Anxiety Management', 'Counseling', 'Sleep Disorders'] },
];

const colorMap: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', gradient: 'from-rose-500 to-rose-600' },
  brand: { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-200', gradient: 'from-brand-500 to-brand-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-500 to-amber-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-500 to-emerald-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500 to-blue-600' },
};

export function PublicSite({ onBackToDashboard }: { onBackToDashboard?: () => void }) {
  const [view, setView] = useState<View>('home');
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [selectedDept, setSelectedDept] = useState<DeptDetail | null>(null);
  const { signIn, signUp, user } = useAuth();

  const handleSetView = (v: View) => {
    if (v === 'login' && user) {
      onBackToDashboard?.();
      return;
    }
    setView(v);
  };

  if (view === 'login') return <AuthPage mode="signin" setView={setView} signIn={signIn} signUp={signUp} />;
  if (view === 'signup') return <AuthPage mode="signup" setView={setView} signIn={signIn} signUp={signUp} />;
  if (view === 'service-detail' && selectedService) return <ServiceDetailPage service={selectedService} setView={setView} />;
  if (view === 'department-detail' && selectedDept) return <DepartmentDetailPage dept={selectedDept} setView={setView} />;
  if (view === 'reviews') return <ReviewsPage setView={setView} onBackToDashboard={onBackToDashboard} />;
  return <HomePage setView={handleSetView} onSelectService={(s) => { setSelectedService(s); setView('service-detail'); }} onSelectDept={(d) => { setSelectedDept(d); setView('department-detail'); }} onBackToDashboard={onBackToDashboard} />;
}

// ============ Gallery Images ============
const GALLERY_IMAGES = [
  { src: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Emergency Department', span: 'lg:col-span-2 lg:row-span-2' },
  { src: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=600', label: 'Operation Theatre', span: '' },
  { src: 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg?auto=compress&cs=tinysrgb&w=600', label: 'Laboratory', span: '' },
  { src: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=600', label: 'Consultation Room', span: '' },
  { src: 'https://images.pexels.com/photos/3580/hospital-ward-ward.jpg?auto=compress&cs=tinysrgb&w=600', label: 'Patient Ward', span: '' },
  { src: 'https://images.pexels.com/photos/4225920/pexels-photo-4225920.jpeg?auto=compress&cs=tinysrgb&w=600', label: 'Health Checkup', span: '' },
];

// ============ Shared Nav ============
function NavBar({ setView, onNavClick, onBackToDashboard }: { setView: (v: View) => void; onNavClick?: (id: string) => void; onBackToDashboard?: () => void }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { id: 'services', label: 'Services' },
    { id: 'departments', label: 'Departments' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'about', label: 'About' },
    { id: 'inquiry', label: 'Inquiry' },
    { id: 'contact', label: 'Contact' },
  ];

  function handleNavClick(id: string) {
    if (id === 'reviews') {
      setView('reviews');
      setMobileOpen(false);
      return;
    }
    if (onNavClick) {
      onNavClick(id);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button onClick={() => setView('home')} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <Building2 className="text-white" size={22} />
          </div>
          <div className="text-left">
            <h1 className="font-bold text-slate-800 text-base leading-tight">MediCare</h1>
            <p className="text-xs text-slate-400">Nursing Home</p>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((l) => (
            <button key={l.id} onClick={() => handleNavClick(l.id)} className="hover:text-brand-600 transition-colors">{l.label}</button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button onClick={() => onBackToDashboard ? onBackToDashboard() : setView('login')} className="btn-primary text-sm flex items-center gap-2"><Globe size={16} /> Dashboard</button>
          ) : (
            <>
              <button onClick={() => setView('login')} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Sign In</button>
              <button onClick={() => setView('signup')} className="btn-primary text-sm">Register</button>
            </>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-slate-600 p-2 rounded-lg hover:bg-slate-100">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
          {navLinks.map((l) => (
            <button key={l.id} onClick={() => handleNavClick(l.id)} className="block w-full text-left text-sm font-medium text-slate-600 hover:text-brand-600 py-2">{l.label}</button>
          ))}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            {user ? (
              <button onClick={() => { onBackToDashboard ? onBackToDashboard() : setView('login'); setMobileOpen(false); }} className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"><Globe size={16} /> Dashboard</button>
            ) : (
              <>
                <button onClick={() => { setView('login'); setMobileOpen(false); }} className="flex-1 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg py-2">Sign In</button>
                <button onClick={() => { setView('signup'); setMobileOpen(false); }} className="flex-1 btn-primary text-sm">Register</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// ============ Home Page ============
function HomePage({ setView, onSelectService, onSelectDept, onBackToDashboard }: { setView: (v: View) => void; onSelectService: (s: ServiceDetail) => void; onSelectDept: (d: DeptDetail) => void; onBackToDashboard?: () => void }) {
  const { user } = useAuth();
  const [doctorCounts, setDoctorCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.from('staff').select('department').eq('role', 'Doctor').eq('status', 'Active').then(({ data }) => {
      if (!data) return;
      const counts: Record<string, number> = {};
      data.forEach((d: any) => { counts[d.department] = (counts[d.department] || 0) + 1; });
      setDoctorCounts(counts);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <NavBar setView={setView} onBackToDashboard={onBackToDashboard} />

      {/* Hero Carousel */}
      <HeroCarousel onBookAppointment={() => setView('signup')} onLogin={() => setView('login')} />

      {/* Quick Stats Banner */}
      <section className="relative -mt-1 bg-gradient-to-r from-brand-600 via-cyan-600 to-blue-600 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-white">
            {[
              { icon: BedDouble, value: '100+', label: 'Beds' },
              { icon: Stethoscope, value: '15+', label: 'Specialties' },
              { icon: Ambulance, value: '24/7', label: 'Emergency' },
              { icon: Users, value: '10K+', label: 'Patients Served' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`flex items-center gap-3 animate-fade-in-up stagger-${i + 1}`}>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Icon size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold">{stat.value}</p>
                    <p className="text-xs text-cyan-100">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-gradient-to-b from-slate-50 via-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wide">What We Offer</span>
            <h2 className="text-3xl font-bold text-slate-800 mt-2 mb-3">Our Services</h2>
            <p className="text-slate-500">Click any service to see details and available options</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              const c = colorMap[s.color];
              return (
                <button key={s.id} onClick={() => onSelectService(s)} className={`group relative bg-white rounded-2xl p-6 border ${c.border} hover:shadow-xl transition-all duration-300 text-left overflow-hidden`}>
                  <div className={`absolute top-0 right-0 w-24 h-24 ${c.bg} rounded-bl-3xl opacity-50 group-hover:opacity-80 transition-opacity`}></div>
                  <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${c.bg} group-hover:scale-110 transition-transform`}>
                    <Icon size={26} className={c.text} />
                  </div>
                  <h3 className="relative font-bold text-slate-800 mb-2">{s.title}</h3>
                  <p className="relative text-sm text-slate-500 mb-3">{s.desc}</p>
                  <p className={`relative text-xs ${c.text} font-medium flex items-center gap-1`}>View details <ArrowRight size={12} /></p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section id="departments" className="py-20 bg-gradient-to-br from-cyan-50 via-teal-50/40 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wide">Specialized Care</span>
            <h2 className="text-3xl font-bold text-slate-800 mt-2 mb-3">Our Departments</h2>
            <p className="text-slate-500">Click any department to see services and doctors</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEPARTMENTS.map((dept) => {
              const Icon = dept.icon;
              const count = doctorCounts[dept.name] || 0;
              return (
                <button key={dept.id} onClick={() => onSelectDept(dept)} className="group flex items-center gap-4 bg-white rounded-2xl p-5 border border-slate-100 hover:border-brand-200 hover:shadow-lg transition-all text-left">
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                    <Icon className="text-brand-600" size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-slate-700 text-sm block">{dept.name}</span>
                    {count > 0 ? (
                      <span className="text-xs text-slate-400">{count} doctor{count > 1 ? 's' : ''} available</span>
                    ) : (
                      <span className="text-xs text-slate-400">View services</span>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-20 bg-gradient-to-b from-white via-amber-50/30 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wide">Our Facility</span>
            <h2 className="text-3xl font-bold text-slate-800 mt-2 mb-3">Inside MediCare</h2>
            <p className="text-slate-500">Take a visual tour of our modern healthcare facility</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
            {GALLERY_IMAGES.map((img, i) => (
              <div key={i} className={`group relative rounded-2xl overflow-hidden ${img.span}`}>
                <img src={img.src} alt={img.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-white font-medium text-sm">{img.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-20 bg-gradient-to-br from-brand-50 via-cyan-50/50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2"><Sparkles size={16} /> Patient Feedback</span>
            <h2 className="text-3xl font-bold text-slate-800 mt-2 mb-3">Live Reviews</h2>
            <p className="text-slate-500">Real-time reviews from our patients. Share your own experience below.</p>
          </div>
          <ReviewSystem />
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-brand-600 font-semibold text-sm uppercase tracking-wide">About Us</span>
              <h2 className="text-3xl font-bold text-slate-800 mt-2 mb-4">About MediCare Nursing Home</h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Founded in 2010, MediCare Nursing Home has been serving the community with dedication and excellence. Our team of experienced doctors, nurses, and support staff are committed to providing the highest quality healthcare.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Award, title: 'Accredited Healthcare', desc: 'NABH accredited facility' },
                  { icon: Users, title: 'Expert Team', desc: '15+ specialist doctors' },
                  { icon: Clock, title: '24/7 Service', desc: 'Round-the-clock emergency care' },
                  { icon: ShieldCheck, title: 'Patient Safety', desc: 'Strict hygiene and safety protocols' },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="text-brand-600" size={22} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{f.title}</p>
                        <p className="text-sm text-slate-500">{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src="https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Medical team" className="rounded-2xl h-64 w-full object-cover" />
              <img src="https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Hospital room" className="rounded-2xl h-64 w-full object-cover mt-8" />
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry & Map */}
      <section id="inquiry" className="py-20 bg-gradient-to-b from-white via-rose-50/30 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wide">Have a Question?</span>
            <h2 className="text-3xl font-bold text-slate-800 mt-2 mb-3">Send Us an Inquiry</h2>
            <p className="text-slate-500">No login required. Select a category and we'll get back to you.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <InquiryForm />
            <div className="space-y-6">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                  title="Hospital Location"
                  width="100%"
                  height="320"
                  loading="lazy"
                  style={{ border: 0 }}
                  src="https://www.google.com/maps?q=MediCare+Nursing+Home+Pune&output=embed"
                />
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Navigation size={18} className="text-brand-600" /> How to Reach Us
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-700">123 Health Street, Pune</p>
                      <p className="text-slate-400">Maharashtra 411001, India</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-brand-600 flex-shrink-0" />
                    <span className="text-slate-600">+91 98765 43210 (24/7 Helpline)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-brand-600 flex-shrink-0" />
                    <span className="text-slate-600">care@medicare.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-600">Open 24 hours, 7 days a week</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-gradient-to-br from-slate-800 via-slate-900 to-brand-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wide">Get in Touch</span>
            <h2 className="text-3xl font-bold text-slate-800 mt-2 mb-3">Contact Us</h2>
            <p className="text-slate-500">We're here to help. Reach out to us anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Phone, title: 'Call Us', value: '+91 98765 43210', sub: '24/7 Helpline' },
              { icon: Mail, title: 'Email Us', value: 'care@medicare.com', sub: 'We reply within 24 hours' },
              { icon: MapPin, title: 'Visit Us', value: '123 Health Street, Pune', sub: 'Maharashtra, India' },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/10 hover:bg-white/15 transition-all">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="text-white" size={26} />
                  </div>
                  <h3 className="font-bold text-white mb-1">{c.title}</h3>
                  <p className="text-sm text-cyan-100 font-medium">{c.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{c.sub}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => setView('signup')} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-700 rounded-xl font-semibold shadow-xl hover:scale-105 transition-all"><CalendarClock size={18} /> Register as Patient</button>
          </div>
        </div>
      </section>

      <Footer setView={setView} />
    </div>
  );
}

function Footer({ setView }: { setView: (v: View) => void }) {
  return (
    <footer className="bg-slate-800 text-slate-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                <Building2 className="text-white" size={22} />
              </div>
              <div>
                <h1 className="font-bold text-white text-base">MediCare</h1>
                <p className="text-xs text-slate-400">Nursing Home</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">Compassionate care with advanced medicine since 2010.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-brand-400 transition-colors">Services</button>
              <button onClick={() => document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-brand-400 transition-colors">Departments</button>
              <button onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-brand-400 transition-colors">Gallery</button>
              <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-brand-400 transition-colors">About Us</button>
              <button onClick={() => document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-brand-400 transition-colors">Inquiry</button>
              <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-brand-400 transition-colors">Contact</button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Patient Portal</h3>
            <div className="space-y-2 text-sm">
              <button onClick={() => setView('login')} className="block hover:text-brand-400 transition-colors">Sign In</button>
              <button onClick={() => setView('signup')} className="block hover:text-brand-400 transition-colors">Register</button>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-sm text-slate-400">
          <p>© 2026 MediCare Nursing Home. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function InquiryForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', category: 'General', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'General', 'Emergency Care', 'Operation Theatre', 'Laboratory',
    'Pharmacy', 'ICU & CCU', 'Specialist OPD', 'Inpatient Care',
    'Health Checkup', 'Appointment', 'Billing', 'Other',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('inquiries').insert(form);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', category: 'General', subject: '', message: '' });
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-emerald-200 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Inquiry Sent!</h3>
        <p className="text-sm text-slate-500 mb-6">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
        <button onClick={() => setSuccess(false)} className="btn-secondary">Send Another Inquiry</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-100 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
        <MessageSquare size={20} className="text-brand-600" /> Inquiry Form
      </h3>
      <p className="text-sm text-slate-400 mb-6">Fill in the details below and we'll respond to your query.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Your Name *</label>
            <input className="input" placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" className="input" placeholder="you@example.com" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Category *</label>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Subject *</label>
          <input className="input" placeholder="Brief subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div>
          <label className="label">Message *</label>
          <textarea className="input min-h-[120px] resize-y" placeholder="Describe your inquiry..." required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? 'Sending...' : <><Send size={18} /> Send Inquiry</>}
        </button>
      </form>
    </div>
  );
}

// ============ Reviews Page ============
function ReviewsPage({ setView, onBackToDashboard }: { setView: (v: View) => void; onBackToDashboard?: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <NavBar setView={setView} onBackToDashboard={onBackToDashboard} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Home
        </button>
        <div className="text-center mb-10">
          <span className="text-brand-600 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2"><Sparkles size={16} /> Patient Feedback</span>
          <h1 className="text-4xl font-bold text-slate-800 mt-2 mb-3">Patient Reviews</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">Read what our patients have to say about their experience at MediCare, and share your own story.</p>
        </div>
        <ReviewSystem />
      </div>
    </div>
  );
}

// ============ Service Detail Page ============
function ServiceDetailPage({ service, setView }: { service: ServiceDetail; setView: (v: View) => void }) {
  const Icon = service.icon;
  const c = colorMap[service.color];
  const [dbData, setDbData] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    loadServiceData(service.id);
  }, [service.id]);

  async function loadServiceData(serviceId: string) {
    setLoading(true);
    let items: any[] = [];
    let categories: { name: string; count: number }[] = [];

    if (serviceId === 'pharmacy') {
      const { data } = await supabase.from('medicines').select('id, name, generic_name, brand, category, form, strength, selling_price').order('name');
      items = (data || []).map((m: any) => ({
        id: m.id, name: m.name, subtitle: m.generic_name || m.brand, category: m.category,
        extra: `${m.form || ''} ${m.strength || ''}`.trim(), price: m.selling_price ? `₹${m.selling_price}` : null,
      }));
    } else if (serviceId === 'lab') {
      const { data } = await supabase.from('lab_tests').select('id, test_name, category, sample_type, normal_range, price').order('test_name');
      items = (data || []).map((t: any) => ({
        id: t.id, name: t.test_name, subtitle: t.sample_type ? `Sample: ${t.sample_type}` : '', category: t.category,
        extra: t.normal_range || '', price: t.price ? `₹${t.price}` : null,
      }));
    } else if (serviceId === 'icu') {
      const { data } = await supabase.from('beds').select('id, bed_number, ward_name, type, status, daily_charge').in('type', ['ICU', 'CCU', 'NICU']).order('bed_number');
      items = (data || []).map((b: any) => ({
        id: b.id, name: `Bed ${b.bed_number}`, subtitle: b.ward_name, category: b.type,
        extra: b.status, price: b.daily_charge ? `₹${b.daily_charge}/day` : null,
      }));
    } else if (serviceId === 'inpatient') {
      const { data } = await supabase.from('wards').select('id, name, type, floor, total_beds, charge_per_day').order('name');
      items = (data || []).map((w: any) => ({
        id: w.id, name: w.name, subtitle: `Floor ${w.floor}`, category: w.type,
        extra: `${w.total_beds} beds`, price: w.charge_per_day ? `₹${w.charge_per_day}/day` : null,
      }));
    } else if (serviceId === 'ot') {
      const { data } = await supabase.from('ot_schedules').select('id, surgery_name, surgeon_name, department, ot_room, scheduled_date, scheduled_time, status, patient_name').order('scheduled_date', { ascending: false });
      items = (data || []).map((s: any) => ({
        id: s.id, name: s.surgery_name, subtitle: `Dr. ${s.surgeon_name}`, category: s.department || 'Surgery',
        extra: `${s.scheduled_date || ''} ${s.scheduled_time || ''}`.trim(), price: s.status, isStatus: true,
      }));
    } else if (serviceId === 'emergency') {
      const { data } = await supabase.from('ambulances').select('id, vehicle_id, driver_name, driver_phone, status').order('vehicle_id');
      items = (data || []).map((a: any) => ({
        id: a.id, name: a.vehicle_id, subtitle: a.driver_name, category: 'Ambulance',
        extra: a.driver_phone || '', price: a.status, isStatus: true,
      }));
    }

    // Build categories
    const catMap: Record<string, number> = {};
    items.forEach((item) => {
      const cat = item.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    categories = Object.entries(catMap).map(([name, count]) => ({ name, count }));

    setDbData(items);
    setDbCategories(categories);
    setLoading(false);
  }

  const filteredItems = activeCategory === 'All' ? dbData : dbData.filter((i) => i.category === activeCategory);

  return (
    <div className="min-h-screen bg-white">
      <NavBar setView={setView} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Home
        </button>

        {/* Hero banner */}
        <div className={`relative rounded-3xl overflow-hidden mb-8 ${c.bg}`}>
          <div className="absolute inset-0 opacity-10">
            <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
          </div>
          <div className="relative p-8 lg:p-10 flex items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br ${c.gradient} shadow-lg`}>
              <Icon size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{service.title}</h1>
              <p className="text-slate-600 mt-1">{service.desc}</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h2 className="font-bold text-slate-800 mb-4 text-lg">What We Offer</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {service.features.map((f) => (
              <div key={f} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg}`}>
                  <ShieldCheck size={16} className={c.text} />
                </div>
                <span className="text-sm font-medium text-slate-700">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real database data */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className={`w-8 h-8 border-3 ${c.border} border-t-transparent rounded-full animate-spin`}></div>
          </div>
        ) : dbData.length > 0 ? (
          <div>
            <h2 className="font-bold text-slate-800 mb-4 text-lg">
              {service.id === 'pharmacy' && 'Available Medicines'}
              {service.id === 'lab' && 'Available Tests'}
              {service.id === 'icu' && 'ICU & CCU Beds'}
              {service.id === 'inpatient' && 'Wards & Rooms'}
              {service.id === 'ot' && 'Scheduled Surgeries'}
              {service.id === 'emergency' && 'Ambulance Fleet'}
            </h2>

            {/* Category filter */}
            {dbCategories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setActiveCategory('All')}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeCategory === 'All' ? `${c.bg} ${c.text} border ${c.border}` : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
                >
                  All ({dbData.length})
                </button>
                {dbCategories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeCategory === cat.name ? `${c.bg} ${c.text} border ${c.border}` : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>
            )}

            {/* Items grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-800 text-sm">{item.name}</h3>
                    {item.price && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.isStatus ? (item.price === 'Available' || item.price === 'Scheduled' ? 'bg-emerald-50 text-emerald-600' : item.price === 'Completed' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600') : `${c.bg} ${c.text}`}`}>
                        {item.price}
                      </span>
                    )}
                  </div>
                  {item.subtitle && <p className="text-xs text-slate-500">{item.subtitle}</p>}
                  {item.extra && <p className="text-xs text-slate-400 mt-1">{item.extra}</p>}
                  {item.category && dbCategories.length > 1 && (
                    <span className="inline-block mt-2 text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{item.category}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl">
            <Package size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {service.id === 'emergency' ? 'No ambulances registered yet. Please contact us directly for emergency services.' : 'Items will be listed here once added by our team.'}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className={`mt-10 rounded-2xl p-8 text-center ${c.bg} border ${c.border}`}>
          <h3 className="font-bold text-slate-800 mb-2">Need this service?</h3>
          <p className="text-sm text-slate-500 mb-4">Register as a patient to book appointments and access our services online.</p>
          <button onClick={() => setView('signup')} className="btn-primary"><CalendarClock size={18} /> Book Appointment</button>
        </div>
      </div>
    </div>
  );
}

// ============ Department Detail Page ============
function DepartmentDetailPage({ dept, setView }: { dept: DeptDetail; setView: (v: View) => void }) {
  const Icon = dept.icon;
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('staff').select('*').eq('role', 'Doctor').eq('department', dept.name).eq('status', 'Active').then(({ data }) => {
      setDoctors(data || []);
      setLoading(false);
    });
  }, [dept.name]);

  return (
    <div className="min-h-screen bg-white">
      <NavBar setView={setView} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="bg-brand-50 rounded-3xl p-8 mb-8 flex items-center gap-5">
          <div className="w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Icon className="text-white" size={36} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{dept.name}</h1>
            <p className="text-slate-600 mt-1">{dept.desc}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
          <h2 className="font-bold text-slate-800 mb-4 text-lg">Services Offered</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {dept.services.map((s) => (
              <div key={s} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
                  <Stethoscope size={16} className="text-brand-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h2 className="font-bold text-slate-800 mb-4 text-lg">Our Doctors</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-8">
              <Stethoscope size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No doctors listed yet for this department. Register and book an appointment to get started.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-700 flex-shrink-0">
                    {doc.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.qualification || 'Specialist'}</p>
                    {doc.consultation_fee && <p className="text-xs text-slate-400">₹{doc.consultation_fee} consultation</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => setView('signup')} className="btn-primary"><CalendarClock size={18} /> Book Appointment</button>
        </div>
      </div>
    </div>
  );
}

// ============ Auth Page ============
function AuthPage({
  mode,
  setView,
  signIn,
  signUp,
}: {
  mode: 'signin' | 'signup';
  setView: (v: View) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: 'patient', phone?: string) => Promise<{ error: string | null }>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password, fullName, 'patient', phone);
      if (error) setError(error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-brand-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => setView('home')} className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-600/20">
              <Building2 className="text-white" size={28} />
            </div>
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            {mode === 'signin' ? 'Welcome Back' : 'Patient Registration'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'signin' ? 'Sign in to access your dashboard' : 'Register to book appointments and access our services'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
            <button onClick={() => setView('login')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'signin' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>Sign In</button>
            <button onClick={() => setView('signup')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'signup' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="input pl-10" placeholder="Enter your name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="input pl-10" placeholder="Your phone number" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" className="input pl-10" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="••••••••" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Patient Account'}
            </button>
          </form>
          {mode === 'signup' && (
            <p className="text-xs text-slate-400 text-center mt-4">
              Patient accounts can book appointments and view records. Staff accounts are created by the administrator.
            </p>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          <button onClick={() => setView('home')} className="hover:text-brand-600 transition-colors">← Back to home</button>
        </p>
      </div>
    </div>
  );
}
