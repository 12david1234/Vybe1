export function slugify(s){return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,90)}
export function eventIsLive(e){return new Date(e.starts_at).getTime()+86400000>Date.now()}
export function money(amount,currency='USD'){return new Intl.NumberFormat(undefined,{style:'currency',currency}).format(Number(amount||0))}
