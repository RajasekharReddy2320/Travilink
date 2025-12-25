import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Train, Bus, Hotel, QrCode, Download, Calendar, MapPin, User, ScanLine, X, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import QRScanner from "@/components/QRScanner";
import TripTimeline from "@/components/TripTimeline";
import TripSharingDialog from "@/components/TripSharingDialog";

export default function MyTickets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "flight" | "train" | "bus" | "hotel">("all");
  const [activeTab, setActiveTab] = useState<"tickets" | "scanner">("tickets");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('MyTickets: Fetching bookings for user:', user?.id, 'Error:', userError);
      
      if (!user || userError) {
        console.log('MyTickets: No user found, redirecting to login');
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('MyTickets: Fetched bookings:', data?.length || 0, 'bookings', 'Error:', error);

      if (error) {
        console.error('MyTickets: Database error:', error);
        throw error;
      }
      
      setBookings(data || []);
    } catch (error: any) {
      console.error('MyTickets: Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load your tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'flight': return Plane;
      case 'train': return Train;
      case 'bus': return Bus;
      case 'hotel': return Hotel;
      default: return MapPin;
    }
  };

  const filteredBookings = filter === "all" ? bookings : bookings.filter(b => b.booking_type === filter);

  // Group bookings by trip_group_id
  const groupedBookings = filteredBookings.reduce((acc: any, booking: any) => {
    const groupId = booking.trip_group_id || booking.id;
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(booking);
    return acc;
  }, {});

  const tripGroups = Object.values(groupedBookings) as any[][];

  const handleViewTicket = (booking: any) => {
    navigate('/ticket-details', { state: { booking } });
  };

  const handleCancelTrip = async (booking: any) => {
    try {
      // Cancel all bookings with the same trip_group_id
      if (booking.trip_group_id) {
        const { error } = await supabase
          .from('bookings')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('trip_group_id', booking.trip_group_id);

        if (error) throw error;
      } else {
        // Cancel single booking
        const { error } = await supabase
          .from('bookings')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (error) throw error;
      }

      toast({
        title: "Trip Cancelled",
        description: booking.trip_group_id 
          ? "All bookings in this trip have been cancelled successfully"
          : "Your booking has been cancelled successfully",
      });

      fetchBookings();
    } catch (error: any) {
      console.error('Error cancelling trip:', error);
      toast({
        title: "Error",
        description: "Failed to cancel trip",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant={activeTab === "tickets" ? "default" : "outline"}
            onClick={() => setActiveTab("tickets")}
            className="gap-2"
          >
            <QrCode className="h-4 w-4" />
            My Tickets
          </Button>
          <Button
            variant={activeTab === "scanner" ? "default" : "outline"}
            onClick={() => setActiveTab("scanner")}
            className="gap-2"
          >
            <ScanLine className="h-4 w-4" />
            QR Scanner
          </Button>
        </div>

        {activeTab === "scanner" ? (
          <QRScanner />
        ) : (
          <>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
                <p className="text-muted-foreground">View and manage your bookings</p>
              </div>
              
              <div className="flex gap-4 items-center flex-wrap">
                {/* View Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "timeline" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("timeline")}
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Timeline
                  </Button>
                </div>
                
                {/* Filter Buttons */}
                <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "flight" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("flight")}
                  className="gap-2"
                >
                  <Plane className="h-4 w-4" />
                  <span className="hidden sm:inline">Flights</span>
                </Button>
                <Button
                  variant={filter === "train" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("train")}
                  className="gap-2"
                >
                  <Train className="h-4 w-4" />
                  <span className="hidden sm:inline">Trains</span>
                </Button>
                <Button
                  variant={filter === "bus" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("bus")}
                  className="gap-2"
                >
                  <Bus className="h-4 w-4" />
                  <span className="hidden sm:inline">Buses</span>
                </Button>
                <Button
                  variant={filter === "hotel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("hotel")}
                  className="gap-2"
                >
                  <Hotel className="h-4 w-4" />
                  <span className="hidden sm:inline">Hotels</span>
                </Button>
              </div>
              </div>
            </div>

            {/* Timeline View */}
            {viewMode === "timeline" && filteredBookings.length > 0 && (
              <div className="mb-8">
                {tripGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="mb-6">
                    {group[0].trip_group_id && (
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          Trip Package - {new Date(group[0].departure_date).toLocaleDateString('en-IN')}
                        </h3>
                        <TripSharingDialog tripGroupId={group[0].trip_group_id} />
                      </div>
                    )}
                    <TripTimeline bookings={group} />
                  </div>
                ))}
              </div>
            )}

        {viewMode === "grid" && (
          <div className="space-y-4">
          {tripGroups.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Plane className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">No tickets found</h3>
                    <p className="text-muted-foreground mb-4">
                      {filter === "all" 
                        ? "Start planning your next adventure!"
                        : `No ${filter} bookings found`}
                    </p>
                    <Button onClick={() => navigate("/book-transport")}>Book a Trip</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            tripGroups.map((group, groupIndex) => {
              const isMultiBooking = group.length > 1;
              const totalPrice = group.reduce((sum, b) => sum + parseFloat(b.price_inr), 0);
              const firstBooking = group[0];
              
              return (
                <Card key={groupIndex} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        {isMultiBooking ? (
                          <>
                            <h3 className="font-semibold text-lg">Complete Trip Package</h3>
                            <p className="text-sm text-muted-foreground">{group.length} bookings</p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                {(() => {
                                  const Icon = getIcon(firstBooking.booking_type);
                                  return <Icon className="h-5 w-5 text-primary" />;
                                })()}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{firstBooking.service_name}</h3>
                                <p className="text-sm text-muted-foreground">{firstBooking.service_number}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(firstBooking.status)}>
                          {firstBooking.status}
                        </Badge>
                        <Badge className={getPaymentStatusColor(firstBooking.payment_status)}>
                          {firstBooking.payment_status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isMultiBooking && (
                      <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-3">Your trip includes:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {group.map((booking, idx) => {
                            const Icon = getIcon(booking.booking_type);
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-primary" />
                                <span className="text-sm capitalize">{booking.booking_type}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {group.map((booking, idx) => {
                        const Icon = getIcon(booking.booking_type);
                        return (
                          <div key={booking.id} className={isMultiBooking ? "p-4 border rounded-lg" : ""}>
                            {isMultiBooking && (
                              <div className="flex items-center gap-2 mb-3">
                                <Icon className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold">{booking.service_name}</h4>
                                <span className="text-sm text-muted-foreground">({booking.service_number})</span>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-muted-foreground">From</p>
                                  <p className="font-medium">{booking.from_location}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-muted-foreground">To</p>
                                  <p className="font-medium">{booking.to_location}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Date</p>
                                  <p className="font-medium">
                                    {new Date(booking.departure_date).toLocaleDateString('en-IN')}
                                  </p>
                                </div>
                              </div>
                              {!isMultiBooking && (
                                <div className="flex items-start gap-2">
                                  <User className="h-4 w-4 mt-1 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Passenger</p>
                                    <p className="font-medium">{booking.passenger_name}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {isMultiBooking && (
                              <div className="mt-3 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Booking Ref:</span>
                                <span className="font-mono">{booking.booking_reference}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="text-2xl font-bold">₹{totalPrice.toLocaleString("en-IN")}</p>
                        </div>
                        {isMultiBooking && firstBooking.trip_group_id && (
                          <TripSharingDialog tripGroupId={firstBooking.trip_group_id} />
                        )}
                        {!isMultiBooking && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Booking Ref</p>
                            <p className="font-mono font-medium">{firstBooking.booking_reference}</p>
                          </div>
                        )}
                        {isMultiBooking && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Passenger</p>
                            <p className="font-medium">{firstBooking.passenger_name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewTicket(firstBooking)}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        View {isMultiBooking ? 'Tickets' : 'QR Code'}
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Download {isMultiBooking ? 'All Tickets' : 'Ticket'}
                      </Button>
                      {firstBooking.status === 'confirmed' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Trip?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this booking? This action cannot be undone.
                                {isMultiBooking && ' All bookings in this trip will be cancelled.'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancelTrip(firstBooking)}>
                                Cancel Trip
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                         </AlertDialog>
                       )}
                     </div>
                   </CardContent>
                 </Card>
                );
              })
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
