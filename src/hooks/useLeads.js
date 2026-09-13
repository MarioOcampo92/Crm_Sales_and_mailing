import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SOCIAL_DOMAINS = [
  'instagram.com', 'facebook.com', 'fb.com', 'wa.me',
  'booksy.com', 'ivof.com', 'wixsite.com', 'estetical.es',
  'negocioscerca.es', 'wwwcafe.de', 'walink.co',
];

export function classifyOpportunity(tieneWeb, url) {
  if (tieneWeb !== 'Sí' || !url) return 'web+llamadas';
  const lower = url.toLowerCase();
  if (SOCIAL_DOMAINS.some((d) => lower.includes(d))) return 'web+llamadas';
  return 'solo-llamadas';
}

export function useLeads(nichoFilter = 'all') {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [nichos, setNichos]   = useState([]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);

    const { data: allData, error: allErr } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: true });

    if (allErr) {
      setError(allErr.message);
      setLeads([]);
      setLoading(false);
      return;
    }

    const allLeads = allData || [];
    const uniqueNichos = [...new Set(allLeads.map((l) => l.nicho).filter(Boolean))].sort();
    setNichos(uniqueNichos);

    const filtered = nichoFilter === 'all'
      ? allLeads
      : allLeads.filter((l) => l.nicho === nichoFilter);

    setLeads(filtered);
    setError(null);
    setLoading(false);
  }, [nichoFilter]);

  // Carga inicial
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // ── Realtime: escuchar cambios en la tabla leads ──
  useEffect(() => {
    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            // Si cambia el nicho y no encaja con el filtro actual, quitarlo de la lista
            setLeads((prev) => {
              const exists = prev.some((l) => l.id === updated.id);
              if (nichoFilter !== 'all' && updated.nicho !== nichoFilter) {
                // El lead ya no pertenece a este filtro → quitarlo
                return prev.filter((l) => l.id !== updated.id);
              }
              if (exists) {
                return prev.map((l) => l.id === updated.id ? updated : l);
              }
              // Nuevo lead que ahora encaja con el filtro (cambio de nicho)
              return [...prev, updated];
            });
          } else if (payload.eventType === 'INSERT') {
            const inserted = payload.new;
            if (nichoFilter === 'all' || inserted.nicho === nichoFilter) {
              setLeads((prev) => {
                if (prev.some((l) => l.id === inserted.id)) return prev; // evitar duplicados
                return [...prev, inserted];
              });
            }
            // Actualizar nichos únicos si aparece uno nuevo
            setNichos((prev) => {
              if (inserted.nicho && !prev.includes(inserted.nicho)) {
                return [...prev, inserted.nicho].sort();
              }
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            setLeads((prev) => prev.filter((l) => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [nichoFilter]);

  const updateLeadStatus = useCallback(async (leadId, newStatus, newVendedor) => {
    const updates = { status: newStatus };
    if (newVendedor !== undefined) {
      updates.vendedor = newVendedor;
    }

    const { error: err } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId);

    if (err) {
      console.error('Error actualizando lead:', err.message);
      return false;
    }

    // Enviar email si hay un nuevo vendedor asignado
    if (newVendedor !== undefined) {
      setLeads((prev) => {
        const lead = prev.find(l => l.id === leadId);
        if (lead && newVendedor && lead.vendedor !== newVendedor) {
          import('../lib/email').then(({ notificarAsignacion }) => {
            import('../data/vendedores').then(({ getVendedor }) => {
              const vend = getVendedor(newVendedor);
              if (vend) {
                notificarAsignacion({
                  vendedorNombre: vend.nombre,
                  vendedorEmail: vend.email,
                  leadNombre: lead.nombre,
                  leadZona: lead.zona,
                  leadTelefono: lead.telefono,
                  leadOportunidad: classifyOpportunity(lead.tiene_web, lead.website_url)
                });
              }
            });
          });
        }
        return prev;
      });
    }

    // El update local llega vía Realtime, no hace falta actualizar estado manualmente
    return true;
  }, []);

  const deleteLead = useCallback(async (leadId) => {
    const { error: err } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (err) {
      console.error('Error eliminando lead:', err.message);
      return false;
    }
    return true;
  }, []);

  return { leads, loading, error, nichos, refetch: fetchLeads, updateLeadStatus, deleteLead };
}
