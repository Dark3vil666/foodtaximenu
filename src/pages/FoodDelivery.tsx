import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  image: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

const restaurants: Restaurant[] = [
  { id: '1', name: 'Slavonska Kuća', cuisine: 'Croatian Traditional', rating: 4.8, deliveryTime: '25-35 min', image: '🏠' },
  { id: '2', name: 'Kod Ruže', cuisine: 'Local Favorites', rating: 4.6, deliveryTime: '20-30 min', image: '🌹' },
  { id: '3', name: 'Pizzeria Galija', cuisine: 'Italian Pizza', rating: 4.5, deliveryTime: '30-40 min', image: '🍕' },
  { id: '4', name: 'Drava Grill', cuisine: 'BBQ & Grills', rating: 4.7, deliveryTime: '35-45 min', image: '🔥' },
  { id: '5', name: 'Osijek Burger Bar', cuisine: 'Burgers & Fries', rating: 4.4, deliveryTime: '20-30 min', image: '🍔' },
  { id: '6', name: 'Tvrđa Bistro', cuisine: 'Modern European', rating: 4.9, deliveryTime: '40-50 min', image: '🍽️' },
];

const menuItems: Record<string, MenuItem[]> = {
  '1': [
    { id: 'm1', name: 'Slavonski Čobanac', description: 'Traditional paprika stew with mixed meats', price: 75 },
    { id: 'm2', name: 'Fiš Paprikaš', description: 'River fish stew with homemade noodles', price: 85 },
    { id: 'm3', name: 'Kulen Plate', description: 'Assorted Slavonian sausages with sides', price: 65 },
  ],
  '2': [
    { id: 'm4', name: 'Ćevapi Portion', description: '10 pieces with onion and lepinja bread', price: 55 },
    { id: 'm5', name: 'Mixed Grill', description: 'Selection of grilled meats', price: 90 },
  ],
  '3': [
    { id: 'm6', name: 'Margherita', description: 'Classic tomato and mozzarella', price: 45 },
    { id: 'm7', name: 'Quattro Stagioni', description: 'Four seasons pizza', price: 55 },
    { id: 'm8', name: 'Slavonska Pizza', description: 'With kulen and local cheese', price: 60 },
  ],
  '4': [
    { id: 'm9', name: 'BBQ Ribs', description: 'Slow-cooked pork ribs with sauce', price: 95 },
    { id: 'm10', name: 'Mixed BBQ Platter', description: 'For 2 persons, assorted meats', price: 150 },
  ],
  '5': [
    { id: 'm11', name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, cheese', price: 48 },
    { id: 'm12', name: 'Drava Burger', description: 'Double patty with bacon and special sauce', price: 62 },
  ],
  '6': [
    { id: 'm13', name: 'Duck Breast', description: 'With berry reduction and vegetables', price: 120 },
    { id: 'm14', name: 'Risotto Tvrđa', description: 'Truffle and mushroom risotto', price: 85 },
  ],
};

const FoodDelivery = () => {
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'restaurants' | 'menu' | 'checkout'>('restaurants');
  const [formData, setFormData] = useState({
    address: '',
    allergyNotes: '',
    paymentMethod: 'cash',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setStep('menu');
  };

  const handleAddItem = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      if (newItems[itemId] > 1) {
        newItems[itemId]--;
      } else {
        delete newItems[itemId];
      }
      return newItems;
    });
  };

  const getTotal = () => {
    if (!selectedRestaurant) return 0;
    const menu = menuItems[selectedRestaurant.id] || [];
    return Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
      const item = menu.find(m => m.id === itemId);
      return sum + (item?.price || 0) * qty;
    }, 0);
  };

  const handleCheckout = () => {
    if (Object.keys(selectedItems).length > 0) {
      setStep('checkout');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/20 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
          <h2 className="font-display text-2xl text-foreground mb-4">Order Confirmed!</h2>
          <p className="text-muted-foreground mb-2">
            Your food is being prepared at <span className="text-secondary">{selectedRestaurant?.name}</span>
          </p>
          <p className="text-muted-foreground mb-6">
            Estimated delivery: {selectedRestaurant?.deliveryTime}
          </p>
          <Button onClick={() => navigate('/')} className="w-full bg-secondary hover:bg-secondary/90">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-background to-secondary/10 pointer-events-none" />
      
      {/* Animated background elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <button 
          onClick={() => {
            if (step === 'checkout') setStep('menu');
            else if (step === 'menu') setStep('restaurants');
            else navigate('/');
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-body">
            {step === 'checkout' ? 'Back to menu' : step === 'menu' ? 'Back to restaurants' : 'Back to portal'}
          </span>
        </button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
            <span className="font-display text-sm tracking-[0.3em] text-secondary">OSJEČKI TAXI FOOD</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-neon">
              {step === 'restaurants' && 'Choose Restaurant'}
              {step === 'menu' && selectedRestaurant?.name}
              {step === 'checkout' && 'Complete Order'}
            </span>
          </h1>
          {step === 'restaurants' && (
            <p className="font-body text-lg text-muted-foreground">
              Fast food delivery across Osijek
            </p>
          )}
        </div>

        {/* Restaurant List */}
        {step === 'restaurants' && (
          <div className="grid md:grid-cols-2 gap-4">
            {restaurants.map(restaurant => (
              <button
                key={restaurant.id}
                onClick={() => handleRestaurantSelect(restaurant)}
                className="glass-panel rounded-2xl p-6 text-left hover:border-secondary/50 transition-all hover:scale-[1.02] group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-secondary/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {restaurant.image}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl text-foreground mb-1">{restaurant.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{restaurant.cuisine}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-secondary">★ {restaurant.rating}</span>
                      <span className="text-muted-foreground">{restaurant.deliveryTime}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Menu */}
        {step === 'menu' && selectedRestaurant && (
          <>
            <div className="space-y-4 mb-8">
              {(menuItems[selectedRestaurant.id] || []).map(item => (
                <div key={item.id} className="glass-panel rounded-xl p-5 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-foreground">{item.name}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                    <p className="text-secondary font-semibold mt-1">{item.price} HRK</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedItems[item.id] ? (
                      <>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                        >
                          -
                        </button>
                        <span className="font-display w-6 text-center">{selectedItems[item.id]}</span>
                        <button 
                          onClick={() => handleAddItem(item.id)}
                          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors text-secondary-foreground"
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => handleAddItem(item.id)} 
                        variant="outline" 
                        size="sm"
                        className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(selectedItems).length > 0 && (
              <div className="glass-panel rounded-2xl p-6 sticky bottom-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total</p>
                    <p className="font-display text-2xl text-foreground">{getTotal()} HRK</p>
                  </div>
                  <Button onClick={handleCheckout} className="bg-secondary hover:bg-secondary/90 px-8">
                    Checkout
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Checkout */}
        {step === 'checkout' && (
          <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="font-display text-sm tracking-wider">Delivery Address</Label>
                <Input
                  id="address"
                  placeholder="e.g., Županijska 4, Osijek"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                  className="h-12 bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergy" className="font-display text-sm tracking-wider">Allergy Notes (Optional)</Label>
                <Textarea
                  id="allergy"
                  placeholder="Any allergies or dietary restrictions?"
                  value={formData.allergyNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergyNotes: e.target.value }))}
                  className="min-h-[80px] bg-background/50"
                />
              </div>

              <div className="space-y-3">
                <Label className="font-display text-sm tracking-wider">Payment Method</Label>
                <RadioGroup 
                  value={formData.paymentMethod} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, paymentMethod: val }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="cursor-pointer">Cash on Delivery</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="cursor-pointer">Card on Delivery</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{getTotal()} HRK</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-muted-foreground">Delivery</span>
                <span>15 HRK</span>
              </div>
              <div className="flex justify-between text-xl font-display">
                <span>Total</span>
                <span className="text-secondary">{getTotal() + 15} HRK</span>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 font-display text-lg tracking-wider bg-secondary hover:bg-secondary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                'Place Order'
              )}
            </Button>
          </form>
        )}
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

export default FoodDelivery;
