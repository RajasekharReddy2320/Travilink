import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentLocation, destination, startDate, endDate, travelers, budget, interests } = await req.json();
    
    console.log("Generating trip plan:", { currentLocation, destination, startDate, endDate, travelers, budget, interests });
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const numDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const systemPrompt = `You are an expert travel planning AI with deep knowledge of Indian transportation systems, including:
- Major airlines (IndiGo, Air India, SpiceJet, Vistara, AirAsia India, Akasa Air, etc.)
- Indian Railways train routes, train numbers, and station codes
- Interstate bus services and operators
- Accurate pricing for January 2026

You MUST provide REAL and ACCURATE:
- Flight numbers (e.g., 6E 2341, AI 505, SG 8169)
- Train numbers and names (e.g., 12841 Coromandel Express, 22691 Rajdhani Express)
- Actual airport codes (e.g., CCU for Kolkata, BLR for Bangalore, DEL for Delhi, BOM for Mumbai, HYD for Hyderabad, IXR for Ranchi)
- Real railway station names and codes (e.g., RNCH for Ranchi, SBC for Bangalore City, HWH for Howrah)
- Accurate departure and arrival times based on typical schedules
- Realistic 2026 prices in INR

Return ONLY valid JSON with no additional text.`;

    const userPrompt = `Create a ${numDays}-day trip itinerary for ${travelers} traveler(s) traveling from ${currentLocation} to ${destination}.

TRIP DETAILS:
- Departure city: ${currentLocation}
- Destination: ${destination}
- Budget: ₹${budget} INR (total for all travelers)
- Interests: ${interests.join(", ")}
- Travel dates: ${startDate} to ${endDate}
- Number of travelers: ${travelers}

CRITICAL TRANSPORT REQUIREMENTS:
1. FIRST STEP: Outbound transport FROM ${currentLocation} TO ${destination}
   - Research and provide REAL flight numbers (like 6E 2341, AI 505) or train numbers (like 12841, 22691)
   - Include actual departure airport/station in ${currentLocation} with correct codes
   - Include actual arrival airport/station in ${destination} with correct codes
   - Provide realistic departure and arrival times
   - Use accurate 2026 pricing

2. LAST STEP: Return transport FROM ${destination} TO ${currentLocation}
   - Same accuracy requirements as outbound

3. For flights: Use format "IndiGo 6E 2341" or "Air India AI 505"
4. For trains: Use format "12841 Coromandel Express" or "22691 Rajdhani Express"

LOCATION REQUIREMENTS:
- Use EXACT location names for all activities (e.g., "Lalbagh Botanical Garden, Mavalli, Bangalore" not just "Garden")
- Include precise GPS coordinates (latitude, longitude) for each location
- For restaurants, use real restaurant names with addresses

Return a JSON object with this exact structure:
{
  "title": "Trip title",
  "reason": "Brief reason why this is a great trip (1 sentence)",
  "steps": [
    {
      "id": "unique-id-1",
      "day": 1,
      "time": "09:00",
      "title": "IndiGo Flight 6E 2341 to Bangalore",
      "description": "Direct flight from Ranchi Airport (IXR) to Kempegowda International Airport (BLR). Departure: 09:00, Arrival: 11:30",
      "location": "Birsa Munda Airport, Ranchi (IXR)",
      "coordinates": { "lat": 23.3143, "lng": 85.3217 },
      "duration": "2h 30m",
      "category": "transport",
      "isBookable": true,
      "estimatedCost": 4500
    }
  ]
}

Categories: transport, accommodation, activity, food, sightseeing
Include 4-6 steps per day with accurate timings.
All costs must be realistic 2026 prices in INR.
Each step must have a unique id.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the response
    let tripPlan;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      tripPlan = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse trip plan");
    }

    return new Response(JSON.stringify(tripPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating trip plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
