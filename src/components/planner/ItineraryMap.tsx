import React from 'react';
import { ItineraryStep } from '@/types/tripPlanner';

interface ItineraryMapProps {
  steps: ItineraryStep[];
}

const ItineraryMap: React.FC<ItineraryMapProps> = ({ steps }) => {
  // Extract valid locations, filtering consecutive duplicates
  const uniqueLocations = steps.reduce((acc, step) => {
    const lastLoc = acc.length > 0 ? acc[acc.length - 1] : null;
    if (step.location && step.location !== lastLoc) {
      acc.push(step.location);
    }
    return acc;
  }, [] as string[]);

  if (uniqueLocations.length < 1) {
    return null;
  }

  // User requested to exclude the current location (origin) to focus on the destination area.
  // Logic:
  // 1. Assume the first location is the Origin. Remove it.
  // 2. If the last location is the same as the Origin (return trip), remove it too.
  // This ensures the map stays zoomed in on the destination activities.
  let displayLocations: string[] = [];
  if (uniqueLocations.length > 1) {
    const startLocation = uniqueLocations[0];
    // Remove the start location
    let trimmed = uniqueLocations.slice(1);
    // Check if the trip returns to the start location at the very end
    if (trimmed.length > 0 && trimmed[trimmed.length - 1] === startLocation) {
      trimmed.pop();
    }
    displayLocations = trimmed;
  } else {
    // If only one location exists, we have to show it (even if it's the origin, though unlikely for a full trip plan)
    displayLocations = uniqueLocations;
  }

  if (displayLocations.length === 0) {
    // If filtering removed everything (e.g. Origin -> Origin), show nothing or fallback to destination if available?
    // For now, return null to hide map rather than showing a map of "home".
    return null;
  }

  let src = "";

  if (displayLocations.length === 1) {
    // Single location map (e.g. just the destination city or hotel)
    src = `https://maps.google.com/maps?q=${encodeURIComponent(displayLocations[0])}&output=embed`;
  } else {
    // Route map showing movement within the destination
    // e.g. Airport -> Hotel -> Restaurant -> Attraction
    const origin = displayLocations[0];
    const destination = displayLocations[displayLocations.length - 1];
    // Intermediate stops (limit to avoid URL length issues)
    // We take up to 8 intermediates to keep the URL safe for iframes
    const intermediates = displayLocations.slice(1, -1).slice(0, 8);
    let daddr = "";
    if (intermediates.length > 0) {
      daddr = intermediates.map(loc => encodeURIComponent(loc)).join('+to:');
      daddr += `+to:${encodeURIComponent(destination)}`;
    } else {
      daddr = encodeURIComponent(destination);
    }

    src = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${daddr}&output=embed`;
  }

  return (
    <div className="w-full h-[400px] md:h-[450px] rounded-3xl overflow-hidden shadow-lg border border-border mb-10 bg-muted relative group">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={src}
        title="Trip Route Map"
        className="grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
      ></iframe>
      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full shadow-sm text-muted-foreground pointer-events-none">
        Interactive Map
      </div>
    </div>
  );
};

export default ItineraryMap;
