export interface TripParams {
  currentLocation: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: string;
  interests: string[];
}

export interface ItineraryStep {
  id: string;
  day: number;
  time: string;
  title: string;
  description: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  duration: string;
  category: 'transport' | 'accommodation' | 'activity' | 'food' | 'sightseeing';
  isBookable: boolean;
  estimatedCost?: number;
  bookingUrl?: string;
}

export interface TripResponse {
  title: string;
  reason: string;
  steps: ItineraryStep[];
}

export interface CartItem extends ItineraryStep {
  addedAt: number;
}
