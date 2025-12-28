import { useRef } from "react";
import { motion, useTransform, useScroll } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

// Using the exact features structure you had
interface Feature {
  icon: any; // The lucide icon component
  title: string;
  description: string;
  emoji: string;
}

interface Props {
  features: Feature[];
}

const HorizontalScrollFeatures = ({ features }: Props) => {
  const targetRef = useRef<HTMLDivElement>(null);

  // Track vertical scroll progress of this specific section (0 to 1)
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Map vertical scroll to horizontal movement
  // We use "-85%" to ensure the last card comes fully into view
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-85%"]);

  return (
    // 1. SCROLL LOCK FIX: We make this container very tall (400vh)
    // This gives the "sticky" effect enough room to work comfortably
    <section ref={targetRef} className="relative h-[400vh] bg-background/50">
      {/* 2. STICKY CONTAINER: This stays pinned to the screen while you scroll */}
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Title Section (Pinned to left) */}
        <div className="absolute top-10 md:top-20 left-6 md:left-20 z-20 max-w-sm pointer-events-none">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose Travexa?</h2>
          <p className="text-muted-foreground text-lg">
            We are revolutionizing how you travel.
            <br />
            <span className="text-sm opacity-70">(Scroll down to explore)</span>
          </p>
        </div>

        {/* 3. HORIZONTAL TRACK: The actual moving part */}
        <motion.div style={{ x }} className="flex gap-6 pl-[20vw] md:pl-[35vw] pr-20 items-center">
          {features.map((feature, index) => {
            // We need to render the Icon component passed in the props
            const Icon = feature.icon;

            return (
              // 4. RESTORED ORIGINAL DESIGN: Exact classes and styling from your original code
              <Card
                key={index}
                className="group relative h-[420px] w-[350px] shrink-0 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-card/50 backdrop-blur-xl border-border/50"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/10" />
                </div>

                <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
                  <div>
                    {/* Floating Icon/Emoji Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-5xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        {feature.emoji}
                      </div>
                      {/* Render the Lucide Icon if it exists */}
                      <div className="p-3 rounded-full bg-primary/10 text-primary opacity-50 group-hover:opacity-100 transition-opacity">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-3 transition-colors duration-300 group-hover:text-accent">
                      {feature.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
                  </div>

                  {/* Bottom Decoration */}
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent mt-4 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* 5. SYNCED PROGRESS BAR: At the bottom of the screen */}
        <div className="absolute bottom-10 left-10 right-10 h-1.5 bg-secondary/30 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            className="h-full bg-gradient-to-r from-accent via-primary to-accent"
            style={{ scaleX: scrollYProgress, transformOrigin: "0%" }}
          />
        </div>
      </div>
    </section>
  );
};

export default HorizontalScrollFeatures;
