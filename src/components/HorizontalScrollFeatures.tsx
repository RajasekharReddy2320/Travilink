import { useRef } from "react";
import { motion, useTransform, useScroll } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Feature {
  icon: any;
  title: string;
  description: string;
  emoji: string;
}

interface Props {
  features: Feature[];
}

const HorizontalScrollFeatures = ({ features }: Props) => {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Map vertical scroll to horizontal movement
  // We move from 0 to -100% of the scroll width minus the viewport width
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  return (
    // Height ensures we have scroll space. 'relative' allows the sticky child to work.
    <section ref={targetRef} className="relative h-[300vh] bg-transparent">
      {/* Sticky Container: Freezes the view while we scroll through the cards */}
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Title Section (Fixed to the left side) */}
        <div className="absolute top-0 left-0 h-full w-[30%] md:w-[25%] flex flex-col justify-center px-6 md:px-12 z-10 bg-gradient-to-r from-background via-background/80 to-transparent">
          <div className="max-w-md">
            <Badge variant="secondary" className="mb-4 bg-background/60 backdrop-blur-xl border border-border/50">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose Travexa?</h2>
            <p className="text-muted-foreground text-lg mb-6">
              Your all-in-one travel companion that revolutionizes how you plan, book, and experience your journeys.
            </p>
          </div>
        </div>

        {/* Moving Track - Starts after the title area */}
        <motion.div style={{ x }} className="flex gap-6 pl-[30%] md:pl-[25%] pr-10 items-center h-full">
          {features.map((feature, index) => (
            // --- EXACT ORIGINAL CARD DESIGN ---
            // Only added: 'w-[350px] shrink-0' to prevent them from squishing in a flex row
            <Card
              key={index}
              className="group relative w-[350px] shrink-0 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-card/50 backdrop-blur-xl border-border/50"
            >
              {/* Hover Glow Effect (Original) */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/10" />
              </div>

              <CardContent className="p-8 relative z-10">
                <div className="text-5xl mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {feature.emoji}
                </div>
                <h3 className="text-xl font-semibold mb-3 transition-colors duration-300 group-hover:text-accent">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
            // ----------------------------------
          ))}
        </motion.div>

        {/* Synced Progress Bar (Absolute bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-secondary/20">
          <motion.div className="h-full bg-primary" style={{ scaleX: scrollYProgress, transformOrigin: "0%" }} />
        </div>
      </div>
    </section>
  );
};

export default HorizontalScrollFeatures;
