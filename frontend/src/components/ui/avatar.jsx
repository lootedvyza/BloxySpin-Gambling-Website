import { Undefinded } from "@/assets/exports";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} AvatarProps
 * @property {string} imgUrl
 * @property {string} userid
 * @property {number} level
 * @property {string} [className]
 * @property {() => void} [onClick]
 */

/** @type {import("react").FC<AvatarProps>} */
export const Avatar = ({ imgUrl, level, className, onClick }) => {
  return (
    <div
      className={cn(
        "relative box-border grid aspect-square w-14 cursor-pointer place-content-center rounded-[1.125rem] border-4 border-solid border-[#22283F] bg-[#1C1F2E]",
        className,
      )}
    >
      <img
        src={imgUrl || Undefinded}
        className="block max-w-full object-contain rounded"
        loading="lazy"
        height={42}
        width={42}
        alt=""
        style={{ "borderRadius": "10px" }}
        onClick={onClick}
      />
      <div
        className="absolute bottom-0 left-1/2 block max-w-full overflow-hidden text-ellipsis rounded bg-[#0276FF] px-1 py-0.5 text-[0.5rem] font-bold text-white"
        style={{
          transform: "translate(-50%, 50%)",
          boxShadow: "0px 4px 6px 0px rgba(0, 0, 0, 0.45)",
        }}
      >
        <span className="inline-block align-bottom leading-tight">{level}</span>
      </div>
    </div>
  );
};
