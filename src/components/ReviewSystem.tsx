import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Send, CheckCircle, Quote, Loader2, AlertCircle } from 'lucide-react';

interface Review {
  id: string;
  patient_name: string;
  rating: number;
  review_text: string;
  department: string | null;
  created_at: string;
}

const DEPARTMENTS = [
  'General Medicine', 'Emergency Care', 'Cardiology', 'Orthopedics',
  'Pediatrics', 'Gynecology', 'ENT', 'Neurology', 'Dermatology',
  'Pharmacy', 'Laboratory', 'Other',
];

const AVATAR_GRADIENTS = [
  'from-rose-400 to-pink-500',
  'from-blue-400 to-cyan-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-sky-500',
  'from-teal-400 to-emerald-500',
];

export function ReviewSystem() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => { loadReviews(); }, []);

  async function loadReviews() {
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(12);
    setReviews(data || []);
    if (data && data.length > 0) {
      setAvgRating(data.reduce((sum, r) => sum + r.rating, 0) / data.length);
    }
    setLoading(false);
  }

  function getGradient(name: string) {
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
  }

  return (
    <div>
      {/* Header with rating summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl px-5 py-3 border border-amber-200">
            <span className="text-4xl font-extrabold text-amber-600">{avgRating.toFixed(1)}</span>
            <div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={star <= Math.round(avgRating) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}
                  />
                ))}
              </div>
              <p className="text-xs text-amber-700 font-medium mt-0.5">{reviews.length} reviews</p>
            </div>
          </div>
          <div className="hidden sm:block">
            <h3 className="text-lg font-bold text-slate-800">What Our Patients Say</h3>
            <p className="text-sm text-slate-500">Real reviews from real patients</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-brand-200 hover:shadow-xl hover:scale-105 transition-all"
        >
          {showForm ? 'Cancel' : <><Star size={18} /> Write a Review</>}
        </button>
      </div>

      {/* Review form */}
      {showForm && (
        <ReviewForm
          onClose={() => setShowForm(false)}
          onSubmitted={() => { setShowForm(false); loadReviews(); }}
        />
      )}

      {/* Reviews grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-brand-500" size={28} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-brand-50/50 rounded-2xl border border-slate-100">
          <Quote className="text-slate-300 mx-auto mb-3" size={36} />
          <p className="text-sm text-slate-400">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className={`review-card-enter stagger-${(index % 6) + 1} group relative bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brand-50 to-cyan-50 rounded-bl-3xl opacity-60 group-hover:opacity-100 transition-opacity" />
              <Quote className="absolute top-4 right-4 text-brand-200 group-hover:text-brand-300 transition-colors" size={28} />

              <div className="relative flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getGradient(review.patient_name)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                  {review.patient_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{review.patient_name}</p>
                  <p className="text-xs text-slate-400">{review.department || 'General'}</p>
                </div>
              </div>

              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={15}
                    className={star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}
                  />
                ))}
              </div>

              <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{review.review_text}</p>

              <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-50">
                {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewForm({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [form, setForm] = useState({ patient_name: '', rating: 5, review_text: '', department: 'General Medicine' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('reviews').insert({
      patient_name: form.patient_name,
      rating: form.rating,
      review_text: form.review_text,
      department: form.department,
      is_approved: true,
    });
    if (error) {
      setError(error.message);
    } else {
      onSubmitted();
    }
    setLoading(false);
  }

  return (
    <div className="mb-8 bg-gradient-to-br from-white to-brand-50/30 rounded-2xl p-6 border border-brand-100 shadow-lg animate-fade-in-down">
      <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
        <Star className="text-amber-500 fill-amber-500" size={20} /> Share Your Experience
      </h3>
      <p className="text-sm text-slate-500 mb-5">Your feedback helps us improve and helps others choose the right care.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Your Name *</label>
            <input className="input" placeholder="Full name" required value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Department Visited</label>
            <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Your Rating *</label>
          <div className="flex items-center gap-2 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setForm({ ...form, rating: star })}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-all hover:scale-125"
              >
                <Star
                  size={32}
                  className={star <= (hoverRating || form.rating) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-medium text-slate-600">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || form.rating]}
            </span>
          </div>
        </div>

        <div>
          <label className="label">Your Review *</label>
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder="Tell us about your experience..."
            required
            minLength={10}
            value={form.review_text}
            onChange={(e) => setForm({ ...form, review_text: e.target.value })}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Submit Review</>}
          </button>
        </div>
      </form>
    </div>
  );
}
