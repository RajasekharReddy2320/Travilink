import { Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Train, Bus, Hotel } from "lucide-react";

interface TimelineBooking {
  id: string;
  booking_type: string;
  service_name: string;
  service_number: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  status: string;
}

interface TripTimelineProps {
  bookings: TimelineBooking[];
}

const getIcon = (type: string) => {
  switch (type) {
    case 'flight': return Plane;
    case 'train': return Train;
    case 'bus': return Bus;
    case 'hotel': return Hotel;
    default: return MapPin;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-500';
    case 'cancelled': return 'bg-red-500';
    case 'completed': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

export default function TripTimeline({ bookings }: TripTimelineProps) {
  // Sort bookings by date and time
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = new Date(`${a.departure_date}T${a.departure_time}`);
    const dateB = new Date(`${b.departure_date}T${b.departure_time}`);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Trip Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-6">
            {sortedBookings.map((booking, index) => {
              const Icon = getIcon(booking.booking_type);
              const departureDate = new Date(booking.departure_date);
              
              return (
                <div key={booking.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{booking.service_name}</h4>
                        <p className="text-sm text-muted-foreground">{booking.service_number}</p>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{departureDate.toLocaleDateString('en-IN', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {booking.departure_time} - {booking.arrival_time}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.from_location} → {booking.to_location}</span>
                      </div>
                    </div>
                    
                    {index < sortedBookings.length - 1 && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        {(() => {
                          const nextBooking = sortedBookings[index + 1];
                          const currentArrival = new Date(`${booking.departure_date}T${booking.arrival_time}`);
                          const nextDeparture = new Date(`${nextBooking.departure_date}T${nextBooking.departure_time}`);
                          const layoverMs = nextDeparture.getTime() - currentArrival.getTime();
                          const layoverHours = Math.floor(layoverMs / (1000 * 60 * 60));
                          const layoverMinutes = Math.floor((layoverMs % (1000 * 60 * 60)) / (1000 * 60));
                          
                          return (
                            <span>
                              ⏱ Layover: {layoverHours}h {layoverMinutes}m at {booking.to_location}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
