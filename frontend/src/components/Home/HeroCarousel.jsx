import * as React from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { banners } from "./BannerCarousel/slides";
import Autoplay from "embla-carousel-autoplay";
import { Banner } from "./BannerCarousel/components";

export function HeroCarousel() {
  return (
    <Carousel
      opts={{
        align: "start",
      }}
      plugins={[
        Autoplay({
          delay: 4000,
        }),
      ]}
      className="w-full"
    >
      <CarouselContent>
        {banners.map((banner, index) => (
          <CarouselItem
            className="box-border max-w-full basis-full"
            key={index}
          >
            <Banner.Container
              className={banner.className}
              imgLarge={banner.imgLarge}
              imgSmall={banner.imgSmall}
            >
              {banner.title}
              {banner.description}
              {banner.button}
            </Banner.Container>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
