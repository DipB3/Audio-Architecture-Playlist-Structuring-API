// Earthy, print-like genre colours shared by the chips, chart and tracklist.
export const GENRE_COLORS = {
  "Contemporary Classical Piano": "#8a5a2b",
  "Indie Pop": "#c4577f",
  "Hip-Hop": "#1b1a17",
  "Ambient": "#6f8f7a",
  "Deep House": "#2f5d62",
  "Synthwave": "#93356a",
  "Neo-Soul": "#b8891a"
};

export const genreColor = (genre) => GENRE_COLORS[genre] || "#6a6458";
