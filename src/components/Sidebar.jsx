import { useState } from 'react'
import { Ship, Anchor, Package, Users, TrendingUp, RefreshCw, Globe, Filter, Search, X, Layers } from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLOR = {
  active:       '#22c55e',
  'in-transit': '#3b82f6',
  idle:         '#f59e0b',
  maintenance:  '#ef4444',
  operational:  '#22c55e',
  congested:    '#ef4444',
  high:         '#ef4444',
}

const COMMODITY_CATEGORIES = ['All', 'Minerals', 'Agricultural', 'Chemicals', 'Maritime', 'Energy']

const CATEGORY_COLORS = {
  All:          '#FF6321',
  Minerals:     '#f59e0b',
  Agricultural: '#22c55e',
  Chemicals:    '#8b5cf6',
  Maritime:     '#3b82f6',
  Energy:       '#ef4444',
}

function StatTile({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-lg p-2.5 flex items-center gap-2.5">
      <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon size={12} style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[8px] uppercase tracking-widest text-[#444] font-bold">{label}</div>
        <div className="text-sm font-black text-[#FAFAFA] leading-tight">{value ?? '—'}</div>
        {sub && <div className="text-[8px] text-[#555] mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function Sidebar({
  stats, layers, onToggleLayer, onRefresh, loading, selectedItem, onClearSelection,
  searchQuery, onSearchChange, searchResults, onSearchSelect,
  activeCategory, onCategoryChange, countdown,
}) {
  const [searchFocused, setSearchFocused] = useState(false)

  const fmtValue = (v) => {
    if (!v) return '$0'
    const m = v / 1_000_000
    return m >= 1 ? `$${m.toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`
  }

  return (
    <div className="absolute top-0 left-0 h-full w-64 z-[1000] flex flex-col pointer-events-none">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="pointer-events-auto bg-[#080808]/95 border-r border-b border-[#1E1E1E] px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-[#FF6321]">
            <Globe size={12} className="text-black" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#FF6321]">EGG MAP</div>
            <div className="text-[8px] text-[#444] uppercase tracking-wider">Trade Intelligence</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!loading && (
              <span className="text-[8px] font-mono text-[#333]">{countdown}s</span>
            )}
            <button onClick={onRefresh} disabled={loading}
              className="text-[#444] hover:text-[#FF6321] transition-colors disabled:opacity-40">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="pointer-events-auto bg-[#080808]/95 border-r border-b border-[#1E1E1E] px-3 py-2 backdrop-blur-sm relative">
        <div className={clsx(
          'flex items-center gap-2 bg-[#111] border rounded px-2.5 py-1.5 transition-colors',
          searchFocused ? 'border-[#FF6321]/50' : 'border-[#1E1E1E]'
        )}>
          <Search size={10} className="text-[#444] flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search fleet, ports, countries…"
            className="bg-transparent text-[10px] text-[#FAFAFA] placeholder-[#333] outline-none w-full"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="text-[#444] hover:text-[#FAFAFA]">
              <X size={9} />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-[#111] border border-[#2A2A2A] rounded shadow-2xl z-10 overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onMouseDown={() => onSearchSelect(r)}
                className="w-full text-left px-3 py-2 hover:bg-[#1A1A1A] flex items-center gap-2 border-b border-[#1A1A1A] last:border-0"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-[#FAFAFA] truncate">{r.label}</div>
                  <div className="text-[8px] text-[#555] truncate">{r.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="pointer-events-auto bg-[#080808]/95 border-r border-[#1E1E1E] px-3 py-2.5 space-y-1.5 backdrop-blur-sm">
        <div className="text-[9px] uppercase tracking-widest text-[#333] font-bold mb-1.5 flex items-center gap-1.5">
          <TrendingUp size={9} /> Live Stats
        </div>
        <StatTile
          icon={Ship}
          label="Fleet"
          value={`${stats.fleet} vehicles`}
          sub={`${stats.vessels} vessels · ${stats.trucks} trucks`}
          color="#3b82f6"
        />
        <StatTile
          icon={Anchor}
          label="Ports"
          value={`${stats.ports} ports`}
          sub={stats.congested > 0 ? `${stats.congested} congested` : 'All clear'}
          color="#22c55e"
        />
        <StatTile
          icon={Package}
          label="Routes"
          value={`${stats.routeCount} routes`}
          sub={fmtValue(stats.totalValue) + ' total'}
          color="#FF6321"
        />
        <StatTile
          icon={Users}
          label="Customers"
          value={`${stats.customers} buyers`}
          sub={`${stats.countryCount} countries`}
          color="#8b5cf6"
        />
      </div>

      {/* ── Commodity Filter Chips ──────────────────────────────────────── */}
      <div className="pointer-events-auto bg-[#080808]/95 border-r border-[#1E1E1E] px-3 py-2.5 backdrop-blur-sm">
        <div className="text-[9px] uppercase tracking-widest text-[#333] font-bold mb-2 flex items-center gap-1.5">
          <Layers size={9} /> Commodity Filter
        </div>
        <div className="flex flex-wrap gap-1">
          {COMMODITY_CATEGORIES.map(cat => {
            const active = activeCategory === cat
            const color  = CATEGORY_COLORS[cat] || '#FF6321'
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={clsx(
                  'px-2 py-0.5 rounded text-[9px] font-bold border transition-all',
                  active
                    ? 'text-black border-transparent'
                    : 'bg-transparent text-[#555] border-[#1E1E1E] hover:text-[#888] hover:border-[#2A2A2A]'
                )}
                style={active ? { background: color, borderColor: color } : {}}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Layer Toggles ───────────────────────────────────────────────── */}
      <div className="pointer-events-auto bg-[#080808]/95 border-r border-[#1E1E1E] px-3 py-2.5 backdrop-blur-sm">
        <div className="text-[9px] uppercase tracking-widest text-[#333] font-bold mb-2 flex items-center gap-1.5">
          <Filter size={9} /> Layers
        </div>
        <div className="space-y-1">
          {[
            { key: 'fleet',     label: 'Fleet & Vehicles',    color: '#3b82f6' },
            { key: 'ports',     label: 'Ports',               color: '#22c55e' },
            { key: 'routes',    label: 'Trade Routes',        color: '#FF6321' },
            { key: 'customers', label: 'Customer Markets',    color: '#8b5cf6' },
            { key: 'heatmap',   label: 'Throughput Heatmap',  color: '#f59e0b' },
          ].map(({ key, label, color }) => (
            <button key={key} onClick={() => onToggleLayer(key)}
              className={clsx(
                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border',
                layers[key]
                  ? 'bg-[#1A1A1A] border-[#2A2A2A] text-[#FAFAFA]'
                  : 'bg-transparent border-transparent text-[#444]'
              )}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: layers[key] ? color : '#2A2A2A' }} />
              {label}
              <span className="ml-auto text-[8px]">{layers[key] ? 'ON' : 'OFF'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Fleet Status Legend ─────────────────────────────────────────── */}
      <div className="pointer-events-auto bg-[#080808]/95 border-r border-t border-[#1E1E1E] px-3 py-2.5 backdrop-blur-sm mt-auto">
        <div className="text-[8px] uppercase tracking-widest text-[#2A2A2A] font-bold mb-1.5">Fleet Status</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {[
            ['Active',      '#22c55e'],
            ['In-Transit',  '#3b82f6'],
            ['Idle',        '#f59e0b'],
            ['Maintenance', '#ef4444'],
            ['In Port',     '#8b5cf6'],
          ].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[8px] text-[#444]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
