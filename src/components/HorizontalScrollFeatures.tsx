import { useRef } from "react";
import { motion, useTransform, useScroll } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

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

  const x = useTransform(scrollYProgress, [0, 1], ["1%", "-95%"]);

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-background/50">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Title Section */}
        <div className="absolute top-20 left-10 z-20 max-w-md pointer-events-none">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose Travexa?</h2>
          <p className="text-muted-foreground text-lg">Scroll down to explore features →</p>
        </div>

        {/* The Moving Cards */}
        <motion.div style={{ x }} className="flex gap-8 pl-[30vw] md:pl-[40vw]">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group relative h-[450px] w-[300px] md:w-[350px] shrink-0 overflow-hidden bg-card/50 backdrop-blur-xl border-border/50 transition-all hover:border-primary"
            >
              <CardContent className="flex h-full flex-col justify-between p-8">
                <div>
                  <div className="text-6xl mb-6">{feature.emoji}</div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HorizontalScrollFeatures;
