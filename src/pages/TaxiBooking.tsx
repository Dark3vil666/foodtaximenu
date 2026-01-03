import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, CreditCard, Phone, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TaxiBooking = () => {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/30 bg-card/80 backdrop-blur-xl">
          <CardContent className="pt-8 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Narudžba zaprimljena!</h2>
            <p className="text-muted-foreground mb-6">
              Vaš taxi stiže za nekoliko minuta. Vozač će vas kontaktirati.
            </p>
            <div className="space-y-2 text-sm text-left bg-muted/50 p-4 rounded-lg mb-6">
              <p><strong>Polazište:</strong> {pickup}</p>
              <p><strong>Odredište:</strong> {destination}</p>
              <p><strong>Putnici:</strong> {passengers}</p>
              <p><strong>Plaćanje:</strong> {paymentMethod === 'cash' ? 'Gotovina' : 'Kartica'}</p>
            </div>
            <Button 
              onClick={() => navigate('/')}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Povratak na početnu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Taxi Narudžba</h1>
            <p className="text-sm text-muted-foreground">031 — Osječki Taxi</p>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Car className="w-6 h-6" />
              Naruči Taxi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pickup Location */}
              <div className="space-y-2">
                <Label htmlFor="pickup" className="flex items-center gap-2 text-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  Polazište
                </Label>
                <Input
                  id="pickup"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Unesite adresu polazišta..."
                  required
                  className="bg-background/50 border-primary/30 focus:border-primary"
                />
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center gap-2 text-foreground">
                  <MapPin className="w-4 h-4 text-accent" />
                  Odredište
                </Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Unesite adresu odredišta..."
                  required
                  className="bg-background/50 border-primary/30 focus:border-primary"
                />
              </div>

              {/* Schedule Time */}
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2 text-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  Vrijeme polaska (opcionalno)
                </Label>
                <Input
                  id="time"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-background/50 border-primary/30 focus:border-primary"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  Broj telefona
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+385 99 123 4567"
                  required
                  className="bg-background/50 border-primary/30 focus:border-primary"
                />
              </div>

              {/* Number of Passengers */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  Broj putnika
                </Label>
                <RadioGroup value={passengers} onValueChange={setPassengers} className="flex flex-wrap gap-3">
                  {['1', '2', '3', '4', '5+'].map((num) => (
                    <div key={num} className="flex items-center">
                      <RadioGroupItem 
                        value={num} 
                        id={`passengers-${num}`} 
                        className="border-primary text-primary"
                      />
                      <Label 
                        htmlFor={`passengers-${num}`} 
                        className="ml-2 cursor-pointer text-foreground"
                      >
                        {num}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Način plaćanja
                </Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="flex gap-4">
                  <div className="flex items-center">
                    <RadioGroupItem 
                      value="cash" 
                      id="cash" 
                      className="border-primary text-primary"
                    />
                    <Label htmlFor="cash" className="ml-2 cursor-pointer text-foreground">Gotovina</Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem 
                      value="card" 
                      id="card" 
                      className="border-primary text-primary"
                    />
                    <Label htmlFor="card" className="ml-2 cursor-pointer text-foreground">Kartica</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold"
              >
                Naruči Taxi
              </Button>

              {/* Quick Call */}
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground mb-2">Ili nazovite direktno:</p>
                <a 
                  href="tel:031200200" 
                  className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  031 200 200
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TaxiBooking;
