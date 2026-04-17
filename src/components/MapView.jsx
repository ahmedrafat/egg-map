import { useEffect, useImperativeHandle, forwardRef, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { resolveCountry } from '../lib/countryCoords.js'
import { portCoordsIndex } from '../lib/portCoords.js'

// Alexandria / Damietta anchor — most ecosystem flows originate from Egypt
const ORIGIN = [31.1656, 29.8638]

const LAYER_COLORS = {
  ports:      '#22c55e',  // green
  fleet:      '#3b82f6',  // blue
  properties: '#eab308',  // gold
  demand:     '#FF6321',  // ecosystem orange
  providers:  '#a855f7',  // purple
  routes:     '#FF6321',
  freight:    '#06b6d4',  // cyan
}

// A lightweight HTML divIcon — avoids default pin asset issues.
function dotIcon(color, size = 10, ring = false) {
  const innerSize = size
  const outerSize = size + 8
  return L.divIcon({
    className: '',
    iconSize: [outerSize, outerSize],
    iconAnchor: [outerSize / 2, outerSize / 2],
    html: `
      <div style="position:relative;width:${outerSize}px;height:${outerSize}px;">
        ${ring ? `<span class="fleet-pulse-ring" style="top:0;left:0;right:0;bottom:0;background:${color};opacity:0.4;"></span>` : ''}
        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${innerSize}px;height:${innerSize}px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color},0 0 2px rgba(0,0,0,0.9);border:1px solid rgba(255,255,255,0.3);"></span>
      </div>`,
  })
}

// Imperative handle: expose flyTo / zoomBy to the parent ref.
function MapHandle({ onReady }) {
  const map = useMap()
  useEffect(() => { onReady && onReady(map) }, [map, onReady])
  return null
}

const MapView = forwardRef(function MapView({
  data,
  layers,
  onSelect,
}, ref) {
  const mapRefInternal = useMemo(() => ({ current: null }), [])
  useImperativeHandle(ref, () => ({
    flyTo: (coords, zoom = 5) => {
      if (mapRefInternal.current) mapRefInternal.current.flyTo(coords, zoom, { duration: 1.2 })
    },
    zoomBy: (delta) => {
      if (mapRefInternal.current) {
        const cur = mapRefInternal.current.getZoom()
        mapRefInternal.current.setZoom(cur + delta)
      }
    },
  }), [mapRefInternal])

  const portIndex = useMemo(() => portCoordsIndex(data.ports), [data.ports])

  // Aggregate market demand (RFQs + leads + buyers) by country.
  const demandByCountry = useMemo(() => {
    const agg = {}
    const push = (country, kind) => {
      const r = resolveCountry(country)
      if (!r) return
      if (!agg[r.code]) agg[r.code] = { code: r.code, coords: r.coords, rfqs: 0, leads: 0, buyers: 0 }
      agg[r.code][kind] += 1
    }
    ;(data.rfqs   || []).forEach((x) => push(x.buyer_country || x.country, 'rfqs'))
    ;(data.leads  || []).forEach((x) => push(x.country, 'leads'))
    ;(data.buyers || []).forEach((x) => push(x.country, 'buyers'))
    return Object.values(agg).map((v) => ({ ...v, total: v.rfqs + v.leads + v.buyers }))
  }, [data.rfqs, data.leads, data.buyers])

  // Logistics provider markers by country.
  const providerByCountry = useMemo(() => {
    const agg = {}
    ;(data.providers || []).forEach((p) => {
      const r = resolveCountry(p.country)
      if (!r) return
      if (!agg[r.code]) agg[r.code] = { code: r.code, coords: r.coords, names: [], count: 0 }
      agg[r.code].count += 1
      if (p.name) agg[r.code].names.push(p.name)
    })
    return Object.values(agg)
  }, [data.providers])

  // Shipment routes (polylines)
  const routes = useMemo(() => {
    const out = []
    const add = (from, to, meta) => {
      if (!from || !to) return
      out.push({ from, to, ...meta })
    }
    ;(data.customsShipments || []).forEach((s) => {
      const origin = resolveCountry(s.origin_country)?.coords || ORIGIN
      const dest   = portIndex.resolve(s.dest_port) || resolveCountry(s.dest_country)?.coords
      if (dest) add(origin, dest, { label: s.commodity || 'Customs shipment', status: s.status, kind: 'customs' })
    })
    ;(data.pelotsaltOrders || []).forEach((o) => {
      const origin = portIndex.resolve(o.port_of_loading) || ORIGIN
      const dest   = portIndex.resolve(o.destination_port)
      if (dest) add(origin, dest, { label: `Salt order → ${o.destination_port}`, status: o.status, buyer: o.buyer_name, kind: 'salt' })
    })
    ;(data.ordersGeneric || []).forEach((o) => {
      const origin = portIndex.resolve(o.origin) || resolveCountry(o.origin)?.coords || ORIGIN
      const dest   = portIndex.resolve(o.destination) || resolveCountry(o.destination)?.coords
      if (dest) add(origin, dest, { label: o.commodity || 'Order', status: o.status, kind: 'generic' })
    })
    return out
  }, [data.customsShipments, data.pelotsaltOrders, data.ordersGeneric, portIndex])

  // Freight rate destination dots
  const freightDots = useMemo(() => {
    const out = []
    ;(data.freightRates || []).forEach((r) => {
      const c = portIndex.resolve(r.destination_port) || resolveCountry(r.destination_country)?.coords
      if (c) out.push({ coords: c, port: r.destination_port, country: r.destination_country })
    })
    return out
  }, [data.freightRates, portIndex])

  const demandRadius = (total) => Math.min(28, 6 + Math.sqrt(total) * 1.6)

  return (
    <MapContainer
      center={[20, 30]}
      zoom={3}
      minZoom={2}
      maxZoom={10}
      worldCopyJump
      className="w-full h-full"
      attributionControl={true}
    >
      <MapHandle onReady={(m) => { mapRefInternal.current = m }} />

      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {/* Origin anchor */}
      <CircleMarker
        center={ORIGIN}
        radius={7}
        pathOptions={{ color: '#FF6321', weight: 2, fillColor: '#FF6321', fillOpacity: 0.9 }}
      >
        <Tooltip direction="top" offset={[0, -6]}>Alexandria · Origin hub</Tooltip>
      </CircleMarker>

      {/* ── Shipment routes ─────────────────────────────────────── */}
      {layers.routes && routes.map((r, i) => (
        <Polyline
          key={`route-${i}`}
          positions={[r.from, r.to]}
          pathOptions={{
            color: LAYER_COLORS.routes,
            weight: 1.2,
            opacity: 0.55,
            dashArray: '4 6',
          }}
        >
          <Tooltip sticky>
            <div className="space-y-0.5">
              <div className="font-semibold">{r.label}</div>
              {r.buyer && <div className="text-[10px] text-zinc-400">{r.buyer}</div>}
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{r.kind} · {r.status || '—'}</div>
            </div>
          </Tooltip>
        </Polyline>
      ))}

      {/* ── Market demand markers ──────────────────────────────── */}
      {layers.demand && demandByCountry.map((d) => (
        <CircleMarker
          key={`demand-${d.code}`}
          center={d.coords}
          radius={demandRadius(d.total)}
          pathOptions={{
            color: LAYER_COLORS.demand,
            weight: 1,
            fillColor: LAYER_COLORS.demand,
            fillOpacity: 0.35,
          }}
          eventHandlers={{
            click: () => onSelect({ type: 'Demand', ...d }),
          }}
        >
          <Tooltip direction="top">
            <div className="space-y-0.5">
              <div className="font-semibold">{d.code}</div>
              <div className="text-[10px] text-zinc-400">{d.total} signals</div>
              <div className="text-[10px] text-zinc-500">RFQs {d.rfqs} · Leads {d.leads} · Buyers {d.buyers}</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* ── Logistics providers ─────────────────────────────────── */}
      {layers.providers && providerByCountry.map((p) => (
        <CircleMarker
          key={`provider-${p.code}`}
          center={[p.coords[0] + 0.5, p.coords[1] + 0.5]}
          radius={5 + Math.min(p.count, 5)}
          pathOptions={{
            color: LAYER_COLORS.providers,
            weight: 1.5,
            fillColor: LAYER_COLORS.providers,
            fillOpacity: 0.7,
          }}
          eventHandlers={{
            click: () => onSelect({ type: 'Providers', ...p }),
          }}
        >
          <Tooltip direction="top">
            <div className="space-y-0.5">
              <div className="font-semibold">{p.code} — {p.count} partner{p.count > 1 ? 's' : ''}</div>
              <div className="text-[10px] text-zinc-400">{p.names.slice(0, 3).join(' · ')}</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* ── Freight rate destinations ───────────────────────────── */}
      {layers.freight && freightDots.map((f, i) => (
        <CircleMarker
          key={`freight-${i}`}
          center={f.coords}
          radius={2.5}
          pathOptions={{
            color: LAYER_COLORS.freight,
            weight: 1,
            fillColor: LAYER_COLORS.freight,
            fillOpacity: 0.9,
          }}
        >
          <Tooltip direction="top">
            <div>{f.port} · {f.country}</div>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* ── Ports ────────────────────────────────────────────────── */}
      {layers.ports && (data.ports || []).filter((p) => p.lat != null && p.lng != null).map((p) => (
        <Marker
          key={`port-${p.id}`}
          position={[Number(p.lat), Number(p.lng)]}
          icon={dotIcon(LAYER_COLORS.ports, 7)}
          eventHandlers={{
            click: () => onSelect({ type: 'Port', ...p }),
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            <div className="space-y-0.5">
              <div className="font-semibold">{p.name}</div>
              <div className="text-[10px] text-zinc-500">{p.country}</div>
              {p.vessels_in_port != null && <div className="text-[10px] text-zinc-400">{p.vessels_in_port} vessels</div>}
            </div>
          </Tooltip>
        </Marker>
      ))}

      {/* ── Fleet ────────────────────────────────────────────────── */}
      {layers.fleet && (data.fleet || []).filter((f) => f.lat != null && f.lng != null).map((f) => (
        <Marker
          key={`fleet-${f.id}`}
          position={[Number(f.lat), Number(f.lng)]}
          icon={dotIcon(LAYER_COLORS.fleet, 8, true)}
          eventHandlers={{
            click: () => onSelect({ type: 'Fleet', ...f }),
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <div className="space-y-0.5">
              <div className="font-semibold">{f.name}</div>
              <div className="text-[10px] text-zinc-500">{f.current_port || '—'} → {f.destination || '—'}</div>
              {f.capacity && <div className="text-[10px] text-zinc-400">{f.capacity} {f.capacity_unit || ''}</div>}
            </div>
          </Tooltip>
        </Marker>
      ))}

      {/* ── Properties / Realty ─────────────────────────────────── */}
      {layers.properties && (data.properties || []).filter((p) => p.lat != null && p.lng != null).map((p) => (
        <CircleMarker
          key={`prop-${p.id}`}
          center={[Number(p.lat), Number(p.lng)]}
          radius={5}
          pathOptions={{
            color: LAYER_COLORS.properties,
            weight: 1.2,
            fillColor: LAYER_COLORS.properties,
            fillOpacity: 0.75,
          }}
          eventHandlers={{
            click: () => onSelect({ type: 'Property', ...p }),
          }}
        >
          <Tooltip direction="top">
            <div className="space-y-0.5">
              <div className="font-semibold">{p.address || 'Property'}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{p.status || '—'}</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
})

export default MapView
