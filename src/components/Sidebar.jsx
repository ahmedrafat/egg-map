import { Ship, Anchor, Package, Users, TrendingUp, RefreshCw, Globe, Filter, X } from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLOR = {
  active:      '#22c55e',
  'in-transit': '#3b82f6',
  idle:        '#f59e0b',
  maintenance: '#ef4444',
  operational: '#22c55e',
  congested:   '#ef4444',
  high:        '#f59e0b',
}

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-lg p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-widest text-[#444] font-bold">{label}</div>
        <div className="text-base font-black text-[#FAFAFA] leading-tight">{value ?? '—'}</div>
      </div>
    </div>
  )
}

export default function Sidebar({ stats, layers, onToggleLayer, onRefresh, loading, selectedItem, onClearSelection }) {
  return (
    <div className="absolute top-0 left-0 h-full w-64 z-[1000] flex flex-col pointer-events-none">
      {/* Header */}
      <div className="pointer-events-auto bg-[#080808]/95 border-r border-b border-[#1E1E1E] px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-[#FF6321]">
            <Globe size={12} className="text-black" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#FF6321]">EGG MAP</div>
            <div className="text-[8px] text-[#444] uppercase tracking-wider">Trade Intelligence</div>
          </div>
          <button onClick={onRefresh} disabled={loading}
            className="ml-auto text-[#444] hover:text-[#FF6321] transition-colors disabled:opacity-40">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="pointer-events-auto bg-[#080808]/95 border-r border-[#1E1E1E] px-3 py-3 space-y-2 backdrop-blur-sm">
        <div className="text-[9px] uppercase tracking-widest text-[#333] font-bold mb-2 flex items-center gap-1.5">
          <TrendingUp size={9} /> Live Stats
        </div>
        <StatTile icon={Ship}    label="Fleet"      value={stats.fleet}     color="#3b82f6" />
        <StatTile icon={Anchor}  label="Ports"      value={stats.ports}     color="#22c55e" />
        <StatTile icon={Package} label="Orders"     value={stats.orders}    color="#FF6321" />
        <StatTile icon={Users}   label="Customers"  value={stats.customers} color="#8b5cf6" />
      </div>

      {/* Layer toggles */}
      <div className="pointer-events-auto bg-[#080808]/95 border-r border-[#1E1E1E] px-3 py-3 backdrop-blur-sm">
        <div className="text-[9px] uppercase tracking-widest text-[#333] font-bold mb-2 flex items-center gap-1.5">
          <Filter size={9} /> Layers
        </div>
        <div className="space-y-1">
          {[
            { key: 'fleet',     label: 'Fleet & Vehicles',  color: '#3b82f6' },
            { key: 'ports',     label: 'Ports',             color: '#22c55e' },
            { key: 'routes',    label: 'Trade Routes',      color: '#FF6321' },
            { key: 'customers', label: 'Customer Markets',  color: '#8b5cf6' },
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

      {/* Selected item detail */}
      {selectedItem && (
        <div className="pointer-events-auto bg-[#080808]/95 border-r border-t border-[#1E1E1E] px-3 py-3 backdrop-blur-sm mt-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[9px] uppercase tracking-widest text-[#333] font-bold">Selected</div>
            <button onClick={onClearSelection} className="text-[#444] hover:text-[#FAFAFA]"><X size={10} /></button>
          </div>
          <div className="text-xs font-black text-[#FAFAFA] mb-1">{selectedItem.name}</div>
          {selectedItem.type && <div className="text-[9px] text-[#555] uppercase">{selectedItem.type}</div>}
          {selectedItem.status && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[selectedItem.status] || '#666' }} />
              <span className="text-[9px] text-[#888] capitalize">{selectedItem.status}</span>
            </div>
          )}
          {selectedItem.cargo && <div className="text-[9px] text-[#555] mt-1">Cargo: <span className="text-[#888]">{selectedItem.cargo}</span></div>}
          {selectedItem.country && <div className="text-[9px] text-[#555] mt-1">Country: <span className="text-[#888]">{selectedItem.country}</span></div>}
          {selectedItem.orderCount && <div className="text-[9px] text-[#555] mt-1">Orders: <span className="text-[#FF6321] font-bold">{selectedItem.orderCount}</span></div>}
          {selectedItem.vessels_in_port != null && <div className="text-[9px] text-[#555] mt-1">Vessels in port: <span className="text-[#22c55e] font-bold">{selectedItem.vessels_in_port}</span></div>}
        </div>
      )}

      {/* Legend */}
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
