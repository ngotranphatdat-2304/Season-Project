import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/dist/client/link";

// Collection data, this can be fetched from an API
const collections = [
  {
    id: 1,
    name: "The Soap 25",
    slug: "the-soap",
    description:
      "Inspired by the soft, inflated surface of a bar of soap, with its signature rounded contours, The Soap 25 presents a distinctive fusion of sharp, flat lenses and a full, rounded frame front - a striking intersection that echoes the subtle distortion of a soap bar upon sudden impact. The Soap 25 collection introduces a refined new design, featuring a carefully curated earth-tone palette. Thoughtfully developed to complement Asian skin tones, these warm and neutral hues offer a timeless aesthetic, delivering enduring value and effortless sophistication.",
    image:
      "https://res.cloudinary.com/du2zsbi0i/image/upload/v1779740990/the-soap_ohjbgl.jpg",
  },
  {
    id: 2,
    name: "The Office 25",
    slug: "the-office",
    description:
      "Drawing inspiration from everyday office tools - rulers, set squares, paper clips, and utility knives - The Office reimagines the ordinary beyond function, transforming these familiar elements into defining structural forms within eyewear design. Distinct from previous collections, The Office introduces a bold exploration of concept, structure, and silhouette. Elevated by the striking presence of metal, each piece is meticulously crafted to embody precision, refinement, and modern sophistication - culminating in a line of optical frames that seamlessly blends high aesthetics with contemporary elegance.",
    image:
      "https://res.cloudinary.com/du2zsbi0i/image/upload/v1779740992/the-office_bsft4q.jpg",
  },
];

export function AccessoryFeature() {
  return (
    <section className="md:py-10 bg-season-gray">
      <div className="space-y-1 md:space-y-10">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}

interface CollectionCardProps {
  collection: (typeof collections)[number];
}

function CollectionCard({ collection }: CollectionCardProps) {
  // Determine if the image should be on the right or left based on the collection ID
  const isImageRight = collection.id % 2 === 0;

  return (
    <div className="container mx-auto">
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 items-center bg-white ring-2 ring-season-gray/10 inset-shadow-sm overflow-hidden ${
          isImageRight ? "" : "lg:grid-cols-2-reverse"
        }`}
      >
        {/* Text Content - Hidden on small screens */}
        <div
          className={`hidden lg:block space-y-6 p-8 sm:p-12 ${
            isImageRight ? "lg:order-1" : "lg:order-2"
          }`}
        >
          <h2 className="text-4xl sm:text-5xl font-serif font-semibold text-season-dark leading-tight">
            {collection.name}
          </h2>
          <p className="font-serif text-lg md:text-xl text-neutral-600 leading-relaxed max-w-prose">
            {collection.description}
          </p>
          <div className="flex items-center space-x-6 pt-4">
            <Button
              variant="default"
              className="rounded-full bg-season-dark text-white px-8 py-6 uppercase text-xs tracking-widest hover:bg-season-dark/80 transition-colors duration-300"
            >
              <Link href={`/collections/${collection.slug}/`}>Explore Now</Link>
            </Button>
          </div>
        </div>

        {/* Image Content - Full bleed to edges */}
        <div
          className={`relative w-full h-110 md:h-[75vh] bg-season-gray/5 ${
            isImageRight ? "lg:order-2" : "lg:order-1"
          }`}
        >
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover md:object-cover md:object-center"
          />

          {/* Mobile Overlay - Only visible on small screens */}
          <div className="lg:hidden absolute bottom-0 left-0 p-6 sm:p-8 flex-col justify-center">
            <h3 className="text-2xl sm:text-3xl font-serif font-extralight text-white mb-3 ">
              {collection.name}
            </h3>
            <Button
              variant="default"
              className="rounded-full bg-transparent border border-white text-white uppercase text-xs tracking-widest hover:bg-season-gray transition-colors duration-300 "
            >
              <Link href={`/collections/${collection.slug}/`}>Explore Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
