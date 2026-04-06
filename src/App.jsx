import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase.js'
import { COUNTRY_COORDS } from './lib/countryCoords.js'
import MapView from './components/MapView.jsx'
import Sidebar from './components/Sidebar.jsx'
import RightPanel from './components/RightPanel.jsx'

// Default Egypt / Alexandria coords as trade route origin
const ALEX_COORDS = [31.1656, 29.8638]

// Commodity category classification
const COMMODITY_CATEGORIES = {
  Minerals:     ['Rock Salt', 'Phosphate', 'Iron Ore', 'Copper', 'Limestone', 'Granite', 'Gypsum', 'Silica', 'Manganese', 'Bauxite'],
  Agricultural: ['Wheat', 'Corn', 'Rice', 'Sugar', 'Cotton', 'Soybeans', 'Sunflower', 'Barley', 'Coffee', 'Tea', 'Tobacco', 'Fertilizer'],
  Chemicals:    ['Ammonia', 'Urea', 'Sulfuric Acid', 'Chlorine', 'Caustic Soda', 'Methanol', 'Ethanol', 'Plastics', 'Resins'],
  Maritime:     ['Containers', 'General Cargo', 'Break Bulk', 'RoRo', 'Cars', 'Machinery', 'Steel'],
  Energy:       ['Crude Oil', 'LNG', 'LPG', 'Diesel', 'Gasoline', 'Fuel Oil', 'Coal', 'Petroleum'],
}

export function getCommodityCategory(commodity) {
  if (!commodity) return 'default'
  const c = commodity.toLowerCase()
  for (const [cat, items] of Object.entries(COMMODITY_CATEGORIES)) {
    if (items.some(item => c.includes(item.toLowerCase()) || item.toLowerCase().includes(c.split(' ')[0]))) {
      return cat
    }
  }
  return 'default'
}

const AUTO_REFRESH_SECS = 60

export default function App() {
  const [fleet,       setFleet]       = useState([])
  const [ports,       setPorts]       = useState([])
  const [routes,      setRoutes]      = useState([])
  const [customers,   setCustomers]   = useState([])
  const [ordersRaw,   setOrdersRaw]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [countdown,   setCountdown]   = useState(AUTO_REFRESH_SECS)
  const [layers, setLayers] = useState({
    fleet:     true,
    ports:     true,
    routes:    true,
    customers: true,
    heatmap:   false,
  })

  // Fly-to ref — MapView exposes a flyTo function via this ref
  const mapRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [fleetRes, portsRes, ordersRes, customersRes] = await Promise.all([
        supabase.from('fleet').select('id,name,type,status,lat,lng,cargo,speed,current_port,flag,capacity'),
        supabase.from('ports').select('id,name,code,country,lat,lng,status,congestion_level,vessels_in_port,berths_total,berths_occupied,daily_throughput'),
        supabase.from('orders').select('id,order_no,commodity,value,status,port,buyer').limit(300),
        supabase.from('customers').select('id,name,country,type').order('name'),
      ])

      const fleetData     = fleetRes.data     || []
      const portsData     = portsRes.data     || []
      const ordersData    = ordersRes.data    || []
      const customersData = customersRes.data || []

      setFleet(fleetData)
      setPorts(portsData)
      setOrdersRaw(ordersData)

      // Build port lookup
      const portByName = {}
      const portByCode = {}
      portsData.forEach(p => {
        if (p.name) portByName[p.name.toLowerCase()] = p
        if (p.code) portByCode[p.code.toUpperCase()]  = p
      })

      // Route intelligence: track orderCount + totalValue per route key
      const routeMap = {}
      ordersData.forEach(order => {
        if (!order.port) return
        const dest = portByCode[order.port?.toUpperCase()] || portByName[order.port?.toLowerCase()]
        if (!dest || !dest.lat || !dest.lng) return

        const key = `${ALEX_COORDS[0].toFixed(2)},${ALEX_COORDS[1].toFixed(2)}-${dest.lat.toFixed(2)},${dest.lng.toFixed(2)}`
        const cat = getCommodityCategory(order.commodity)

        if (!routeMap[key]) {
          routeMap[key] = {
            from:        ALEX_COORDS,
            to:          [dest.lat, dest.lng],
            orderCount:  0,
            totalValue:  0,
            commodities: [],
            categories:  new Set(),
            portName:    dest.name,
          }
        }
        routeMap[key].orderCount  += 1
        routeMap[key].totalValue  += Number(order.value) || 0
        if (order.commodity && !routeMap[key].commodities.includes(order.commodity)) {
          routeMap[key].commodities.push(order.commodity)
        }
        routeMap[key].categories.add(cat)
      })

      const newRoutes = Object.values(routeMap).map(r => ({
        ...r,
        categories: Array.from(r.categories),
        // Dominant category = most frequent in commodities list
        primaryCategory: Array.from(r.categories)[0] || 'default',
        weight: 1 + Math.min(r.orderCount * 0.8, 6),
      }))
      setRoutes(newRoutes)

      // Customer market clusters by country
      const countryCount = {}
      customersData.forEach(c => {
        const cc = c.country?.toUpperCase()
        if (!cc || !COUNTRY_COORDS[cc]) return
        countryCount[cc] = (countryCount[cc] || 0) + 1
      })
      const customerMarkers = Object.entries(countryCount).map(([cc, count]) => ({
        country: cc,
        coords:  COUNTRY_COORDS[cc],
        count,
      }))
      setCustomers(customerMarkers)

    } catch (err) {
      console.error('[EGG Map] load error:', err)
    }
    setLoading(false)
    setCountdown(AUTO_REFRESH_SECS)
  }, [])

  // Initial load
  useEffect(() => { load() }, [load])

  // Auto-refresh countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          load()
          return AUTO_REFRESH_SECS
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [load])

  // ── Search logic ──────────────────────────────────────────────────────────
  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const results = []

    fleet.forEach(v => {
      if (v.name?.toLowerCase().includes(q) && v.lat && v.lng) {
        results.push({ label: v.name, sub: v.type, coords: [v.lat, v.lng], item: { ...v, type: v.type || 'Vehicle' } })
      }
    })
    ports.forEach(p => {
      if ((p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)) && p.lat && p.lng) {
        results.push({ label: p.name, sub: `${p.code} · ${p.country}`, coords: [p.lat, p.lng], item: { ...p, type: 'Port' } })
      }
    })
    customers.forEach(c => {
      if (c.country?.toLowerCase().includes(q)) {
        results.push({ label: c.country, sub: `${c.count} customers`, coords: c.coords, item: { name: c.country, type: 'Market', country: c.country, orderCount: c.count } })
      }
    })
    return results.slice(0, 8)
  })()

  const handleSearchSelect = (result) => {
    setSelected(result.item)
    setSearchQuery('')
    if (mapRef.current?.flyTo) {
      mapRef.current.flyTo(result.coords, 6)
    }
  }

  // ── Filtered data for active category ─────────────────────────────────────
  const filteredRoutes = activeCategory === 'All'
    ? routes
    : routes.filter(r => r.categories.includes(activeCategory))

  const filteredFleet = activeCategory === 'All'
    ? fleet
    : fleet.filter(v => getCommodityCategory(v.cargo) === activeCategory)

  // ── Enhanced stats ─────────────────────────────────────────────────────────
  const vesselCount = fleet.filter(v => v.type === 'vessel' || v.type === 'ship').length
  const truckCount  = fleet.filter(v => v.type === 'truck').length
  const congestedPorts = ports.filter(p => p.congestion_level === 'high' || p.congestion_level === 'congested').length
  const totalRouteValue = routes.reduce((s, r) => s + r.totalValue, 0)
  const countryCount = customers.length

  const stats = {
    fleet:     fleet.length,
    vessels:   vesselCount,
    trucks:    truckCount,
    ports:     ports.length,
    congested: congestedPorts,
    routeCount: routes.length,
    totalValue: totalRouteValue,
    customers: customers.reduce((s, c) => s + c.count, 0),
    countryCount,
  }

  // Orders for selected port (right panel)
  const portOrders = selected?.type === 'Port'
    ? ordersRaw.filter(o => o.port?.toUpperCase() === selected.code?.toUpperCase() || o.port?.toLowerCase() === selected.name?.toLowerCase())
    : []

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080808]">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapView
          mapRef={mapRef}
          fleet={filteredFleet}
          ports={ports}
          routes={filteredRoutes}
          customers={customers}
          layers={layers}
          onSelect={setSelected}
          activeCategory={activeCategory}
        />
      </div>

      {/* Sidebar overlay */}
      <Sidebar
        stats={stats}
        layers={layers}
        onToggleLayer={(key) => setLayers(l => ({ ...l, [key]: !l[key] }))}
        onRefresh={load}
        loading={loading}
        selectedItem={selected}
        onClearSelection={() => setSelected(null)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        onSearchSelect={handleSearchSelect}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        countdown={countdown}
      />

      {/* Right Panel — Port / Fleet detail */}
      {selected && (
        <RightPanel
          item={selected}
          portOrders={portOrders}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Top-right: live clock + status */}
      <TopBar loading={loading} />

      {/* Bottom legend bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="bg-[#080808]/90 border border-[#1E1E1E] rounded px-4 py-2 flex items-center gap-4 backdrop-blur-sm">
          <span className="text-[8px] uppercase tracking-widest text-[#333] font-bold">Egypt Globe Group</span>
          <span className="text-[#1E1E1E]">|</span>
          <div className="flex items-center gap-3">
            {[
              ['Ports',         '#22c55e'],
              ['Fleet',         '#3b82f6'],
              ['Trade Routes',  '#FF6321'],
              ['Markets',       '#8b5cf6'],
            ].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span className="text-[8px] text-[#444]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom zoom controls */}
      <ZoomControls mapRef={mapRef} />
    </div>
  )
}

// ── Top bar with live clock ────────────────────────────────────────────────
function TopBar({ loading }) {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const hh = String(time.getUTCHours()).padStart(2, '0')
  const mm = String(time.getUTCMinutes()).padStart(2, '0')
  const ss = String(time.getUTCSeconds()).padStart(2, '0')

  return (
    <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
      <div className="bg-[#080808]/90 border border-[#1E1E1E] rounded px-3 py-1.5 flex items-center gap-2 backdrop-blur-sm">
        <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
        <span className="text-[9px] uppercase tracking-widest font-bold text-[#444]">
          {loading ? 'Loading…' : 'Live'}
        </span>
        <span className="text-[9px] font-mono text-[#555] ml-1">{hh}:{mm}:{ss} UTC</span>
      </div>
      <a
        href="https://egypt-globe-os.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#080808]/90 border border-[#1E1E1E] rounded px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold text-[#444] hover:text-[#FF6321] hover:border-[#FF6321]/30 transition-colors backdrop-blur-sm"
      >
        ← EGG OS
      </a>
    </div>
  )
}

// ── Custom zoom controls ───────────────────────────────────────────────────
function ZoomControls({ mapRef }) {
  const zoom = (delta) => {
    if (mapRef.current?.zoomBy) mapRef.current.zoomBy(delta)
  }
  return (
    <div className="absolute bottom-14 right-3 z-[1000] flex flex-col gap-1">
      {[
        { label: '+', delta: 1  },
        { label: '−', delta: -1 },
      ].map(({ label, delta }) => (
        <button
          key={label}
          onClick={() => zoom(delta)}
          className="w-8 h-8 bg-[#111] border border-[#2A2A2A] rounded text-[#888] hover:text-[#FF6321] hover:border-[#FF6321]/40 font-bold text-sm flex items-center justify-center transition-colors"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
