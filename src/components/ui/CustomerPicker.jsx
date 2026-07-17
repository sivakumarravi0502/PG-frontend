import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import api from '../../api/axios';

// Type-to-search customer lookup — reused anywhere a customer needs to be
// linked (Referred By here, Data Entry's customer lookup later) so staff
// never has to know an internal ID or browse a separate list.
export default function CustomerPicker({ value, onChange, placeholder = 'Search name, mobile, or customer code...', excludeId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/customers/search', { params: { q: query } });
        setResults(data.data.filter(c => c.id !== excludeId));
      } catch { /* silent */ }
    }, 250);
    return () => clearTimeout(t);
  }, [query, excludeId]);

  if (value) {
    return (
      <div className="form-input flex items-center justify-between">
        <span className="truncate">{value.name} <span className="text-muted-foreground">({value.customer_code})</span></span>
        <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-destructive shrink-0 ml-2" aria-label="Clear">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={boxRef}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        className="form-input pl-9"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto card shadow-lg py-1">
          {results.map(c => (
            <button
              key={c.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => { onChange(c); setQuery(''); setOpen(false); }}
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.customer_code} · {c.whatsapp_no}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
