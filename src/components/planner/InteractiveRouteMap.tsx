import React, { useState } from "react";
import { ItineraryStep } from "@/types/tripPlanner";
import { MapPin, Navigation, Loader2, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InteractiveRouteMapProps {
  steps: ItineraryStep[];
  currentLocation?: string;
  destination?: string;
}

const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({ steps, currentLocation, destination }) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // 1. Extract and Clean Locations
  const uniqueLocations = steps.reduce((acc, step) => {
    if (!step.location) return acc;
    const lastLoc = acc.length > 0 ? acc[acc.length - 1] : null;
    if (step.location !== lastLoc) {
      acc.push(step.location);
    }
    return acc;
  }, [] as string[]);

  // 2. Filter out Home/Airport to focus on the Trip Area
  let displayLocations: string[] = [];
  if (uniqueLocations.length > 1) {
    const startLocation = uniqueLocations[0];
    let trimmed = uniqueLocations.slice(1);
    if (trimmed.length > 0 && trimmed[trimmed.length - 1] === startLocation) {
      trimmed.pop();
    }
    displayLocations = trimmed.length > 0 ? trimmed : uniqueLocations;
  } else {
    displayLocations = uniqueLocations;
  }

  // Fallback
  if (displayLocations.length === 0 && destination) {
    displayLocations = [destination];
  } else if (displayLocations.length === 0) {
    return null;
  }

  // 3. THE FIX: Use 'saddr' and 'daddr' to force the Blue Route Line
  const buildMapUrl = () => {
    const baseUrl = "https://maps.google.com/maps";

    // MODE A: Single Location (Zoomed In)
    if (selectedLocation) {
      return `${baseUrl}?q=${encodeURIComponent(selectedLocation)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    // MODE B: Full Route with Blue Line
    if (displayLocations.length === 1) {
      return `${baseUrl}?q=${encodeURIComponent(displayLocations[0])}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    }

    // We limit to 10 stops to prevent URL errors
    const safeLocations = displayLocations.slice(0, 10);

    const start = safeLocations[0];
    const end = safeLocations[safeLocations.length - 1];
    const waypoints = safeLocations.slice(1, -1);

    // saddr = Starting Address
    // daddr = Destination Address (can include multiple stops separated by +to:)

    let url = `${baseUrl}?saddr=${encodeURIComponent(start)}&daddr=`;

    // Add waypoints (Intermediate stops)
    waypoints.forEach((loc) => {
      url += `${encodeURIComponent(loc)}+to:`;
    });

    // Add final destination
    url += `${encodeURIComponent(end)}`;

    // &output=embed -> Makes it an iframe
    // &t=m -> Standard Map Type
    // &z= -> Zoom level (removed so it auto-fits)
    return `${url}&output=embed`;
  };

  return (
    <div className="w-full rounded-3xl overflow-hidden shadow-lg border border-border mb-10 bg-card transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedLocation ? (
            <MapPin className="h-5 w-5 text-primary animate-bounce" />
          ) : (
            <Route className="h-5 w-5 text-primary" />
          )}
          <h3 className="font-semibold">{selectedLocation ? "Location Detail" : "Route Overview"}</h3>
          <Badge variant="secondary" className="text-xs ml-2">
            {displayLocations.length} Stops
          </Badge>
        </div>

        {selectedLocation && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedLocation(null)}
          >
            Show Full Route
          </Button>
        )}
      </div>

      {/* Location Pills */}
      <div className="p-3 border-b bg-background overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max px-1">
          {displayLocations.map((loc, idx) => {
            const isSelected = selectedLocation === loc;
            return (
              <Button
                key={`${loc}-${idx}`}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`gap-1.5 whitespace-nowrap transition-all duration-200 ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
                onClick={() => setSelectedLocation(isSelected ? null : loc)}
              >
                <div
                  className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold mr-1 ${isSelected ? "bg-white text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {idx + 1}
                </div>
                <span className="text-xs font-medium">{loc}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Map Frame */}
      <div className="relative h-[400px] md:h-[500px] bg-muted group">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Calculating Route...</p>
            </div>
          </div>
        )}

        <iframe
          key={selectedLocation || "route"}
          width="100%"
          height="100%"
          style={{ border: 0, opacity: iframeLoaded ? 1 : 0 }}
          onLoad={() => setIframeLoaded(true)}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={buildMapUrl()}
          title="Trip Route Map"
          className="transition-opacity duration-500 w-full h-full grayscale-[10%] group-hover:grayscale-0"
        />
      </div>

      {/* Footer */}
      {!selectedLocation && displayLocations.length > 1 && (
        <div className="p-3 border-t bg-muted/20">
          <div className="flex items-center gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-1.5 text-green-600 font-medium">
              <div className="w-2 h-2 rounded-full bg-green-600 shadow-sm" />
              <span className="truncate max-w-[120px]">Start: {displayLocations[0]}</span>
            </div>

            <div className="flex-1 h-px bg-border relative">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-muted px-2 text-[10px] text-muted-foreground border border-border rounded-full">
                via {displayLocations.length - 2} stops
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-red-500 font-medium">
              <span className="truncate max-w-[120px] text-right">
                End: {displayLocations[displayLocations.length - 1]}
              </span>
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveRouteMap;
