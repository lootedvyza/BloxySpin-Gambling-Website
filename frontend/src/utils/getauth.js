export function getauth() {
  return localStorage.getItem("bloxyspin") || "no-session";
}
