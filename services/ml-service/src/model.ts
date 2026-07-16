import artifact from "./kmeans_artifact.json";

export interface PredictionInput {
  price: number;
  reviews_per_month: number;
  calculated_host_listings_count: number;
  availability_365: number;
}

const PROFILES = [
  { name: "Disponibilidad limitada", description: "Alojamiento de precio moderado y baja disponibilidad anual." },
  { name: "Anfitrión profesional", description: "Propiedad operada por un anfitrión con un portafolio amplio." },
  { name: "Alta disponibilidad", description: "Alojamiento disponible gran parte del año con demanda moderada." },
  { name: "Lujo excepcional", description: "Propiedad del segmento de precio más alto del mercado." },
  { name: "Alta rotación", description: "Alojamiento con una frecuencia de reseñas y demanda elevada." },
  { name: "Premium", description: "Propiedad de precio alto orientada al mercado premium." }
] as const;

export function predict(input: PredictionInput) {
  const values = artifact.features.map((feature) => input[feature as keyof PredictionInput]);
  const scaled = values.map((value, index) =>
    (value - artifact.scaler.mean[index]) / artifact.scaler.scale[index]
  );
  const distances = artifact.centroids.map((centroid) =>
    Math.sqrt(centroid.reduce((sum, value, index) => sum + (scaled[index] - value) ** 2, 0))
  );
  const cluster = distances.indexOf(Math.min(...distances));

  return {
    cluster,
    profile: PROFILES[cluster],
    distance: Number(distances[cluster].toFixed(4)),
    modelVersion: artifact.version,
    trainedAt: artifact.trained_at
  };
}
