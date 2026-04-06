import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Color maps ────────────────────────────────────────────────────────────
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
  medium:   '#f59e0b',
  high:     '#ef4444',
  critical: '#dc2626',
}

export const COMMODITY_COLORS = {
  Minerals:     '#f59e0b',
  Agricultural: '#22c55e',
  Chemicals:    '#8b5cf6',
  Maritime:     '#3b82f6',
  Energy:       '#ef4444',
  default:      '#FF6321',
}

function getFleetColor(item) {
  return FLEET_COLORS[item.status?.toLowerCase()] || '#6b7280'
}

function getPortColor(port) {
  return PORT_CONGESTION_COLOR[port.congestion_level] || PORT_CONGESTION_COLOR[port.status] || '#22c55e'
}

function getRouteColor(route) {
  return COMMODITY_COLORS[route.primaryCategory] || COMMODITY_COLORS.default
}

// Curved arc between two lat/lng points
function makeArc(from, to, steps = 40) {
  const points = []
  for (let i = 0; i <= steps; i++) {
    const t   = i / steps
    const lat = from[0] + (to[0] - from[0]) * t
    const lng = from[1] + (to[1] - from[1]) * t
    const dist  = Math.sqrt(Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2))
    const bulge = Math.sin(Math.PI * t) * (dist * 0.15)
    points.push([lat + bulge, lng])
  }
  return points
}

// Fits map to port bounds on first load
function FitBounds({ ports }) {
  const map   = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (ports.length > 0 && !fitted.current) {
      fitted.current = true
      const bounds = L.latLngBounds(ports.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 5 })
    }
  }, [ports, map])
  return null
}

// Exposes map controls (flyTo, zoomBy) to parent via ref
function MapController({ mapRef }) {
  const map = useMap()
  useEffect(() => {
    if (mapRef) {
      mapRef.current = {
        flyTo:  (coords, zoom) => map.flyTo(coords, zoom, { animate: true, duration: 1.2 }),
        zoomBy: (delta)        => map.zoomIn ? (delta > 0 ? map.zoomIn() : map.zoomOut()) : null,
      }
    }
  }, [map, mapRef])
  return null
}

// Port circle radius: heatmap=throughput-scaled, normal=8
function portRadius(port, heatmap) {
  if (!heatmap) return 8
  const tp = port.daily_throughput || 0
  return 5 + Math.min(tp / 500, 18)
}

export default function MapView({ mapRef, fleet, ports, routes, customers, layers, onSelect, activeCategory }) {
  return (
    <MapContainer
      center={[26, 30]}
      zoom={4}
      className="w-full h-full"
      zoomControl={false}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <MapController mapRef={mapRef} />
      {ports.length > 0 && <FitBounds ports={ports} />}

      {/* ── Trade Routes ─────────────────────────────────────────────────── */}
      {layers.routes && routes.map((route, i) => {
        const color  = getRouteColor(route)
        const arc    = makeArc(route.from, route.to)
        const valM   = (route.totalValue / 1_000_000).toFixed(1)
        return (
          <Polyline
            key={i}
            positions={arc}
            pathOptions={{
              color,
              weight:    route.weight || 1.5,
              opacity:   0.45,
              dashArray: '6 4',
            }}
            eventHandlers={{
              mouseover: (e) => { e.target.setStyle({ opacity: 0.9, weight: (route.weight || 1.5) + 1.5 }) },
              mouseout:  (e) => { e.target.setStyle({ opacity: 0.45, weight: route.weight || 1.5 }) },
            }}
          >
            <Tooltip sticky opacity={0.97}>
              <div className="text-[10px]">
                <div className="font-black text-white mb-0.5">{route.portName || 'Route'}</div>
                <div style={{ color }}>{route.primaryCategory}</div>
                <div className="text-[#888]">{route.orderCount} order{route.orderCount !== 1 ? 's' : ''}</div>
                <div className="text-[#FF6321] font-bold">${valM}M value</div>
                {route.commodities.length > 0 && (
                  <div className="text-[#555] mt-0.5">{route.commodities.slice(0, 3).join(', ')}</div>
                )}
              </div>
            </Tooltip>
          </Polyline>
        )
      })}

      {/* ── Ports ────────────────────────────────────────────────────────── */}
      {layers.ports && ports.map((port) => {
        const color  = getPortColor(port)
        const radius = portRadius(port, layers.heatmap)
        return (
          <CircleMarker
            key={port.id}
            center={[port.lat, port.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor:   layers.heatmap ? color : color,
              fillOpacity: layers.heatmap ? 0.45 : 0.25,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onSelect({ ...port, type: 'Port', name: port.name }),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.97}>
              <div className="text-[10px]">
                <div className="font-black text-white">{port.name}</div>
                <div className="text-[#888]">{port.code} · {port.country}</div>
                {port.vessels_in_port != null && (
                  <div className="text-[#22c55e]">{port.vessels_in_port} vessels</div>
                )}
                {port.daily_throughput != null && (
                  <div className="text-[#888]">{port.daily_throughput?.toLocaleString()} t/day</div>
                )}
                <div className="capitalize mt-0.5" style={{ color }}>
                  {port.congestion_level || port.status}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}

      {/* ── Fleet ────────────────────────────────────────────────────────── */}
      {layers.fleet && fleet.map((vessel) => {
        if (!vessel.lat || !vessel.lng) return null
        const color    = getFleetColor(vessel)
        const isActive = vessel.status === 'active' || vessel.status === 'in-transit'
        const type     = vessel.type?.toLowerCase()
        const radius   = type === 'vessel' || type === 'ship' ? 9 : type === 'truck' ? 6 : 5
        return (
          <CircleMarker
            key={vessel.id}
            center={[vessel.lat, vessel.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor:   color,
              fillOpacity: isActive ? 0.9 : 0.7,
              weight:      isActive ? 2 : 1.5,
            }}
            className={isActive ? 'vessel-pulse' : ''}
            eventHandlers={{
              click: () => onSelect({ ...vessel, type: vessel.type || 'Vehicle' }),
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.97}>
              <div className="text-[10px]">
                <div className="font-black text-white">{vessel.name}</div>
                <div className="text-[#888] capitalize">{vessel.type}</div>
                {vessel.cargo   && <div className="text-[#FF6321]">{vessel.cargo}</div>}
                {vessel.speed != null && vessel.speed > 0 && (
                  <div className="text-[#888]">{vessel.speed} km/h {vessel.speed > 0 ? '▶' : ''}</div>
                )}
                <div className="capitalize mt-0.5" style={{ color }}>{vessel.status}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}

      {/* ── Customer Markets ─────────────────────────────────────────────── */}
      {layers.customers && customers.map((c, i) => (
        <CircleMarker
          key={i}
          center={c.coords}
          radius={4 + Math.min(c.count * 1.5, 10)}
          pathOptions={{
            color:       '#8b5cf6',
            fillColor:   '#8b5cf6',
            fillOpacity: 0.3,
            weight: 1,
          }}
          eventHandlers={{
            click: () => onSelect({ name: c.country, type: 'Market', country: c.country, orderCount: c.count }),
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={0.97}>
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
