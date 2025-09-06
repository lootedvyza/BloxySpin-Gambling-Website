import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";



export const GamesSection = () => {
  return (
    <section className="mt-5">
      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="inline-flex items-center gap-1 text-xl font-bold text-white">
            <picture>
              <source
                srcSet="./logo-small-2x.webp"
                media="(min-width: 1024px)"
              />
              <img
                alt="BloxySpin logo"
                height={90}
                width={288}
                src="./logo-small.webp"
                className="block aspect-auto h-auto w-[2.5rem]"
              />
            </picture>
            Bloxy Games
          </h2>

          <button className="ml-auto cursor-pointer rounded-3xl border-none bg-[#292F45] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80 active:opacity-100">
            See All
          </button>

          <CarouselPrevious className="static box-border h-10 w-10 cursor-pointer border-none bg-[#292F45] p-2 text-sm font-semibold text-white transition-opacity hover:text-white hover:bg-[#292F45] hover:opacity-80 active:opacity-100" />
          <CarouselNext className="static box-border h-10 w-10 cursor-pointer border-none bg-[#292F45] p-2 text-sm font-semibold text-white transition-opacity hover:text-white hover:bg-[#292F45] hover:opacity-80 active:opacity-100" />
        </div>

        <CarouselContent className="gap-0 p-1 pt-7 [--width:100%] md:[--width:20rem]">
        </CarouselContent>
      </Carousel>
    </section>
  );
};
