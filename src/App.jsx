import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase.js'
import { COUNTRY_COORDS } from './lib/countryCoords.js'
import MapView from './components/MapView.jsx'
import Sidebar from './components/Sidebar.jsx'

// Default Egypt port coords as fallback origin for trade routes
const ALEX_COORDS = [31.1656, 29.8638]

export default function App() {
  const [fleet,     setFleet]     = useState([])
  const [ports,     setPorts]     = useState([])
  const [routes,    setRoutes]    = useState([])
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [layers, setLayers] = useState({
    fleet:     true,
    ports:     true,
    routes:    true,
    customers: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [fleetRes, portsRes, ordersRes, customersRes] = await Promise.all([
        supabase.from('fleet').select('id,name,type,status,lat,lng,cargo,speed,current_port,flag,capacity'),
        supabase.from('ports').select('id,name,code,country,lat,lng,status,congestion_level,vessels_in_port,berths_total'),
        supabase.from('orders').select('id,order_no,commodity,value,status,port,buyer').limit(200),
        supabase.from('customers').select('id,name,country,type').order('name'),
      ])

      const fleetData = fleetRes.data || []
      const portsData = portsRes.data || []
      const ordersData = ordersRes.data || []
      const customersData = customersRes.data || []

      setFleet(fleetData)
      setPorts(portsData)

      // Build port lookup map for routes
      const portByName = {}
      const portByCode = {}
      portsData.forEach(p => {
        portByName[p.name?.toLowerCase()] = p
        if (p.code) portByCode[p.code?.toUpperCase()] = p
      })

      // Build trade routes: origin = Alexandria (default) → destination port from order
      const routeSet = new Set()
      const newRoutes = []
      ordersData.forEach(order => {
        if (!order.port) return
        const dest = portByCode[order.port?.toUpperCase()] || portByName[order.port?.toLowerCase()]
        if (!dest || !dest.lat || !dest.lng) return
        const key = `${ALEX_COORDS[0].toFixed(1)},${ALEX_COORDS[1].toFixed(1)}-${dest.lat.toFixed(1)},${dest.lng.toFixed(1)}`
        if (routeSet.has(key)) return
        routeSet.add(key)
        newRoutes.push({
          from: ALEX_COORDS,
          to: [dest.lat, dest.lng],
          commodity: order.commodity,
        })
      })
      setRoutes(newRoutes)

      // Build customer market clusters by country
      const countryCount = {}
      customersData.forEach(c => {
        const cc = c.country?.toUpperCase()
        if (!cc || !COUNTRY_COORDS[cc]) return
        countryCount[cc] = (countryCount[cc] || 0) + 1
      })
      const customerMarkers = Object.entries(countryCount).map(([cc, count]) => ({
        country: cc,
        coords: COUNTRY_COORDS[cc],
        count,
      }))
      setCustomers(customerMarkers)

    } catch (err) {
      console.error('[EGG Map] load error:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const stats = {
    fleet:     fleet.length,
    ports:     ports.length,
    orders:    routes.length > 0 ? `${routes.length} routes` : '—',
    customers: customers.reduce((s, c) => s + c.count, 0),
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080808]">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapView
          fleet={fleet}
          ports={ports}
          routes={routes}
          customers={customers}
          layers={layers}
          onSelect={setSelected}
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
      />

      {/* Top-right status bar */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <div className="bg-[#080808]/90 border border-[#1E1E1E] rounded px-3 py-1.5 flex items-center gap-2 backdrop-blur-sm">
          <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-[9px] uppercase tracking-widest font-bold text-[#444]">
            {loading ? 'Loading…' : 'Live'}
          </span>
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
    </div>
  )
}
