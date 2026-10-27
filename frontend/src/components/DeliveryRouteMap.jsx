import { useEffect, useRef, useState } from "react";

// Haversine formula to calculate distance between two GPS coordinates in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) {
      resolve(window.L);
      return;
    }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve(window.L);
    document.body.appendChild(script);
  });
}

function DeliveryRouteMap({
  farmerLocation,
  customerLocation,
  farmerName = "Farm Origin",
  customerName = "Customer Destination",
  deliveryAddress = {},
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [distanceKm, setDistanceKm] = useState(null);

  // Extract coordinates (GeoJSON is [longitude, latitude])
  const farmLng = farmerLocation?.coordinates?.[0] ?? 73.8567;
  const farmLat = farmerLocation?.coordinates?.[1] ?? 18.5204;

  // Customer coordinates or slight offset if identical/missing
  let custLng = customerLocation?.coordinates?.[0];
  let custLat = customerLocation?.coordinates?.[1];

  if (custLng === undefined || custLat === undefined) {
    // Generate slight realistic offset (+2.5km to +5km)
    custLat = farmLat + 0.032;
    custLng = farmLng + 0.028;
  }

  useEffect(() => {
    let isMounted = true;

    loadLeaflet().then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      const dist = calculateHaversineDistance(farmLat, farmLng, custLat, custLng);
      setDistanceKm(dist);

      // Clean up previous map if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current).setView([farmLat, farmLng], 12);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer (100% Free, no API keys)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Custom Farm Marker
      const farmIcon = L.divIcon({
        className: "custom-farm-pin",
        html: `<div style="background-color: #047857; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">🚜</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      // Custom Customer Destination Marker
      const customerIcon = L.divIcon({
        className: "custom-dest-pin",
        html: `<div style="background-color: #2563eb; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">📍</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const farmMarker = L.marker([farmLat, farmLng], { icon: farmIcon })
        .addTo(map)
        .bindPopup(`<strong>🚜 ${farmerName}</strong><br/>Harvest & Dispatch Point`);

      const customerMarker = L.marker([custLat, custLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(
          `<strong>📍 ${customerName}</strong><br/>${
            deliveryAddress.street ? `${deliveryAddress.street}, ${deliveryAddress.city}` : "Doorstep Delivery Point"
          }`
        );

      // Draw dashed route polyline
      const routeLine = L.polyline(
        [
          [farmLat, farmLng],
          [custLat, custLng],
        ],
        {
          color: "#059669",
          weight: 4,
          opacity: 0.85,
          dashArray: "8, 8",
        }
      ).addTo(map);

      // Fit map to show both markers with margin
      const bounds = L.latLngBounds([
        [farmLat, farmLng],
        [custLat, custLng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });

      setLoading(false);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [farmLat, farmLng, custLat, custLng, farmerName, customerName, deliveryAddress]);

  const estimatedMins = distanceKm ? Math.max(15, Math.round((distanceKm / 25) * 60)) : 25;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Route Statistics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-3.5 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-bold text-slate-800">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
            Farm: {farmerName}
          </span>
          <span className="text-slate-400">➔</span>
          <span className="flex items-center gap-1 font-bold text-slate-800">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span>
            Doorstep: {deliveryAddress.city || "Customer Address"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-black text-emerald-800">
            📏 {distanceKm} km direct dispatch
          </span>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-black text-blue-800">
            ⏱️ ~{estimatedMins} mins transit
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-64 w-full">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">
            🗺️ Loading OpenStreetMap delivery route...
          </div>
        )}
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
}

export default DeliveryRouteMap;

