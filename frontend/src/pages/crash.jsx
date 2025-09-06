import React, { useEffect, useState } from "react";

export default function Crash() {
  console.log("CRASH DETECTED!");
  console.log("--------------------------------------------");
  console.log("TIME", new Date());
  console.log("--------------------------------------------");

  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  return (
    <div className={`flex flex-col justify-center items-center h-screen text-center gap-2 transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      <h1 className="text-2xl font-bold">WELL, THIS IS AWKWARD</h1>
      <p className="text-lg">Looks like Bloxyspin has crashed unexpectedly.</p>
      <p className="text-lg">We've tracked the error and will get right on it.</p>
      <button
        className="button"
        onClick={() => (location.href = "/")}
      >
        Reload
      </button>
    </div>
  );
}
