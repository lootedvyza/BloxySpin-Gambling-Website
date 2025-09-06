import { GamesSection } from "./GamesSection";
import { HeroCarousel } from "./HeroCarousel";
import { HomeTabs } from "./HomeTabs";

export const Home = () => {
  return (
    <div className="px-4 py-4 md:px-6">
      <HeroCarousel />

      <GamesSection />

      <HomeTabs />
    </div>
  );
};
