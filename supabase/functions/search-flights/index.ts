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
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  passengers: z.number().int().min(1).max(9).default(1)
});

// Realistic flight data
const airlines = ['Air India', 'IndiGo', 'SpiceJet', 'Vistara', 'Go First', 'AirAsia India', 'Akasa Air'];
const airports: Record<string, string> = {
  'Delhi': 'DEL', 'Mumbai': 'BOM', 'Bangalore': 'BLR', 'Bengaluru': 'BLR',
  'Kolkata': 'CCU', 'Chennai': 'MAA', 'Hyderabad': 'HYD', 'Pune': 'PNQ',
  'Ahmedabad': 'AMD', 'Goa': 'GOI', 'Jaipur': 'JAI', 'Kochi': 'COK',
  'Lucknow': 'LKO', 'Chandigarh': 'IXC', 'Indore': 'IDR', 'Bhubaneswar': 'BBI',
  'Varanasi': 'VNS', 'Patna': 'PAT', 'Ranchi': 'IXR', 'Guwahati': 'GAU',
  'Srinagar': 'SXR', 'Amritsar': 'ATQ', 'Udaipur': 'UDR', 'Jodhpur': 'JDH',
  'Mangalore': 'IXE', 'Coimbatore': 'CJB', 'Nagpur': 'NAG', 'Trivandrum': 'TRV',
  'Visakhapatnam': 'VTZ', 'Vijayawada': 'VGA', 'Madurai': 'IXM', 'Agartala': 'IXA'
};

function generateFlights(from: string, to: string, date: string) {
  const flights = [];
  const numFlights = 8 + Math.floor(Math.random() * 7); // 8-14 flights
  
  for (let i = 0; i < numFlights; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const hour = 5 + Math.floor(Math.random() * 19); // 5 AM to 11 PM
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)]; // Round to 15 min intervals
    const duration = 60 + Math.floor(Math.random() * 240); // 1-5 hours
    const stops = Math.random() > 0.75 ? 1 : 0;
    const basePrice = stops === 0 ? 3000 + Math.floor(Math.random() * 9000) : 2000 + Math.floor(Math.random() * 6000);
    
    // Add time for next day if duration crosses midnight
    let arrivalHour = hour + Math.floor(duration / 60);
    const nextDay = arrivalHour >= 24;
    arrivalHour = arrivalHour % 24;
    const arrivalMinute = (minute + duration % 60) % 60;
    
    flights.push({
      id: `FL${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      airline,
      flightNumber: `${airline.split(' ')[0].substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
      from: from,
      fromCode: airports[from] || from.substring(0, 3).toUpperCase(),
      to: to,
      toCode: airports[to] || to.substring(0, 3).toUpperCase(),
      departureTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      arrivalTime: `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinute.toString().padStart(2, '0')}${nextDay ? ' +1' : ''}`,
      duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
      date: date,
      price: basePrice,
      seatsAvailable: Math.floor(Math.random() * 80) + 15,
      class: ['Economy', 'Business'],
      stops: stops,
      stopLocation: stops > 0 ? ['Bangalore', 'Hyderabad', 'Mumbai', 'Delhi'][Math.floor(Math.random() * 4)] : null,
      baggage: '15 kg check-in, 7 kg cabin',
      refundable: Math.random() > 0.5
    });
  }
  
  return flights.sort((a, b) => a.price - b.price);
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

    const { from, to, date, passengers } = validation.data;
    
    // Security: Minimal logging
    console.log('[Flight Search]', {
      route: `${from}-${to}`,
      date,
      timestamp: new Date().toISOString()
    });

    const flights = generateFlights(from, to, date);

    return new Response(
      JSON.stringify({ flights }),
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
      JSON.stringify({ error: 'Failed to search flights' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
