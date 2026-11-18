export const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
export const DAY_NAMES: Record<string, string> = { MO: 'Dushanba', TU: 'Seshanba', WE: 'Chorshanba', TH: 'Payshanba', FR: 'Juma', SA: 'Shanba' }
export const todayCode = () => DAY_CODES[new Date().getDay()]
export const som = (n: number) => Math.round(n).toLocaleString('ru-RU') + ' so‘m'
export const fmtDate = (d: string) => (d ? d.split('-').reverse().join('.') : '—')
export const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
export const monthName = (mk: string) => { const [y, m] = mk.split('-'); return `${MONTHS[Number(m) - 1] ?? mk} ${y}` }
