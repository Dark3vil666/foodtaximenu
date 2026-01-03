import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, ShoppingCart, Plus, Minus, Star, Clock, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  rating: number;
  deliveryTime: string;
  image: string;
  menu: MenuItem[];
}

const restaurants: Restaurant[] = [
  {
    id: 'kod-ruze',
    name: 'Kod Ruže',
    description: 'Tradicionalna hrvatska kuhinja s modernim pristupom',
    rating: 4.8,
    deliveryTime: '30-45 min',
    image: '🌹',
    menu: [
      { id: 'kr1', name: 'Čobanac', description: 'Tradicionalni slavonski paprikaš s tri vrste mesa', price: 9.50, category: 'main' },
      { id: 'kr2', name: 'Kulen narezak', description: 'Domaći kulen s kiselim krastavcima', price: 7.00, category: 'starter' },
      { id: 'kr3', name: 'Fiš paprikaš', description: 'Riblji paprikaš s domaćim rezancima', price: 11.00, category: 'main' },
      { id: 'kr4', name: 'Štrukle', description: 'Domaće štrukle sa sirom', price: 4.50, category: 'dessert' },
      { id: 'kr5', name: 'Sarma', description: 'Kiseli kupus punjen mljevenim mesom', price: 8.50, category: 'main' },
    ],
  },
  {
    id: 'rustika',
    name: 'Rustika',
    description: 'Rustikalni ambijent s najboljim mesnim jelima',
    rating: 4.6,
    deliveryTime: '35-50 min',
    image: '🍖',
    menu: [
      { id: 'ru1', name: 'Ćevapi 10kom', description: 'S lukom i kajmakom', price: 7.00, category: 'main' },
      { id: 'ru2', name: 'Pljeskavica', description: 'XXL pljeskavica punjenja sira', price: 8.50, category: 'main' },
      { id: 'ru3', name: 'Ražnjići', description: 'Svinjski ražnjići s prilogom', price: 9.00, category: 'main' },
      { id: 'ru4', name: 'Uštipci', description: 'Topli uštipci sa sirom', price: 4.00, category: 'starter' },
      { id: 'ru5', name: 'Palačinke', description: 'S nutellom i bananom', price: 3.50, category: 'dessert' },
    ],
  },
  {
    id: 'mcdonalds',
    name: 'McDonald\'s',
    description: 'Brza hrana koju svi vole',
    rating: 4.2,
    deliveryTime: '20-30 min',
    image: '🍔',
    menu: [
      { id: 'mc1', name: 'Big Mac', description: 'Klasični Big Mac burger', price: 5.90, category: 'main' },
      { id: 'mc2', name: 'McChicken', description: 'Hrskava piletina s majonezom', price: 4.90, category: 'main' },
      { id: 'mc3', name: 'Chicken McNuggets 9kom', description: 'Hrskavi komadići piletine', price: 5.50, category: 'main' },
      { id: 'mc4', name: 'Pommes Frites', description: 'Veliki pomfrit', price: 2.30, category: 'side' },
      { id: 'mc5', name: 'McFlurry', description: 'Sladoled s Oreo keksima', price: 2.90, category: 'dessert' },
      { id: 'mc6', name: 'Happy Meal', description: 'Dječji meni s igračkom', price: 4.50, category: 'main' },
    ],
  },
  {
    id: 'pizzeria-roma',
    name: 'Pizzeria Roma',
    description: 'Autentične talijanske pizze pečene na drva',
    rating: 4.7,
    deliveryTime: '25-40 min',
    image: '🍕',
    menu: [
      { id: 'pr1', name: 'Margherita', description: 'Rajčica, mozzarella, bosiljak', price: 5.90, category: 'main' },
      { id: 'pr2', name: 'Capricciosa', description: 'Šunka, šampinjoni, masline, artičoke', price: 7.20, category: 'main' },
      { id: 'pr3', name: 'Quattro Formaggi', description: 'Četiri vrste sira', price: 7.50, category: 'main' },
      { id: 'pr4', name: 'Calzone', description: 'Preklopljena pizza sa šunkom i sirom', price: 6.90, category: 'main' },
      { id: 'pr5', name: 'Tiramisu', description: 'Domaći talijanski desert', price: 4.20, category: 'dessert' },
    ],
  },
  {
    id: 'sushi-bar',
    name: 'Sushi Bar Osijek',
    description: 'Svježi sushi i japanska jela',
    rating: 4.5,
    deliveryTime: '35-45 min',
    image: '🍣',
    menu: [
      { id: 'sb1', name: 'Salmon Nigiri 6kom', description: 'Svježi losos na riži', price: 8.50, category: 'main' },
      { id: 'sb2', name: 'California Roll 8kom', description: 'Krastavac, avokado, surimi', price: 7.20, category: 'main' },
      { id: 'sb3', name: 'Spicy Tuna Roll', description: 'Ljuti tuna roll', price: 8.10, category: 'main' },
      { id: 'sb4', name: 'Miso Juha', description: 'Tradicionalna japanska juha', price: 2.90, category: 'starter' },
      { id: 'sb5', name: 'Edamame', description: 'Kuhani sojini mahune', price: 2.30, category: 'starter' },
    ],
  },
];

const FoodDelivery = () => {
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.item.id !== itemId);
    });
  };

  const totalPrice = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const deliveryFee = 2.00;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-accent/30 bg-card/80 backdrop-blur-xl">
          <CardContent className="pt-8 text-center">
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Utensils className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Narudžba zaprimljena!</h2>
            <p className="text-muted-foreground mb-6">
              Vaša hrana stiže za {selectedRestaurant?.deliveryTime || '30-45 min'}.
            </p>
            <div className="space-y-2 text-sm text-left bg-muted/50 p-4 rounded-lg mb-6">
              <p><strong>Restoran:</strong> {selectedRestaurant?.name}</p>
              <p><strong>Adresa:</strong> {address}</p>
              <p><strong>Ukupno:</strong> {(totalPrice + deliveryFee).toFixed(2)} €</p>
              <div className="pt-2 border-t border-border mt-2">
                <p className="font-medium mb-1">Narudžba:</p>
                {cart.map((c) => (
                  <p key={c.item.id} className="text-muted-foreground">
                    {c.quantity}x {c.item.name} - {(c.item.price * c.quantity).toFixed(2)} €
                  </p>
                ))}
              </div>
            </div>
            <Button 
              onClick={() => navigate('/')}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Povratak na početnu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-accent/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => selectedRestaurant ? setSelectedRestaurant(null) : navigate('/')}
              className="text-accent hover:bg-accent/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {selectedRestaurant ? selectedRestaurant.name : 'Dostava Hrane'}
              </h1>
              <p className="text-sm text-muted-foreground">031 — Osječki Taxi Food</p>
            </div>
          </div>
          
          {/* Cart Badge */}
          {cart.length > 0 && (
            <Badge className="bg-accent text-accent-foreground">
              <ShoppingCart className="w-4 h-4 mr-1" />
              {cart.reduce((sum, c) => sum + c.quantity, 0)} | {totalPrice.toFixed(2)} €
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!selectedRestaurant ? (
          /* Restaurant List */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <Card 
                key={restaurant.id}
                className="cursor-pointer border-accent/20 bg-card/50 backdrop-blur-sm hover:border-accent/50 transition-all hover:scale-[1.02]"
                onClick={() => setSelectedRestaurant(restaurant)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{restaurant.image}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{restaurant.description}</p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          {restaurant.rating}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {restaurant.deliveryTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Restaurant Menu & Cart */
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Menu */}
            <div className="lg:col-span-2">
              <Card className="border-accent/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <span className="text-3xl">{selectedRestaurant.image}</span>
                    Jelovnik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all">
                    <TabsList className="mb-4 bg-muted/50">
                      <TabsTrigger value="all">Sve</TabsTrigger>
                      <TabsTrigger value="main">Glavna jela</TabsTrigger>
                      <TabsTrigger value="starter">Predjela</TabsTrigger>
                      <TabsTrigger value="dessert">Deserti</TabsTrigger>
                    </TabsList>
                    
                    {['all', 'main', 'starter', 'dessert', 'side'].map((category) => (
                      <TabsContent key={category} value={category} className="space-y-3">
                        {selectedRestaurant.menu
                          .filter((item) => category === 'all' || item.category === category)
                          .map((item) => {
                            const cartItem = cart.find((c) => c.item.id === item.id);
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1">
                                  <h4 className="font-medium text-foreground">{item.name}</h4>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                  <p className="text-accent font-bold mt-1">{item.price.toFixed(2)} €</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {cartItem ? (
                                    <>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8 border-accent/30"
                                        onClick={() => removeFromCart(item.id)}
                                      >
                                        <Minus className="w-4 h-4" />
                                      </Button>
                                      <span className="w-8 text-center font-medium text-foreground">
                                        {cartItem.quantity}
                                      </span>
                                      <Button
                                        size="icon"
                                        className="h-8 w-8 bg-accent hover:bg-accent/90"
                                        onClick={() => addToCart(item)}
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                                      onClick={() => addToCart(item)}
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Dodaj
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Cart & Checkout */}
            <div>
              <Card className="border-accent/20 bg-card/50 backdrop-blur-sm sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <ShoppingCart className="w-5 h-5" />
                    Košarica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Vaša košarica je prazna
                    </p>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Cart Items */}
                      <div className="space-y-2 pb-4 border-b border-border">
                          {cart.map((c) => (
                          <div key={c.item.id} className="flex justify-between text-sm">
                            <span className="text-foreground">
                              {c.quantity}x {c.item.name}
                            </span>
                            <span className="text-muted-foreground">
                              {(c.item.price * c.quantity).toFixed(2)} €
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm pt-2">
                          <span className="text-muted-foreground">Dostava</span>
                          <span className="text-muted-foreground">{deliveryFee.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2">
                          <span className="text-foreground">Ukupno</span>
                          <span className="text-accent">{(totalPrice + deliveryFee).toFixed(2)} €</span>
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="address" className="flex items-center gap-2 text-foreground">
                            <MapPin className="w-4 h-4 text-accent" />
                            Adresa dostave
                          </Label>
                          <Input
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Ulica i kućni broj..."
                            required
                            className="bg-background/50 border-accent/30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2 text-foreground">
                            <Phone className="w-4 h-4 text-accent" />
                            Telefon
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+385 99 123 4567"
                            required
                            className="bg-background/50 border-accent/30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-foreground">Napomena (opcionalno)</Label>
                          <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Npr. bez luka, treći kat..."
                            className="bg-background/50 border-accent/30 resize-none"
                            rows={2}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit"
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-5 font-semibold"
                        disabled={cart.length === 0}
                      >
                        Naruči ({(totalPrice + deliveryFee).toFixed(2)} €)
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FoodDelivery;
