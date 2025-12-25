import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security: Input validation schema
const searchSchema = z.object({
  from: z.string().trim().min(2).max(100),
  to: z.string().trim().min(2).max(100),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date')
});

// Realistic bus operators and types in India
const operators = [
  'RedBus', 'VRL Travels', 'SRS Travels', 'Orange Travels', 'Parveen Travels', 
  'Raj Travels', 'KPN Travels', 'Sharma Travels', 'National Travels', 'KSRTC',
  'MSRTC', 'TSRTC', 'IntrCity SmartBus', 'Zingbus', 'Abhibus'
];
const busTypes = [
  'AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Volvo AC', 'Multi-Axle', 
  'Semi-Sleeper', 'Volvo Multi-Axle', 'Scania AC', 'Mercedes AC', 'Electric AC'
];

function generateBuses(from: string, to: string, date: string) {
  const buses = [];
  const numBuses = 10 + Math.floor(Math.random() * 12); // 10-21 buses
  
  for (let i = 0; i < numBuses; i++) {
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const busType = busTypes[Math.floor(Math.random() * busTypes.length)];
    const hour = 5 + Math.floor(Math.random() * 21); // 5 AM to 1 AM
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    const duration = 180 + Math.floor(Math.random() * 840); // 3-17 hours
    const isACBus = busType.includes('AC');
    const basePrice = isACBus ? 600 + Math.floor(Math.random() * 1800) : 300 + Math.floor(Math.random() * 900);
    
    // Calculate arrival (may be next day)
    let arrivalHour = hour + Math.floor(duration / 60);
    const nextDay = arrivalHour >= 24;
    arrivalHour = arrivalHour % 24;
    const arrivalMinute = (minute + duration % 60) % 60;
    
    const totalSeats = busType.includes('Sleeper') ? 40 : 50;
    const seatsAvailable = Math.floor(Math.random() * (totalSeats - 5)) + 5;
    
    buses.push({
      id: `BS${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      operator,
      busType,
      from: from,
      to: to,
      departureTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      arrivalTime: `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinute.toString().padStart(2, '0')}${nextDay ? ' +1' : ''}`,
      duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
      date: date,
      price: basePrice,
      seatsAvailable,
      totalSeats,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      reviewsCount: Math.floor(Math.random() * 2000) + 100,
      boardingPoints: [`${from} Bus Stand`, `${from} Railway Station`, `${from} Airport`].slice(0, Math.floor(Math.random() * 2) + 1),
      droppingPoints: [`${to} Bus Stand`, `${to} Railway Station`],
      amenities: [
        'WiFi', 'Charging Point', 'Water Bottle', 'Emergency Exit',
        'Reading Light', 'Blanket', 'Snacks', 'Live Tracking', 'USB Charger'
      ].filter(() => Math.random() > 0.5),
      cancellationPolicy: 'Free cancellation up to 24 hours before departure',
      windowSeatsAvailable: Math.floor(seatsAvailable * 0.4),
      refundable: true
    });
  }
  
  return buses.sort((a, b) => a.price - b.price);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
    // Security: Validate inputs
    const validation = searchSchema.safeParse(requestData);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid search parameters',
          details: validation.error.issues[0].message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { from, to, date } = validation.data;
    
    // Security: Minimal logging
    console.log('[Bus Search]', {
      route: `${from}-${to}`,
      date,
      timestamp: new Date().toISOString()
    });

    const buses = generateBuses(from, to, date);

    return new Response(
      JSON.stringify({ buses }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    // Security: Generic error message
    console.error('[Server Error]', {
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ error: 'Failed to search buses' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
