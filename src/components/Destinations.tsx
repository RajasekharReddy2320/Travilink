import mountainsImage from "@/assets/destination-mountains.jpg";
import cityImage from "@/assets/destination-city.jpg";
import desertImage from "@/assets/destination-desert.jpg";

const destinations = [
  {
    name: "Mountain Escapes",
    image: mountainsImage,
    description: "Breathtaking peaks and serene valleys",
  },
  {
    name: "Urban Adventures",
    image: cityImage,
    description: "Vibrant cities that never sleep",
  },
  {
    name: "Desert Wonders",
    image: desertImage,
    description: "Mystical landscapes and ancient beauty",
  },
];

const Destinations = () => {
  return (
    <section className="py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Popular Destinations
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore the world's most stunning locations
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {destinations.map((destination, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl cursor-pointer"
              style={{ height: "400px" }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${destination.image})` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {destination.name}
                </h3>
                <p className="text-white/90">{destination.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Destinations;
