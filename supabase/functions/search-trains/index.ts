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

// Realistic Indian train data
const trainNames = [
  'Rajdhani Express', 'Shatabdi Express', 'Duronto Express', 'Garib Rath',
  'Humsafar Express', 'Tejas Express', 'Vande Bharat', 'Double Decker',
  'Jan Shatabdi', 'Sampark Kranti', 'Purushottam Express', 'Karnataka Express',
  'Chennai Express', 'Mumbai Rajdhani', 'Delhi Duronto', 'Kolkata Mail'
];

function generateTrains(from: string, to: string, date: string) {
  const trains = [];
  const numTrains = 6 + Math.floor(Math.random() * 8); // 6-13 trains
  
  for (let i = 0; i < numTrains; i++) {
    const name = trainNames[Math.floor(Math.random() * trainNames.length)];
    const hour = 4 + Math.floor(Math.random() * 22); // 4 AM to 1 AM
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    const duration = 240 + Math.floor(Math.random() * 720); // 4-16 hours
    const basePrice = 400 + Math.floor(Math.random() * 1200);
    
    // Calculate arrival time (may be next day)
    let arrivalHour = hour + Math.floor(duration / 60);
    const daysLater = Math.floor(arrivalHour / 24);
    arrivalHour = arrivalHour % 24;
    const arrivalMinute = (minute + duration % 60) % 60;
    
    const classes: Record<string, { price: number; available: number; status: string }> = {};
    const availableClasses = ['SL', '3A', '2A', '1A'];
    const classMultipliers = { 'SL': 1, '3A': 1.8, '2A': 2.5, '1A': 4 };
    
    availableClasses.forEach(cls => {
      const availability = Math.floor(Math.random() * 150) + 10;
      classes[cls] = {
        price: Math.floor(basePrice * classMultipliers[cls as keyof typeof classMultipliers]),
        available: availability,
        status: availability > 50 ? 'Available' : availability > 10 ? 'RAC' : 'Waitlist'
      };
    });
    
    trains.push({
      id: `TR${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      name,
      trainNumber: `${Math.floor(Math.random() * 80000) + 10000}`,
      from: from,
      to: to,
      departureTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      arrivalTime: `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinute.toString().padStart(2, '0')}${daysLater > 0 ? ` +${daysLater}` : ''}`,
      duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
      date: date,
      classes,
      runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      platform: Math.floor(Math.random() * 8) + 1,
      quota: ['General', 'Tatkal', 'Ladies'],
      facilities: ['Pantry Car', 'Charging Point', 'WiFi'].filter(() => Math.random() > 0.4)
    });
  }
  
  return trains.sort((a, b) => a.classes['SL'].price - b.classes['SL'].price);
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
    console.log('[Train Search]', {
      route: `${from}-${to}`,
      date,
      timestamp: new Date().toISOString()
    });

    const trains = generateTrains(from, to, date);

    return new Response(
      JSON.stringify({ trains }),
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
      JSON.stringify({ error: 'Failed to search trains' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
