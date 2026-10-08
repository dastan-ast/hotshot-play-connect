import type { Club } from "./mock-db";

/** 2GIS search link built from the club's city + address. */
export const gisUrl = (club: Pick<Club, "city" | "address" | "name">) =>
  `https://2gis.kz/search/${encodeURIComponent(`${club.city || "Астана"}, ${club.address || club.name}`)}`;
