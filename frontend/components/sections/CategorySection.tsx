import Image from "next/image";
import Link from "next/link";
import { kinhCan, kinhRam } from "@/images/landing-page";

export function CategoryGrid() {
  return (
    <section className="relative w-full bg-white border-b border-season-gray overflow-hidden ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0.4">
        {/* Product 1 */}
        <Link
          href="/sunglasses/view-all"
          className="group relative relativeblock h-[60vh] md:h-[85vh]  w-full overflow-hidden"
        >
          <Image
            src={kinhRam}
            alt="Kinh-ram"
            fill
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-end text-center mb-10 ">
            <div className="inline-block border border-white/80 px-12 py-2">
              <h1 className="text-2xl font-serif text-white uppercase font-extralight tracking-[0.20em] drop-shadow-md ">
                Sunglasses
              </h1>
            </div>
          </div>
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
        </Link>

        {/* Product 2 */}
        <Link
          href="/eyeglasses/view-all"
          className="group relative relativeblock h-[60vh] md:h-[85vh]  w-full overflow-hidden"
        >
          <Image
            src={kinhCan}
            alt="Kinh-can"
            fill
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-end text-center mb-10 ">
            <div className="inline-block border border-white/80 px-12 py-2">
              <h1 className="text-2xl font-serif text-white uppercase font-extralight tracking-[0.20em] drop-shadow-md ">
                Eyeglasses
              </h1>
            </div>
          </div>
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
        </Link>
      </div>
    </section>
  );
}
