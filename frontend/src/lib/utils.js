import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatCurrency(amount, currency = 'TRY') {
  const symbols = { TRY: '₺', USD: '$', EUR: '€' };
  return `${symbols[currency] || ''}${amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0.00'}`;
}

export function getStatusColor(status) {
  const colors = {
    // Project statuses
    planning: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    on_hold: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    
    // Part statuses
    pending: 'bg-gray-100 text-gray-700',
    in_production: 'bg-blue-100 text-blue-700',
    quality_check: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
    
    // Order statuses
    confirmed: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    
    // Quote statuses
    requested: 'bg-gray-100 text-gray-700',
    received: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-amber-100 text-amber-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getStatusLabel(status) {
  const labels = {
    // Project
    planning: 'Planlama',
    in_progress: 'Devam Ediyor',
    completed: 'Tamamlandı',
    on_hold: 'Beklemede',
    cancelled: 'İptal',
    
    // Part
    pending: 'Bekliyor',
    in_production: 'Üretimde',
    quality_check: 'Kalite Kontrol',
    rejected: 'Reddedildi',
    
    // Order
    confirmed: 'Onaylandı',
    shipped: 'Sevk Edildi',
    delivered: 'Teslim Edildi',
    
    // Quote
    requested: 'Talep Edildi',
    received: 'Alındı',
    approved: 'Onaylandı',
    expired: 'Süresi Doldu',
  };
  return labels[status] || status;
}

export function getScoreClass(score) {
  if (score >= 90) return 'score-excellent';
  if (score >= 75) return 'score-good';
  if (score >= 60) return 'score-average';
  return 'score-poor';
}

export function getScoreStars(score) {
  if (score >= 90) return '⭐⭐⭐';
  if (score >= 75) return '⭐⭐';
  if (score >= 60) return '⭐';
  return '⚠️';
}

export function calculateDaysRemaining(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export function getMethodCategory(code) {
  const codeNum = parseInt(code);
  if (codeNum >= 1000 && codeNum < 2000) return 'Metal Şekillendirme';
  if (codeNum >= 2000 && codeNum < 3000) return 'Kaynak';
  if (codeNum >= 3000 && codeNum < 4000) return 'Talaşlı İmalat';
  if (codeNum >= 4000 && codeNum < 5000) return '3D Baskı';
  if (codeNum >= 5000 && codeNum < 6000) return 'Yüzey İşlemi';
  if (codeNum >= 9000) return 'Hazır Malzeme';
  return 'Diğer';
}

export function getGanttBarClass(category) {
  const classes = {
    'Metal Şekillendirme': 'gantt-bar-metal',
    'Kaynak': 'gantt-bar-welding',
    'Talaşlı İmalat': 'gantt-bar-machining',
    '3D Baskı': 'gantt-bar-3dprint',
    'Yüzey İşlemi': 'gantt-bar-surface',
    'Hazır Malzeme': 'gantt-bar-material',
  };
  return classes[category] || 'gantt-bar-metal';
}
