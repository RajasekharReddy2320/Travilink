import React, { useState } from 'react';
import { TripParams } from '@/types/tripPlanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Wallet, MapPin, Loader2, X } from 'lucide-react';

interface InputFormProps {
  onSubmit: (params: TripParams) => void;
  isLoading: boolean;
}

const interestOptions = [
  'Adventure', 'Culture', 'Food', 'Nature', 'Relaxation', 
  'Shopping', 'Nightlife', 'History', 'Art', 'Sports'
];

const budgetOptions = ['Budget', 'Mid-Range', 'Luxury'];

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [currentLocation, setCurrentLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState('Mid-Range');
  const [interests, setInterests] = useState<string[]>(['Culture', 'Food']);

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocation || !destination || !startDate || !endDate) return;
    onSubmit({ currentLocation, destination, startDate, endDate, travelers, budget, interests });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-2xl mx-auto mb-10 shadow-sm">
      {/* Current Location */}
      <div className="mb-6">
        <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          Current Location (Departure City)
        </Label>
        <Input
          type="text"
          placeholder="e.g., Mumbai, India"
          value={currentLocation}
          onChange={(e) => setCurrentLocation(e.target.value)}
          className="bg-background"
          required
        />
      </div>

      {/* Destination */}
      <div className="mb-6">
        <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-destructive" />
          Destination
        </Label>
        <Input
          type="text"
          placeholder="e.g., Paris, France"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="bg-background"
          required
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Start Date
          </Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-background"
            required
          />
        </div>
        <div>
          <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            End Date
          </Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-background"
            required
          />
        </div>
      </div>

      {/* Travelers */}
      <div className="mb-6">
        <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Users size={16} className="text-primary" />
          Number of Travelers
        </Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTravelers(Math.max(1, travelers - 1))}
          >
            -
          </Button>
          <span className="text-lg font-bold w-8 text-center">{travelers}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTravelers(travelers + 1)}
          >
            +
          </Button>
        </div>
      </div>

      {/* Budget */}
      <div className="mb-6">
        <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Wallet size={16} className="text-primary" />
          Budget Level
        </Label>
        <div className="flex gap-2">
          {budgetOptions.map((option) => (
            <Button
              key={option}
              type="button"
              variant={budget === option ? "default" : "outline"}
              size="sm"
              onClick={() => setBudget(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="mb-8">
        <Label className="text-sm font-semibold text-foreground mb-3 block">
          Interests
        </Label>
        <div className="flex flex-wrap gap-2">
          {interestOptions.map((interest) => (
            <Badge
              key={interest}
              variant={interests.includes(interest) ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => toggleInterest(interest)}
            >
              {interest}
              {interests.includes(interest) && <X size={12} className="ml-1" />}
            </Badge>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading || !currentLocation || !destination || !startDate || !endDate}
        className="w-full py-6 text-lg font-bold"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating Your Trip...
          </>
        ) : (
          'Plan My Trip'
        )}
      </Button>
    </form>
  );
};

export default InputForm;
