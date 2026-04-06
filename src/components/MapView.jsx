import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const FLEET_COLORS = {
  active:       '#22c55e',
  'in-transit': '#3b82f6',
  idle:         '#f59e0b',
  maintenance:  '#ef4444',
  'in-port':    '#8b5cf6',
  delivered:    '#6b7280',
}

const PORT_CONGESTION_COLOR = {
  low:      '#22c55e',
  moderate: '#f59e0b',
  high:     '#ef4444',
  operational: '#22c55e',
}

function getFleetColor(item) {
  return FLEET_COLORS[item.status?.toLowerCase()] || '#6b7280'
}

function getPortColor(port) {
  return PORT_CONGESTION_COLOR[port.congestion_level] || PORT_CONGESTION_COLOR[port.status] || '#22c55e'
}

// Generate a curved great-circle-like arc between two points
function makeArc(from, to, steps = 30) {
  const points = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const lat = from[0] + (to[0] - from[0]) * t
    const lng = from[1] + (to[1] - from[1]) * t
    // Add a vertical bulge based on distance
    const dist = Math.sqrt(Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2))
    const bulge = Math.sin(Math.PI * t) * (dist * 0.15)
    points.push([lat + bulge, lng])
  }
  return points
}

// Fits the map to show all markers
function FitBounds({ ports }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (ports.length > 0 && !fitted.current) {
      fitted.current = true
      const bounds = L.latLngBounds(ports.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 })
    }
  }, [ports, map])
  return null
}

export default function MapView({ fleet, ports, routes, customers, layers, onSelect }) {
  return (
    <MapContainer
      center={[26, 30]}
      zoom={4}
      className="w-full h-full"
      zoomControl={true}
      attributionControl={true}
    >
      {/* Dark CartoDB tiles */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      {/* Auto-fit on first load */}
      {ports.length > 0 && <FitBounds ports={ports} />}

      {/* ── Trade Routes Layer ─────────────────────────────────────────── */}
      {layers.routes && routes.map((route, i) => (
        <Polyline
          key={i}
          positions={makeArc(route.from, route.to)}
          pathOptions={{
            color: '#FF6321',
            weight: 1.5,
            opacity: 0.35,
            dashArray: '6 4',
          }}
        />
      ))}

      {/* ── Port Layer ──────────────────────────────────────────────────── */}
      {layers.ports && ports.map((port) => (
        <CircleMarker
          key={port.id}
          center={[port.lat, port.lng]}
          radius={8}
          pathOptions={{
            color: getPortColor(port),
            fillColor: getPortColor(port),
            fillOpacity: 0.25,
            weight: 2,
          }}
          eventHandlers={{
            click: () => onSelect({ ...port, type: 'Port', name: port.name }),
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
            <div className="text-[10px]">
              <div className="font-black text-white">{port.name}</div>
              <div className="text-[#888]">{port.code} · {port.country}</div>
              {port.vessels_in_port != null && (
                <div className="text-[#22c55e]">{port.vessels_in_port} vessels</div>
              )}
              <div className="capitalize" style={{ color: getPortColor(port) }}>
                {port.congestion_level || port.status}
              </div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* ── Fleet Layer ──────────────────────────────────────────────────── */}
      {layers.fleet && fleet.map((vessel) => {
        if (!vessel.lat || !vessel.lng) return null
        const color = getFleetColor(vessel)
        return (
          <CircleMarker
            key={vessel.id}
            center={[vessel.lat, vessel.lng]}
            radius={vessel.type === 'vessel' || vessel.type === 'ship' ? 7 : 5}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.8,
              weight: 1.5,
            }}
            eventHandlers={{
              click: () => onSelect({ ...vessel, type: vessel.type || 'Vehicle' }),
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
              <div className="text-[10px]">
                <div className="font-black text-white">{vessel.name}</div>
                <div className="text-[#888] capitalize">{vessel.type}</div>
                {vessel.cargo && <div className="text-[#FF6321]">{vessel.cargo}</div>}
                {vessel.speed != null && <div className="text-[#888]">{vessel.speed} km/h</div>}
                <div className="capitalize" style={{ color }}>{vessel.status}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}

      {/* ── Customer Markets Layer ──────────────────────────────────────── */}
      {layers.customers && customers.map((c, i) => (
        <CircleMarker
          key={i}
          center={c.coords}
          radius={4 + Math.min(c.count * 1.5, 10)}
          pathOptions={{
            color: '#8b5cf6',
            fillColor: '#8b5cf6',
            fillOpacity: 0.3,
            weight: 1,
          }}
          eventHandlers={{
            click: () => onSelect({ name: c.country, type: 'Market', country: c.country, orderCount: c.count }),
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
            <div className="text-[10px]">
              <div className="font-black text-white">{c.country}</div>
              <div className="text-[#8b5cf6]">{c.count} customer{c.count !== 1 ? 's' : ''}</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
