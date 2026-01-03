import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TaxiBooking = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    passengers: '1',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl text-foreground mb-4">Taxi Ordered!</h2>
          <p className="text-muted-foreground mb-6">
            Your taxi is on the way. A driver will contact you shortly.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 pointer-events-none" />
      
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 container max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-body">Back to portal</span>
        </button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-display text-sm tracking-[0.3em] text-primary">031 — OSJEČKI TAXI</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gradient-neon mb-4">
            Book Your Ride
          </h1>
          <p className="font-body text-lg text-muted-foreground">
            Premium taxi service in Osijek, available 24/7
          </p>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from" className="font-display text-sm tracking-wider">Pickup Location</Label>
              <Input
                id="from"
                placeholder="e.g., Trg Ante Starčevića, Osijek"
                value={formData.from}
                onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                required
                className="h-12 bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to" className="font-display text-sm tracking-wider">Drop-off Location</Label>
              <Input
                id="to"
                placeholder="e.g., Gornji Grad, Osijek"
                value={formData.to}
                onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                required
                className="h-12 bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passengers" className="font-display text-sm tracking-wider">Number of Passengers</Label>
              <Select value={formData.passengers} onValueChange={(val) => setFormData(prev => ({ ...prev, passengers: val }))}>
                <SelectTrigger className="h-12 bg-background/50">
                  <SelectValue placeholder="Select passengers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Passenger</SelectItem>
                  <SelectItem value="2">2 Passengers</SelectItem>
                  <SelectItem value="3">3 Passengers</SelectItem>
                  <SelectItem value="4">4 Passengers</SelectItem>
                  <SelectItem value="5">5+ Passengers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="font-display text-sm tracking-wider">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requests? e.g., wheelchair access, child seat..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="min-h-[100px] bg-background/50"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-14 font-display text-lg tracking-wider"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Ordering...</span>
                </div>
              ) : (
                'Order Taxi'
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Or call us directly at <span className="text-primary font-semibold">031 200 200</span>
          </p>
        </form>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { icon: '⚡', label: 'Fast Pickup' },
            { icon: '💳', label: 'Card Accepted' },
            { icon: '🌙', label: '24/7 Service' },
          ].map((feature, idx) => (
            <div key={idx} className="glass-panel rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <span className="font-body text-sm text-muted-foreground">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, hsl(var(--dark-navy)) 100%)',
        }}
      />
    </div>
  );
};

export default TaxiBooking;
