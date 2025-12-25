import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security: Server-side input validation
const bookingSchema = z.object({
  booking_type: z.enum(['flight', 'train', 'bus', 'hotel'], {
    errorMap: () => ({ message: 'Invalid booking type' })
  }),
  passenger_name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  passenger_email: z.string()
    .trim()
    .email('Invalid email format')
    .max(255, 'Email too long'),
  passenger_phone: z.string()
    .trim()
    .min(10, 'Phone number too short')
    .max(15, 'Phone number too long'),
  from_location: z.string().trim().min(2).max(100),
  to_location: z.string().trim().min(2).max(100),
  departure_date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid departure date'),
  departure_time: z.string().trim().max(10),
  arrival_date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid arrival date').optional(),
  arrival_time: z.string().trim().max(10).optional(),
  service_name: z.string().trim().max(200),
  service_number: z.string().trim().max(50),
  seat_number: z.string().trim().max(20).optional(),
  class_type: z.string().trim().max(50).optional(),
  price_inr: z.number().positive('Price must be positive').max(1000000, 'Price too high'),
  details: z.record(z.any()).optional(),
  trip_group_id: z.string().uuid().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bookingData = await req.json();
    
    // Security: Validate all inputs
    const validation = bookingSchema.safeParse(bookingData);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid booking data',
          details: validation.error.issues[0].message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validatedData = validation.data;

    // Security: Additional date validation
    const departureDate = new Date(validatedData.departure_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (departureDate < today) {
      return new Response(
        JSON.stringify({ error: 'Cannot book for past dates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
    
    if (departureDate > maxFutureDate) {
      return new Response(
        JSON.stringify({ error: 'Cannot book more than 1 year in advance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique booking reference
    const bookingReference = `TRV${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Security: Generate signed QR code with minimal data
    const qrSecret = Deno.env.get('QR_SIGNING_SECRET') || 'default-secret-change-in-production';
    const qrData = {
      ref: bookingReference,
      v: 1 // Version
    };
    
    const qrString = JSON.stringify(qrData);
    const signature = createHmac('sha256', qrSecret)
      .update(qrString)
      .digest('hex');
    
    const signedQR = {
      d: qrData,
      s: signature
    };
    
    const qrCode = btoa(JSON.stringify(signedQR));

    // Create booking with validated data
    const { data: booking, error } = await supabaseClient
      .from('bookings')
      .insert({
        user_id: user.id,
        booking_reference: bookingReference,
        booking_type: validatedData.booking_type,
        passenger_name: validatedData.passenger_name,
        passenger_email: validatedData.passenger_email,
        passenger_phone: validatedData.passenger_phone,
        from_location: validatedData.from_location,
        to_location: validatedData.to_location,
        departure_date: validatedData.departure_date,
        departure_time: validatedData.departure_time,
        arrival_date: validatedData.arrival_date || validatedData.departure_date,
        arrival_time: validatedData.arrival_time || validatedData.departure_time,
        service_name: validatedData.service_name,
        service_number: validatedData.service_number,
        seat_number: validatedData.seat_number,
        class_type: validatedData.class_type,
        price_inr: validatedData.price_inr,
        payment_status: 'pending',
        booking_details: validatedData.details || {},
        qr_code: qrCode,
        trip_group_id: validatedData.trip_group_id || null
      })
      .select()
      .single();

    if (error) {
      // Security: Log error server-side but return generic message
      console.error('[Booking Error]', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        user_id: user.id,
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Security: Minimal logging without PII
    console.log('[Booking Created]', {
      booking_id: booking.id,
      type: booking.booking_type,
      user_id: user.id,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ booking }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    // Security: Generic error message to client
    console.error('[Server Error]', {
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ error: 'An error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
