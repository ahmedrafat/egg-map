import { X, Anchor, Ship, Package, TrendingUp, Activity } from 'lucide-react'

const CONGESTION_COLOR = {
  low:         '#22c55e',
  moderate:    '#f59e0b',
  high:        '#ef4444',
  congested:   '#ef4444',
  operational: '#22c55e',
}

const STATUS_COLOR = {
  active:       '#22c55e',
  'in-transit': '#3b82f6',
  idle:         '#f59e0b',
  maintenance:  '#ef4444',
  'in-port':    '#8b5cf6',
  delivered:    '#6b7280',
}

function Row({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[#1A1A1A] last:border-0">
      <span className="text-[9px] text-[#555] uppercase tracking-wider">{label}</span>
      <span className="text-[10px] font-bold" style={{ color: color || '#FAFAFA' }}>{value ?? '—'}</span>
    </div>
  )
}

function OrderChip({ order }) {
  const fmtVal = v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`
  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded px-2 py-1.5 mb-1 last:mb-0">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-bold text-[#888]">{order.order_no || order.id}</span>
        {order.value && <span className="text-[9px] text-[#FF6321] font-black">{fmtVal(Number(order.value))}</span>}
      </div>
      {order.commodity && <div className="text-[8px] text-[#555]">{order.commodity}</div>}
      {order.status    && <div className="text-[8px] text-[#444] capitalize mt-0.5">{order.status}</div>}
    </div>
  )
}

export default function RightPanel({ item, portOrders, onClose }) {
  if (!item) return null

  const isPort   = item.type === 'Port'
  const isFleet  = item.type === 'vessel' || item.type === 'ship' || item.type === 'truck' || item.type === 'Vehicle'
  const isMarket = item.type === 'Market'

  const congColor = CONGESTION_COLOR[item.congestion_level] || '#22c55e'
  const statColor = STATUS_COLOR[item.status?.toLowerCase()] || '#6b7280'

  return (
    <div
      className="right-panel-enter absolute top-0 right-0 h-full w-72 z-[1001] flex flex-col pointer-events-auto"
      style={{ background: 'rgba(8,8,8,0.97)', borderLeft: '1px solid #1E1E1E' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E1E1E]">
        <div
          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: isPort ? '#22c55e18' : isMarket ? '#8b5cf618' : '#3b82f618' }}
        >
          {isPort   && <Anchor size={12} className="text-[#22c55e]" />}
          {isFleet  && <Ship   size={12} className="text-[#3b82f6]" />}
          {isMarket && <TrendingUp size={12} className="text-[#8b5cf6]" />}
          {!isPort && !isFleet && !isMarket && <Package size={12} className="text-[#FF6321]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-[#FAFAFA] truncate">{item.name}</div>
          <div className="text-[8px] text-[#444] uppercase tracking-wider">{item.type}</div>
        </div>
        <button onClick={onClose} className="text-[#444] hover:text-[#FAFAFA] transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* ── Port details ──────────────────────────────────────────────── */}
        {isPort && (
          <>
            <section>
              <div className="text-[8px] uppercase tracking-widest text-[#333] font-bold mb-2 flex items-center gap-1.5">
                <Anchor size={8} /> Port Info
              </div>
              <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg px-3 py-2">
                <Row label="Code"    value={item.code} />
                <Row label="Country" value={item.country} />
                {item.vessels_in_port != null && (
                  <Row label="Vessels in port" value={item.vessels_in_port} color="#22c55e" />
                )}
                {item.berths_total != null && (
                  <Row
                    label="Berths"
                    value={`${item.berths_occupied ?? '?'} / ${item.berths_total}`}
                    color={item.berths_occupied >= item.berths_total ? '#ef4444' : '#f59e0b'}
                  />
                )}
                {item.daily_throughput != null && (
                  <Row label="Daily throughput" value={`${item.daily_throughput?.toLocaleString()} t/day`} color="#3b82f6" />
                )}
                <Row
                  label="Congestion"
                  value={(item.congestion_level || item.status || '—')}
                  color={congColor}
                />
              </div>
            </section>

            {/* Congestion indicator bar */}
            <section>
              <div className="text-[8px] uppercase tracking-widest text-[#333] font-bold mb-2 flex items-center gap-1.5">
                <Activity size={8} /> Congestion Level
              </div>
              <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    background: congColor,
                    width: item.congestion_level === 'high' || item.congestion_level === 'congested'
                      ? '90%'
                      : item.congestion_level === 'moderate'
                      ? '55%'
                      : '20%',
                  }}
                />
              </div>
              <div className="mt-1 text-[8px] capitalize" style={{ color: congColor }}>
                {item.congestion_level || item.status || 'Unknown'}
              </div>
            </section>

            {/* Active orders */}
            {portOrders.length > 0 && (
              <section>
                <div className="text-[8px] uppercase tracking-widest text-[#333] font-bold mb-2 flex items-center gap-1.5">
                  <Package size={8} /> Active Orders ({portOrders.length})
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {portOrders.map(o => <OrderChip key={o.id} order={o} />)}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Fleet details ─────────────────────────────────────────────── */}
        {isFleet && (
          <section>
            <div className="text-[8px] uppercase tracking-widest text-[#333] font-bold mb-2 flex items-center gap-1.5">
              <Ship size={8} /> Vessel Info
            </div>
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg px-3 py-2">
              <Row label="Type"     value={item.type}    />
              <Row label="Status"   value={item.status}  color={statColor} />
              {item.flag         && <Row label="Flag"     value={item.flag} />}
              {item.cargo        && <Row label="Cargo"    value={item.cargo}     color="#FF6321" />}
              {item.speed != null && <Row label="Speed"   value={`${item.speed} km/h`} />}
              {item.capacity     && <Row label="Capacity" value={item.capacity}  />}
              {item.current_port && <Row label="Port"     value={item.current_port} color="#22c55e" />}
            </div>
          </section>
        )}

        {/* ── Market details ────────────────────────────────────────────── */}
        {isMarket && (
          <section>
            <div className="text-[8px] uppercase tracking-widest text-[#333] font-bold mb-2 flex items-center gap-1.5">
              <TrendingUp size={8} /> Market Info
            </div>
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg px-3 py-2">
              <Row label="Country"   value={item.country} />
              <Row label="Customers" value={item.orderCount} color="#8b5cf6" />
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
