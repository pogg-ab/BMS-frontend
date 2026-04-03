import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000'

interface UnitCard {
  id: string
  unit_number: string
  floor: number
  type: string
  status: string
  size_sqm: number
  bedrooms: number
  bathrooms: number
  rent_price: number
  image_url?: string
  amenities: { id: string; name: string }[]
  assets: { id: string; name: string; category: string }[]
}

interface BuildingInfo {
  id: string
  name: string
  address: string
  image_url?: string
}

export default function PublicBuildingView() {
  const { token } = useParams<{ token: string }>()
  const [building, setBuilding] = useState<BuildingInfo | null>(null)
  const [units, setUnits] = useState<UnitCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`${API_BASE}/public/building/${token}/units`)
      .then(r => {
        if (!r.ok) throw new Error('Invalid or expired QR code')
        return r.json()
      })
      .then(data => {
        setBuilding(data.building || null)
        const allUnits = Array.isArray(data.units) ? data.units : []
        const vacantOnly = allUnits.filter(u => 
          ['vacant', 'available', 'free'].includes((u.status || '').toLowerCase())
        )
        setUnits(vacantOnly)
      })
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [token])

  const grouped = units.reduce<Record<string, UnitCard[]>>((acc, u) => {
    const key = u.floor != null ? `Floor ${u.floor}` : 'Other'
    ;(acc[key] = acc[key] || []).push(u)
    return acc
  }, {})

  const statusColor = (s: string) => {
    const l = (s || '').toLowerCase()
    if (['vacant', 'available', 'free'].includes(l)) return '#22c55e'
    if (['occupied', 'rented'].includes(l)) return '#ef4444'
    return '#6b7280'
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p style={{ color: '#94a3b8', marginTop: 16 }}>Loading building info...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ color: '#ef4444', margin: 0 }}>{error}</h2>
        <p style={{ color: '#94a3b8', marginTop: 8 }}>Please scan a valid building QR code.</p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        {building?.image_url && (
          <img
            src={`${API_BASE}${building.image_url}`}
            alt={building.name}
            style={styles.headerImg}
          />
        )}
        <div>
          <h1 style={styles.title}>{building?.name || 'Building'}</h1>
          {building?.address && <p style={styles.subtitle}>{building.address}</p>}
          <p style={styles.badge}>{units.length} unit{units.length !== 1 ? 's' : ''}</p>
        </div>
      </header>

      {/* Units grouped by floor */}
      {Object.keys(grouped).sort().map(floor => (
        <section key={floor} style={{ marginBottom: 28 }}>
          <h2 style={styles.floorLabel}>{floor}</h2>
          <div style={styles.grid}>
            {grouped[floor].map(u => (
              <div key={u.id} style={styles.card}>
                {u.image_url ? (
                  <img src={`${API_BASE}${u.image_url}`} alt={u.unit_number} style={styles.cardImg} />
                ) : (
                  <div style={styles.cardImgPlaceholder}>🏠</div>
                )}
                <div style={styles.cardBody}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={styles.unitNumber}>{u.unit_number}</h3>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: statusColor(u.status) + '20',
                      color: statusColor(u.status),
                      borderColor: statusColor(u.status) + '40',
                    }}>
                      {u.status || 'N/A'}
                    </span>
                  </div>
                  <p style={styles.unitType}>{u.type}</p>
                  <div style={styles.detailRow}>
                    {u.size_sqm != null && <span>📐 {u.size_sqm} sqm</span>}
                    {u.bedrooms != null && <span>🛏️ {u.bedrooms} bed</span>}
                    {u.bathrooms != null && <span>🚿 {u.bathrooms} bath</span>}
                  </div>
                    <p style={styles.price}>
                      ETB {Number(u.rent_price).toLocaleString()}<span style={{ fontSize: 12, color: '#94a3b8' }}>/mo</span>
                    </p>

                  {/* Highlights */}
                  <div style={styles.highlights}>
                    {u.amenities?.slice(0, 2).map(a => (
                      <span key={a.id} style={styles.hBadge}>✨ {a.name}</span>
                    ))}
                    {u.assets?.slice(0, 2).map(a => (
                      <span key={a.id} style={styles.hBadge}>📦 {a.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {units.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          No vacant units found for this building.
        </div>
      )}

      <footer style={styles.footer}>
        Powered by BMS · Building Management System
      </footer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '24px 16px',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    color: '#f1f5f9',
  },
  center: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#f1f5f9',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #334155',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
    padding: '20px 24px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  headerImg: {
    width: 72,
    height: 72,
    borderRadius: 12,
    objectFit: 'cover' as const,
    border: '2px solid rgba(255,255,255,0.1)',
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700 },
  subtitle: { margin: '4px 0 0', fontSize: 13, color: '#94a3b8' },
  badge: {
    display: 'inline-block',
    marginTop: 6,
    padding: '2px 10px',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 20,
    background: 'rgba(99,102,241,0.2)',
    color: '#818cf8',
  },
  floorLabel: {
    fontSize: 14,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    color: '#64748b',
    marginBottom: 12,
    paddingLeft: 4,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
  },
  card: {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardImg: { width: '100%', height: 140, objectFit: 'cover' as const },
  cardImgPlaceholder: {
    width: '100%',
    height: 140,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    background: 'rgba(255,255,255,0.03)',
  },
  cardBody: { padding: '14px 16px 18px' },
  unitNumber: { margin: 0, fontSize: 16, fontWeight: 700 },
  statusBadge: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    padding: '3px 8px',
    borderRadius: 6,
    border: '1px solid',
  },
  unitType: { margin: '2px 0 8px', fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' as const },
  detailRow: {
    display: 'flex',
    gap: 12,
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  price: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: '#a5f3fc',
    marginBottom: 8,
  },
  highlights: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  hBadge: {
    fontSize: 9,
    fontWeight: 700,
    background: 'rgba(255,255,255,0.05)',
    padding: '2px 8px',
    borderRadius: 6,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
  },
  footer: {
    textAlign: 'center' as const,
    padding: '32px 0 16px',
    fontSize: 11,
    color: '#475569',
    letterSpacing: 0.5,
  },
}
