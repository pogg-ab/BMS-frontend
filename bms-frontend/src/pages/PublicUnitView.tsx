import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  Home, 
  Building2, 
  Maximize, 
  Bed, 
  Bath, 
  ChevronLeft, 
  Wifi, 
  Tv, 
  Coffee, 
  Refrigerator, 
  Sofa, 
  Utensils, 
  Box,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000'

interface Asset {
  id: string
  name: string
  category: string
  image_url?: string
}

interface Amenity {
  id: string
  name: string
}

interface UnitDetail {
  id: string
  unit_number: string
  type: string
  size_sqm: number
  bedrooms: number
  bathrooms: number
  rent_price: number
  image_url?: string
  status: string
  building: {
    id: string
    name: string
    address: string
  }
  amenities: Amenity[]
  assets: Asset[]
}

export default function PublicUnitView() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<UnitDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`${API_BASE}/public/q/${token}`)
      .then(r => {
        if (!r.ok) throw new Error('Invalid or expired QR code')
        return r.json()
      })
      .then(res => {
        if (!res.unit) throw new Error('Unit data not found')
        setData(res.unit)
      })
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p style={{ color: '#94a3b8', marginTop: 16 }}>Syncing digital twin...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={styles.center}>
         <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
         <h2 style={{ color: '#ef4444', margin: 0 }}>Access Denied</h2>
         <p style={{ color: '#94a3b8', marginTop: 8 }}>{error || 'This QR code is no longer active.'}</p>
         <Link to="/" style={styles.backButton}>Return Home</Link>
      </div>
    )
  }

  const assetIcon = (cat: string) => {
    const c = (cat || '').toLowerCase()
    if (c.includes('appliance')) return <Refrigerator size={18} />
    if (c.includes('furniture')) return <Sofa size={18} />
    if (c.includes('equipment')) return <Box size={18} />
    if (c.includes('electronics') || c.includes('tv')) return <Tv size={18} />
    return <Box size={18} />
  }

  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <div style={styles.hero}>
        {data.image_url ? (
          <img src={`${API_BASE}${data.image_url}`} style={styles.heroImg} alt={data.unit_number} />
        ) : (
          <div style={styles.heroImgPlaceholder}>
            <Home size={80} color="rgba(255,255,255,0.1)" />
          </div>
        )}
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <div style={styles.badge}>UNIT {data.unit_number}</div>
          <h1 style={styles.title}>{data.type} at {data.building.name}</h1>
          <p style={styles.address}>{data.building.address}</p>
        </div>
      </div>

      <div style={styles.container}>
        {/* Specs Grid */}
        <div style={styles.specGrid}>
          <div style={styles.specCard}>
             <Maximize size={20} color="#818cf8" />
             <div>
               <p style={styles.specLabel}>SIZE</p>
               <p style={styles.specVal}>{data.size_sqm} sqm</p>
             </div>
          </div>
          <div style={styles.specCard}>
             <Bed size={20} color="#818cf8" />
             <div>
               <p style={styles.specLabel}>BEDS</p>
               <p style={styles.specVal}>{data.bedrooms}</p>
             </div>
          </div>
          <div style={styles.specCard}>
             <Bath size={20} color="#818cf8" />
             <div>
               <p style={styles.specLabel}>BATHS</p>
               <p style={styles.specVal}>{data.bathrooms}</p>
             </div>
          </div>
        </div>

        {/* Pricing & Status */}
        <div style={styles.priceRow}>
           <div>
             <p style={styles.priceLabel}>MONTHLY RENT</p>
             <h2 style={styles.price}>ETB {Number(data.rent_price).toLocaleString()}</h2>
           </div>
           <div style={{
             ...styles.statusBadge,
             backgroundColor: data.status.toLowerCase() === 'vacant' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
             color: data.status.toLowerCase() === 'vacant' ? '#22c55e' : '#ef4444',
             borderColor: data.status.toLowerCase() === 'vacant' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
           }}>
             {data.status}
           </div>
        </div>

        {/* Assets Section */}
        {data.assets.length > 0 && (
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Physical Assets <span style={styles.sectionCount}>{data.assets.length}</span></h3>
            <div style={styles.assetGrid}>
              {data.assets.map(asset => (
                <div key={asset.id} style={styles.assetCard}>
                   <div style={styles.assetIconWrapper}>{assetIcon(asset.category)}</div>
                   <div>
                     <p style={styles.assetName}>{asset.name}</p>
                     <p style={styles.assetCat}>{asset.category}</p>
                   </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Amenities Section */}
        {data.amenities.length > 0 && (
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Building Amenities</h3>
            <div style={styles.amenityList}>
              {data.amenities.map(amenity => (
                <div key={amenity.id} style={styles.amenityChip}>
                  <CheckCircle2 size={14} color="#818cf8" />
                  <span>{amenity.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={styles.actions}>
           <button style={styles.primaryAction}>Contact Leasing Agent</button>
           <button style={styles.secondaryAction}>Virtual Tour</button>
        </div>
      </div>

      <footer style={styles.footer}>
        Powered by BMS · Digital Twin QR System
      </footer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#f1f5f9',
    fontFamily: "'Inter', sans-serif",
  },
  center: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#0f172a',
    color: '#f1f5f9',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid rgba(255,255,255,0.1)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  hero: {
    height: '40vh',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  heroImgPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(15,23,42,0) 0%, rgba(15,23,42,0.9) 100%)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  badge: {
    display: 'inline-block',
    background: '#6366f1',
    color: 'white',
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: { margin: 0, fontSize: 24, fontWeight: 800, lineHeight: 1.2 },
  address: { margin: '4px 0 0', fontSize: 13, color: '#94a3b8' },
  container: {
    padding: 24,
    maxWidth: 600,
    margin: '0 auto',
  },
  specGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 32,
  },
  specCard: {
    background: 'rgba(255,255,255,0.05)',
    padding: '16px 12px',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  specLabel: { margin: 0, fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: 1 },
  specVal: { margin: 0, fontSize: 14, fontWeight: 700 },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(99,102,241,0.05)',
    padding: 20,
    borderRadius: 20,
    border: '1px solid rgba(99,102,241,0.1)',
    marginBottom: 32,
  },
  priceLabel: { margin: 0, fontSize: 10, fontWeight: 800, color: '#818cf8', letterSpacing: 0.5 },
  price: { margin: 0, fontSize: 22, fontWeight: 900, color: '#f1f5f9' },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 700,
    border: '1px solid',
    textTransform: 'uppercase',
  },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  sectionCount: { background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 6, fontSize: 11, color: '#94a3b8' },
  assetGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  assetCard: {
    background: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  assetIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#818cf8',
  },
  assetName: { margin: 0, fontSize: 13, fontWeight: 600 },
  assetCat: { margin: 0, fontSize: 10, color: '#64748b' },
  amenityList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    background: 'rgba(255,255,255,0.05)',
    padding: '6px 14px',
    borderRadius: 10,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 40,
  },
  primaryAction: {
    background: '#6366f1',
    color: 'white',
    border: 'none',
    padding: '16px',
    borderRadius: 16,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(99,102,241,0.3)',
  },
  secondaryAction: {
    background: 'transparent',
    color: '#f1f5f9',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '16px',
    borderRadius: 16,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  backButton: {
    marginTop: 24,
    color: '#6366f1',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },
  footer: {
    textAlign: 'center',
    padding: '40px 0 20px',
    fontSize: 11,
    color: '#475569',
    letterSpacing: 0.5,
  },
}
