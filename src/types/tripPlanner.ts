export interface TripParams {
  currentLocation: string;
  destination: string;
  destinations?: string[]; // Multiple destinations support
  startDate: string;
  endDate: string;
  travelers: number;
  budget?: string; // Made optional
  interests?: string[]; // Made optional
  planMode?: 'tickets' | 'sightseeing' | 'full';
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

export interface ItineraryHistoryItem {
  id: string;
  params: TripParams;
  response: TripResponse;
  createdAt: number;
}
