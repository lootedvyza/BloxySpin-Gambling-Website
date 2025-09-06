import { cn } from "@/lib/utils";
import { useModal } from "@/utils/ModalContext";
import UserContext from "@/utils/user";
import { useContext } from "react";

/**
 * Use this to open a modal
 * @type {import("react").FC<{action: (setModalState: () => void, userData?: Record<string, unknown> | null) => void, className?: string, children?: import("react").ReactNode}>}
 */
const Button = ({ action, children, className }) => {
  const { setModalState } = useModal();
  const { userData } = useContext(UserContext);

  return (
    <button
      type="button"
      className={cn(
        "mt-auto box-border inline-flex cursor-pointer items-center gap-2 rounded-lg border-none bg-[#0276FF] px-2 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#076BDE] active:bg-[#0276FF] sm:px-6 sm:py-3",
        className,
      )}
      onClick={() => action(setModalState, userData)}
    >
      {children}
    </button>
  );
};

/** @type {import("react").FC<{children: import("react").ReactNode, className?: string>}>} */
const Title = ({ children, className }) => {
  return (
    <h1
      className={cn(
        "box-border text-pretty text-lg font-bold text-white md:text-xl",
        className,
      )}
    >
      {children}
    </h1>
  );
};

/** @type {import("react").FC<{children: import("react").ReactNode, className?: string>}>} */
const Description = ({ children, className }) => {
  return (
    <p
      className={cn(
        "box-border max-w-lg text-pretty text-2xl font-bold text-white md:text-4xl",
        className,
      )}
    >
      {children}
    </p>
  );
};

/** @type {import("react").FC<{children: import("react").ReactNode, className?: string, imgSmall: string, imgLarge: string>}>} */
export const Container = ({ children, className, imgSmall, imgLarge }) => {
  return (
    <div
      className={cn(
        "relative box-border flex min-h-[12rem] max-w-full select-none flex-col items-start justify-center gap-4 overflow-hidden rounded-lg px-2 py-4 md:min-h-[18.75rem] md:px-8 md:py-6",
        className,
      )}
    >
      <picture className="pointer-events-none absolute left-0 top-0 -z-10 h-full w-full">
        <source srcSet={imgLarge} media="(min-width: 1024px)" />
        <img
          className="absolute left-0 top-0 -z-10 h-full w-full object-cover brightness-50"
          loading="lazy"
          alt=""
          src={imgSmall}
        />
      </picture>
      {children}
    </div>
  );
};

export const Banner = {
  Button,
  Description,
  Title,
  Container,
};
