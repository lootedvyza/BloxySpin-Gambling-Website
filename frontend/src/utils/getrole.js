import {
  Whale,
  HightRoller,
  Kirby,
  Owner,
  Moderator,
} from "../assets/exports.jsx";
export function getrole(rank, level) {
  if (!rank || !level) {
    return {
      name: "User",
      color: "white",
      image: null,
    };
  }

  if (rank === "ADMIN") {
    return {
      name: "Moderator",
      color: "#ff5e18",
      image: Moderator,
    };
  }

  if (rank === "OWNER") {
    return {
      name: "Owner",
      color: "#e5d22f",
      image: Owner,
    };
  }

  if (level >= 25) {
    return {
      name: "Whale",
      color: "#0276FF",
      image: Whale,
    };
  }

  if (level >= 15) {
    return {
      name: "HighRoller",
      color: "red",
      image: HightRoller,
    };
  }

  return {
    name: "User",
    color: null,
    image: null,
  };
}
