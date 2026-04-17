import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import MapView from './MapView.jsx'
import Sidebar from './Sidebar.jsx'
import RightPanel from './RightPanel.jsx'
import { loadEcosystem } from '../lib/ecosystemLoader.js'
import { resolveCountry } from '../lib/countryCoords.js'
import { portCoordsIndex } from '../lib/portCoords.js'

const AUTO_REFRESH_SECS = 90

const EMPTY_DATA = {
  ports: [], fleet: [], properties: [],
  rfqs: [], leads: [], buyers: [], customers: [],
  providers: [], customsShipments: [], pelotsaltOrders: [], ordersGeneric: [],
  freightRates: [], portRates: [], pelotsaltProducts: [], marketProducts: [],
}

export default function Dashboard({ user, onSignOut }) {
  const [data,     setData]     = useState(EMPTY_DATA)
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [query,    setQuery]    = useState('')
  const [collapsed,setCollapsed]= useState(false)
  const [countdown,setCountdown]= useState(AUTO_REFRESH_SECS)
  const [layers,   setLayers]   = useState({
    ports: true, fleet: true, properties: true,
    demand: true, providers: true, routes: true, freight: false,
  })
  const mapRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await loadEcosystem()
      setData(d)
    } catch (err) {
      console.error('[Dashboard] load error:', err)
    }
    setLoading(false)
    setCountdown(AUTO_REFRESH_SECS)
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh countdown
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { load(); return AUTO_REFRESH_SECS }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [load])

  // Unified country count across every demand source
  const countries = useMemo(() => {
    const s = new Set()
    const push = (x) => { const r = resolveCountry(x); if (r) s.add(r.code) }
    data.rfqs.forEach((x) => push(x.buyer_country || x.country))
    data.leads.forEach((x) => push(x.country))
    data.buyers.forEach((x) => push(x.country))
    data.customers.forEach((x) => push(x.country))
    data.providers.forEach((x) => push(x.country))
    data.ports.forEach((x) => push(x.country))
    return s.size
  }, [data])

  const stats = {
    rfqs:       data.rfqs.length,
    leads:      data.leads.length,
    buyers:     data.buyers.length,
    customers:  data.customers.length,
    ports:      data.ports.length,
    fleet:      data.fleet.length,
    properties: data.properties.filter((p) => p.lat != null && p.lng != null).length,
    providers:  data.providers.length,
    shipments:  data.customsShipments.length + data.pelotsaltOrders.length,
    orders:     data.ordersGeneric.length,
    products:   data.pelotsaltProducts.length + data.marketProducts.length,
    countries,
  }

  // Search index across ports, fleet, countries
  const portIdx = useMemo(() => portCoordsIndex(data.ports), [data.ports])
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out = []
    data.ports.forEach((p) => {
      if (p.lat != null && p.lng != null && (p.name?.toLowerCase().includes(q) || p.country?.toLowerCase().includes(q))) {
        out.push({ label: p.name, sub: `Port · ${p.country || ''}`, coords: [Number(p.lat), Number(p.lng)], item: { type: 'Port', ...p } })
      }
    })
    data.fleet.forEach((f) => {
      if (f.lat != null && f.lng != null && f.name?.toLowerCase().includes(q)) {
        out.push({ label: f.name, sub: `Fleet · ${f.status || ''}`, coords: [Number(f.lat), Number(f.lng)], item: { type: 'Fleet', ...f } })
      }
    })
    // Country search
    const countryHit = resolveCountry(q)
    if (countryHit) {
      out.push({ label: countryHit.code, sub: 'Country centroid', coords: countryHit.coords, item: null })
    }
    return out.slice(0, 10)
  }, [query, data.ports, data.fleet])

  const onSearchSelect = (r) => {
    if (r.item) setSelected(r.item)
    setQuery('')
    if (mapRef.current?.flyTo) mapRef.current.flyTo(r.coords, 6)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050505]">
      {/* Map */}
      <div className="absolute inset-0">
        <MapView
          ref={mapRef}
          data={data}
          layers={layers}
          onSelect={setSelected}
        />
      </div>

      {/* Sidebar overlay */}
      <Sidebar
        stats={stats}
        layers={layers}
        onToggleLayer={(key) => setLayers((l) => ({ ...l, [key]: !l[key] }))}
        searchQuery={query}
        onSearchChange={setQuery}
        searchResults={searchResults}
        onSearchSelect={onSearchSelect}
        loading={loading}
        onRefresh={load}
        user={user}
        onSignOut={onSignOut}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
      />

      {/* Right panel */}
      {selected && (
        <RightPanel item={selected} onClose={() => setSelected(null)} />
      )}

      {/* Top-right: clock + countdown */}
      <TopBar loading={loading} countdown={countdown} />

      {/* Bottom legend */}
      <Legend />

      {/* Zoom controls */}
      <ZoomControls mapRef={mapRef} />
    </div>
  )
}

function TopBar({ loading, countdown }) {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const hh = String(time.getUTCHours()).padStart(2, '0')
  const mm = String(time.getUTCMinutes()).padStart(2, '0')
  const ss = String(time.getUTCSeconds()).padStart(2, '0')

  return (
    <div className="absolute top-3 right-3 z-[1001] flex items-center gap-2">
      <div className="bg-[#0a0a0a]/90 border border-[#1a1a1a] rounded-md px-3 py-1.5 flex items-center gap-2 backdrop-blur-sm">
        <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
        <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-500">
          {loading ? 'Syncing' : 'Live'}
        </span>
        <span className="text-[9px] font-mono text-neutral-600 ml-1">{hh}:{mm}:{ss} UTC</span>
        {!loading && <span className="text-[9px] text-neutral-700 ml-1">· refresh in {countdown}s</span>}
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-[#0a0a0a]/90 border border-[#1a1a1a] rounded-md px-4 py-2 flex items-center gap-4 backdrop-blur-sm">
        <span className="text-[8px] uppercase tracking-widest text-neutral-700 font-bold">Egypt Globe Group</span>
        <span className="text-[#1a1a1a]">|</span>
        <div className="flex items-center gap-3 flex-wrap">
          {[
            ['Ports',     '#22c55e'],
            ['Fleet',     '#3b82f6'],
            ['Properties','#eab308'],
            ['Demand',    '#FF6321'],
            ['Partners',  '#a855f7'],
            ['Freight',   '#06b6d4'],
          ].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-[8px] text-neutral-500 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ZoomControls({ mapRef }) {
  const zoom = (delta) => { if (mapRef.current?.zoomBy) mapRef.current.zoomBy(delta) }
  return (
    <div className="absolute bottom-14 right-3 z-[1000] flex flex-col gap-1">
      {[{ label: '+', delta: 1 }, { label: '−', delta: -1 }].map(({ label, delta }) => (
        <button
          key={label}
          onClick={() => zoom(delta)}
          className="w-8 h-8 bg-[#111] border border-[#2a2a2a] rounded-md text-neutral-400 hover:text-[#FF6321] hover:border-[#FF6321]/40 font-bold text-sm flex items-center justify-center transition-colors"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
