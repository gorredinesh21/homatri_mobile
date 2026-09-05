// Backend checkout requires a delivery pin (lat/lng) so riders can be routed.
// When a customer skips coordinates, fall back to the cluster centroid.

const CLUSTER_COORDS = {
  Ghansoli: { latitude: 19.1197, longitude: 73.0078 },
  Vashi: { latitude: 19.077, longitude: 72.9986 },
  Airoli: { latitude: 19.155, longitude: 72.9986 },
};

export function clusterCoords(cluster) {
  return CLUSTER_COORDS[cluster] || CLUSTER_COORDS.Ghansoli;
}
