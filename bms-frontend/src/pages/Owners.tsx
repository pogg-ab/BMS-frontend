import React, { useEffect, useState } from 'react'
import { listOwners, createOwner, updateOwner, deleteOwner } from '../api/owners'

type Owner = {
  id: string
  name: string
  email?: string
  phone?: string
}

export default function Owners() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Owner | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await listOwners()
      let list: any[] = []
      if (Array.isArray(res)) list = res
      else if (res && Array.isArray((res as any).data)) list = (res as any).data
      else list = []
      setOwners(list)
    } catch (e:any) {
      console.error('load owners', e)
      alert('Failed to load owners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setEmail('')
    setPhone('')
    setShowForm(true)
  }

  function openEdit(o: Owner) {
    setEditing(o)
    setName(o.name || '')
    setEmail(o.email || '')
    setPhone(o.phone || '')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        await updateOwner(editing.id, { name, email, phone })
        alert('Owner updated')
      } else {
        await createOwner({ name, email, phone })
        alert('Owner created')
      }
      setShowForm(false)
      load()
    } catch (err:any) {
      console.error('owner submit', err)
      alert(err?.response?.data?.message || 'Operation failed')
    }
  }

  async function handleDelete(id:string) {
    if (!confirm('Delete this owner? This will fail if owner has buildings.')) return
    try {
      await deleteOwner(id)
      alert('Owner deleted')
      load()
    } catch (e:any) {
      console.error('delete owner', e)
      alert(e?.response?.data?.message || 'Failed to delete owner')
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="text-2xl font-bold">Owners</h1>
        <div>
          <button className="button" onClick={openCreate}>Create Owner</button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4">
          <h2 className="text-lg font-medium">{editing ? 'Edit Owner' : 'Create Owner'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div className="flex items-center gap-2">
              <button className="button" type="submit">{editing ? 'Save' : 'Create'}</button>
              <button type="button" className="px-3 py-1 border rounded" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading && <div>Loading...</div>}
        {!loading && owners.length === 0 && <div className="muted">No owners found</div>}
        {!loading && owners.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Phone</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {owners.map(o => (
                <tr key={o.id} className="border-b hover:bg-slate-50">
                  <td className="py-2">{o.name}</td>
                  <td className="py-2">{o.email || '-'}</td>
                  <td className="py-2">{o.phone || '-'}</td>
                  <td className="py-2">
                    <button className="mr-2 text-primary" onClick={() => openEdit(o)}>Edit</button>
                    <button className="text-red-700 ml-2" onClick={() => handleDelete(o.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
