import { Bobux } from "@/assets/exports.jsx";
import { COLORS } from "./colors";
import { memo } from "react";
import { WalletIcon } from "@/assets/icons/WalletIcon";

const constants = {
  outerRadius: 95,
  innerRadius: 50,
  arrowHeight: 8,
  arrowSpread: 15,
  imageSize: 20,
};

/**
 * @typedef {Object} WheelProps
 * @property {number} timeRemaining
 * @property {boolean} showWinner
 * @property { Array<{joinerid: number, value: number, items: any[], thumbnail: string}>} jackpotEntries
 * @property {{value: number, result?: null | number, winnerusername?: string, winnerid?: number}} jackpotData
 * @property {import("react").SetStateAction<import("react").Dispatch<boolean>>} setShowWinner
 */

/** @param {WheelProps} props */
export default function Wheel({
  timeRemaining,
  showWinner,
  jackpotData,
  jackpotEntries,
  setShowWinner,
}) {
  return (
    <div className="mx-auto grid aspect-square w-fit origin-center place-items-center [grid-template-areas:'stack']">
      <WheelSVG
        jackpotData={jackpotData}
        jackpotEntries={jackpotEntries}
        setShowWinner={setShowWinner}
      />

      <WheelInfo
        {...{
          jackpotData,
          jackpotEntries,
          showWinner,
          timeRemaining,
          size: `${constants.innerRadius}%`,
        }}
      />
    </div>
  );
}

/** @type {import("react").FC<Omit<WheelProps, "timeRemaining" | "showWinner">>} */
const WheelSVG = memo(({ jackpotData, jackpotEntries, setShowWinner }) => {
  const { arrowHeight, arrowSpread, innerRadius, outerRadius } = constants;

  const totalValue =
    jackpotEntries.reduce((prev, curr) => prev + curr.value, 0) || 0;

  /** Default rotation, don't change it */
  let angleOffset = 0;

  const sectors = jackpotEntries.map((entry, index) => {
    const angle = (entry.value / totalValue) * 360;
    const prevOffset = angleOffset;
    angleOffset += angle;

    return {
      index,
      angle,
      angleOffset: prevOffset,
      imgUrl: entry?.thumbnail,
      joinerid: entry.joinerid,
    };
  });

  let finalRotation = 0;
  if (jackpotData.result) {
    const sector = sectors.find(
      ({ joinerid }) => joinerid === jackpotData.winnerid,
    );
    if (sector) {
      finalRotation = sector.angle / 2 + sector.angleOffset;
      finalRotation += 3600;
    } else {
      console.warn("Winner is not present");
    }
  }

  return (
    <svg
      viewBox="-100 -100 200 200"
      className="w-[min(90vw,35rem)] [grid-area:stack]"
      fill="none"
    >
      <Defs />

      <g mask="url(#mask)">
        {/* Flip the coordinate system for easier calculations */}
        {/* https://stackoverflow.com/a/3849176/8791684 */}
        <g
          transform="matrix(1 0 0 -1 0 0)"
          style={{
            rotate: `${finalRotation * -1}deg`,
            transition: jackpotData.result
              ? "rotate 10s cubic-bezier(0.4, 0, 0.2, 1)"
              : "",
          }}
          onTransitionEnd={() => {
            setShowWinner(true);
          }}
        >
          {sectors.length < 2 ? (
            <FullCircle
              imgUrl={sectors?.at(0)?.imgUrl}
              index={0}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              angleOffset={angleOffset}
            />
          ) : (
            sectors.map((entry, index) => {
              return (
                <Sector
                  key={index}
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  index={index}
                  angle={entry.angle}
                  angleOffset={entry.angleOffset}
                  imgUrl={entry?.imgUrl}
                />
              );
            })
          )}
        </g>

        {/* Inner border */}
        <g strokeWidth="2">
          <circle r={innerRadius - 1} fill="none" stroke="#343c44" />
          <Arrow
            baseRadius={innerRadius}
            height={arrowHeight}
            spread={arrowSpread}
            fill="#343c44"
          />
        </g>
      </g>
    </svg>
  );
});

/**
 * @typedef {Object} SectorProps
 * @property {number} angle Angular width of this sector in degrees
 * @property {number} angleOffset Rotation value for this sector
 * @property {string} imgUrl Thumbnail URL
 * @property {number} innerRadius
 * @property {number} outerRadius
 * @property {number} index
 */

/** All calculations assume origin is at center,
 * and the coordinate system is the "normal" (cartesian) coordinate system of 100x100 size.
 * @param {SectorProps} props
 */
function Sector({
  outerRadius,
  innerRadius,
  index,
  angle,
  angleOffset,
  imgUrl,
}) {
  const outerEnd = getCoords(outerRadius, angle);
  const largeArcFlag = angle >= 180 ? 1 : 0;

  const arc = `A${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x},${outerEnd.y}`;

  return (
    <g transform={`rotate(${angleOffset * -1})`}>
      <path
        d={`M0,0 V${outerRadius} ${arc} Z`}
        fill={COLORS[index % COLORS.length]}
      />

      {angle > 17 && (
        <Img
          angleOffset={angle / 2}
          href={imgUrl}
          radialDistance={(outerRadius + innerRadius) / 2}
          size={constants.imageSize}
        />
      )}
    </g>
  );
}

/**
 * @typedef {Object} ImageProps
 * @property {string} href
 * @property {number} size
 * @property {number} radialDistance
 * @property {number} angleOffset
 */

/** @param {ImageProps} props */
function Img({ href, radialDistance, size, angleOffset }) {
  const coords = getCoords(radialDistance, angleOffset);

  return (
    <image
      href={href}
      style={{ clipPath: `circle(50%)` }}
      width={size}
      height={size}
      x={`${(size / 2) * -1}`}
      y={`${(size / 2) * -1}`}
      // I have no clue how this is working,
      // so don't touch it if you don't know either
      // prettier-ignore
      transform={`translate(${coords.x}, ${coords.y}) rotate(${angleOffset * -1}) scale(1,-1)`}
    />
  );
}

/** @typedef {Pick<SectorProps,'innerRadius' | 'outerRadius' | 'angleOffset' | 'index'> & {imgUrl?: string}} FullCircleProps  */

/**
 * Required since {@link Sector} can't draw full circle.
 *
 * Shows the image if `imgUrl` is not undefined.
 *
 * @param {FullCircleProps} props
 */
function FullCircle({ imgUrl, index, innerRadius, outerRadius, angleOffset }) {
  const r = (innerRadius + outerRadius) / 2;

  return (
    <g transform={`rotate(${angleOffset * -1})`}>
      {/* Main circle */}
      <circle r={outerRadius} fill={COLORS[index]} />

      {imgUrl ? (
        <Img
          angleOffset={0}
          href={imgUrl}
          radialDistance={r}
          size={constants.imageSize}
        />
      ) : null}
    </g>
  );
}

const Defs = memo(() => {
  return (
    <defs>
      <mask id="mask" maskUnits="userSpaceOnUse" x="-100" y="-100">
        <rect x="-100" y="-100" width="200" height="200" fill="white" />
        <Arrow
          baseRadius={constants.innerRadius - 2}
          height={constants.arrowHeight}
          spread={constants.arrowSpread}
          fill="black"
        />
        <circle r={constants.innerRadius - 1.5} cx="0" cy="0" fill="black" />
      </mask>
    </defs>
  );
});
/**
 * @typedef {Pick<WheelProps, "jackpotData" | "showWinner" | "jackpotEntries" | "timeRemaining">} WheelInfoProps
 */

/**
 * @param {WheelInfoProps} props
 */
function WheelInfo({ jackpotData, jackpotEntries, showWinner, timeRemaining }) {
  return (
    <div
      style={{ width: `${constants.innerRadius}%` }}
      className="box-border grid aspect-square place-content-center gap-1 rounded-full p-2 [grid-area:stack]"
    >
      <h1 className="flex items-center justify-center gap-1 text-xl md:text-2xl">
        <WalletIcon alt="Bobux" className="aspect-square w-5 md:w-6 text-[#0276FF]" />
        <span>
          {jackpotData.value !== undefined
            ? jackpotData.value.toLocaleString("en-US", {
                notation: "compact",
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })
            : "0"}
        </span>
      </h1>

      <div className="text-center text-base font-semibold text-white">
        {showWinner && jackpotData.result
          ? `🎉 ${jackpotData.winnerusername}`
          : `${jackpotEntries.length} | ${timeRemaining || 0}`}
      </div>
    </div>
  );
}

/**
 * @typedef {Object} ArrowProps
 * @property {number} baseRadius
 * @property {number} spread Spread angle
 * @property {number} height Height of the arrow
 * @property {string} fill
 */

/**
 * Draws an arrow head pointing straight up
 * @param {ArrowProps} props */
function Arrow({ baseRadius, height, spread, fill }) {
  const bottomRight = getCoords(baseRadius * -1, spread / 2);
  const bottomLeft = getCoords(baseRadius * -1, (spread / 2) * -1);
  const head = baseRadius + height;
  const baseArc = `A${baseRadius} ${baseRadius} 0 0 1 ${bottomLeft.x},${bottomLeft.y}`;

  return (
    <path
      d={`M0,${head * -1} L${bottomRight.x},${bottomRight.y} ${baseArc} Z`}
      fill={fill}
    />
  );
}

/**
 * Returns coordinates according to cartesian plane
 * @param {number} radius
 * @param {number} angle
 */
function getCoords(radius, angle) {
  const theta = (Math.PI * angle) / 180;
  return {
    x: radius * Math.sin(theta),
    y: radius * Math.cos(theta),
  };
}
