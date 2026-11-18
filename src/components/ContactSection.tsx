import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { api } from '../lib/api';
import { CONTACT_TOPICS, SAUDI_REGIONS_13 } from '../lib/marketplace-tools';
import type { PageView } from '../lib/router';

interface ContactSectionProps {
  onNavigate?: (page: PageView) => void;
  onNotify: (msg: string) => void;
  embedded?: boolean;
}

type PreferredReplyChannel = 'whatsapp' | 'phone' | 'email';

const SUPPORT_PHONE_DISPLAY = '9200 18420';
const SUPPORT_PHONE_TEL = 'tel:920018420';
const SUPPORT_WHATSAPP_DISPLAY = '0500 842 910';
const SUPPORT_WHATSAPP_INTL = '966500842910';
const SUPPORT_EMAIL = 'support@souqalghanam.sa';

const REPLY_CHANNELS: Array<{
  id: PreferredReplyChannel;
  label: string;
  icon: typeof MessageCircle;
}> = [
  { id: 'whatsapp', label: 'واتساب', icon: MessageCircle },
  { id: 'phone', label: 'اتصال هاتفي', icon: Phone },
  { id: 'email', label: 'بريد إلكتروني', icon: Mail },
];

const SOCIAL_CHANNELS = [
  {
    id: 'whatsapp',
    label: 'واتساب المباشر',
    handle: SUPPORT_WHATSAPP_DISPLAY,
    href: `https://wa.me/${SUPPORT_WHATSAPP_INTL}?text=${encodeURIComponent(
      'السلام عليكم، أتواصل مع فريق دعم سوق الغنم للاستفسار.'
    )}`,
  },
  {
    id: 'x',
    label: 'منصة إكس (X)',
    handle: '@SouqAlGhanam',
    href: 'https://x.com',
  },
  {
    id: 'instagram',
    label: 'إنستغرام',
    handle: '@souqalghanam.sa',
    href: 'https://www.instagram.com',
  },
  {
    id: 'tiktok',
    label: 'تيك توك',
    handle: '@souqalghanam',
    href: 'https://www.tiktok.com',
  },
  {
    id: 'youtube',
    label: 'يوتيوب',
    handle: 'سوق الغنم',
    href: 'https://www.youtube.com',
  },
] as const;

export function ContactSection({ onNavigate, onNotify, embedded = true }: ContactSectionProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [topic, setTopic] = useState<string>(CONTACT_TOPICS[0]);
  const [region, setRegion] = useState<string>('');
  const [preferredReply, setPreferredReply] = useState<PreferredReplyChannel>('whatsapp');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submittedSummary, setSubmittedSummary] = useState<{
    referenceId: string;
    topic: string;
    preferredReply: PreferredReplyChannel;
  } | null>(null);

  const dynamicWhatsappHref = useMemo(() => {
    const parts = [`السلام عليكم فريق سوق الغنم، أستفسر بخصوص: ${topic}`];
    if (name.trim()) parts.push(`الاسم: ${name.trim()}`);
    if (region) parts.push(`المنطقة: ${region}`);
    if (message.trim()) parts.push(`التفاصيل: ${message.trim()}`);
    return `https://wa.me/${SUPPORT_WHATSAPP_INTL}?text=${encodeURIComponent(parts.join('\n'))}`;
  }, [topic, name, region, message]);

  const handleCopy = async (key: string, value: string, label: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      }
      setCopiedKey(key);
      onNotify(`تم نسخ ${label}`);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2200);
    } catch {
      onNotify(`الرقم: ${value}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('يرجى كتابة الاسم الكامل (حرفين على الأقل).');
      return;
    }
    if (contact.trim().length < 5) {
      setError('يرجى إدخال رقم الجوال أو البريد الإلكتروني للتواصل.');
      return;
    }
    if (message.trim().length < 8) {
      setError('يرجى كتابة تفاصيل رسالتك (8 أحرف على الأقل).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitContactMessage({
        name: name.trim(),
        contact: contact.trim(),
        topic,
        region: region || undefined,
        preferredReply,
        message: message.trim(),
      });
      setSubmittedSummary({
        referenceId: res.referenceId,
        topic,
        preferredReply,
      });
      setName('');
      setContact('');
      setRegion('');
      setMessage('');
      onNotify(`تم استلام رسالتك بنجاح (رقم المرجع: ${res.referenceId})`);
    } catch (err: any) {
      setError(err?.message || 'تعذر إرسال الرسالة، حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSocialIcon = (id: (typeof SOCIAL_CHANNELS)[number]['id']) => {
    if (id === 'whatsapp') {
      return <MessageCircle size={17} aria-hidden="true" />;
    }
    if (id === 'youtube') {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="4" />
          <path d="m10 9.5 5 2.5-5 2.5v-5Z" />
        </svg>
      );
    }
    if (id === 'tiktok') {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.5 2.5 2 4 4.5 4.2" />
        </svg>
      );
    }
    if (id === 'x') {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 4l14 16M19 4 5 20" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.8" />
        <circle cx="17" cy="7" r="0.6" />
      </svg>
    );
  };

  const replyChannelLabel =
    REPLY_CHANNELS.find((c) => c.id === submittedSummary?.preferredReply)?.label || 'واتساب';

  return (
    <section
      id="contact-section"
      aria-labelledby="contact-section-heading"
      className={`${
        embedded
          ? 'bg-[var(--color-canvas)] border-t border-[var(--color-border)] py-12 lg:py-16'
          : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14'
      } transition-colors`}
    >
      <div className={embedded ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : ''}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-stretch">
          {/* Right Column: Direct Support Channels, WhatsApp CTA & Social Links */}
          <div className="lg:col-span-5 bg-[var(--color-cream)]/75 rounded-2xl border border-[var(--color-border)] p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-green-ink)] mb-1.5">
                  <Headphones size={16} className="text-[var(--color-gold)]" aria-hidden="true" />
                  <span>خدمة المربين والمشترين</span>
                </div>
                <h2
                  id="contact-section-heading"
                  className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--color-ink)]"
                >
                  تواصل مع فريق سوق الغنم
                </h2>
                <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">
                  فريقنا متاح لمساعدتك في توثيق المراح، تفعيل الباقات، طلبات النقل والفحص البيطري، أو الرد على أي استفسار تقني وتجاري.
                </p>
              </div>

              {/* Instant WhatsApp Direct Card */}
              <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-green-ink)]/25 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-xl bg-[#103C2C] text-[#F4C569] flex items-center justify-center shrink-0">
                      <MessageCircle size={19} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-display text-sm font-extrabold text-[var(--color-ink)]">
                        محادثة واتساب مباشرة
                      </p>
                      <p className="text-xs text-[var(--color-muted)] tabular-nums" dir="ltr">
                        {SUPPORT_WHATSAPP_DISPLAY}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy('whatsapp', '0500842910', 'رقم الواتساب')
                    }
                    aria-label="نسخ رقم الواتساب"
                    className="min-h-[34px] px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] hover:bg-[var(--color-cream)] text-[11px] font-bold text-[var(--color-ink)] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'whatsapp' ? (
                      <>
                        <Check size={13} className="text-[var(--color-green-ink)]" aria-hidden="true" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} aria-hidden="true" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>

                <a
                  href={dynamicWhatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[42px] w-full px-4 py-2 rounded-xl bg-[var(--color-green)] hover:bg-[var(--color-green-hover)] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  <span>فتح محادثة واتساب الآن</span>
                </a>
              </div>

              {/* Direct Contact Channels List */}
              <dl className="space-y-3 text-sm pt-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-green-ink)] flex items-center justify-center shrink-0">
                      <Phone size={16} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-xs text-[var(--color-muted)]">الهاتف الموحد</dt>
                      <dd className="font-display font-bold text-[var(--color-ink)] tabular-nums" dir="ltr">
                        <a href={SUPPORT_PHONE_TEL} className="hover:underline">
                          {SUPPORT_PHONE_DISPLAY}
                        </a>
                      </dd>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('phone', '920018420', 'الهاتف الموحد')}
                    aria-label="نسخ الهاتف الموحد"
                    className="min-h-[34px] px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-cream-hover)] text-[11px] font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'phone' ? (
                      <>
                        <Check size={13} className="text-[var(--color-green-ink)]" aria-hidden="true" />
                        <span>نُسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} aria-hidden="true" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-green-ink)] flex items-center justify-center shrink-0">
                    <Mail size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs text-[var(--color-muted)]">البريد الإلكتروني الرسمي</dt>
                    <dd className="font-semibold text-[var(--color-ink)] truncate" dir="ltr">
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline">
                        {SUPPORT_EMAIL}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-green-ink)] flex items-center justify-center shrink-0">
                    <Clock size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-[var(--color-muted)]">ساعات الاستجابة</dt>
                    <dd className="font-semibold text-[var(--color-ink)]">
                      السبت – الخميس · 9:00 صباحاً – 9:00 مساءً
                    </dd>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-green-ink)] flex items-center justify-center shrink-0">
                    <MapPin size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-[var(--color-muted)]">المقر الرئيسي</dt>
                    <dd className="font-semibold text-[var(--color-ink)]">
                      الرياض — المملكة العربية السعودية
                    </dd>
                  </div>
                </div>
              </dl>

              {/* Social Media Channels Grid */}
              <div className="pt-4 border-t border-[var(--color-border)] space-y-2.5">
                <h3 className="text-xs font-bold text-[var(--color-ink)]">
                  حساباتنا الرسمية على مواقع التواصل الاجتماعي
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {SOCIAL_CHANNELS.filter((item) => item.id !== 'whatsapp').map((social) => (
                    <a
                      key={social.id}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[42px] px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-gold)] hover:bg-[var(--color-surface-warm)] flex items-center gap-2.5 transition-colors"
                    >
                      <span className="text-[var(--color-green-ink)] shrink-0">
                        {renderSocialIcon(social.id)}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-[var(--color-ink)] leading-tight truncate">
                          {social.label}
                        </span>
                        <span
                          className="block text-[10px] text-[var(--color-muted)] truncate"
                          dir="ltr"
                        >
                          {social.handle}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {onNavigate && (
              <div className="pt-4 border-t border-[var(--color-border)] flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('services')}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-cream-hover)] text-xs font-bold text-[var(--color-green-ink)] cursor-pointer whitespace-nowrap shrink-0"
                >
                  قائمة الخدمات
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-cream-hover)] text-xs font-bold text-[var(--color-green-ink)] cursor-pointer whitespace-nowrap shrink-0"
                >
                  الباقات والأسعار
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('how')}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-cream-hover)] text-xs font-bold text-[var(--color-green-ink)] cursor-pointer whitespace-nowrap shrink-0"
                >
                  كيف يعمل السوق
                </button>
              </div>
            )}
          </div>

          {/* Left Column: Enhanced Messaging Form */}
          <div className="lg:col-span-7 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 sm:p-8 shadow-xs flex flex-col justify-center">
            {submittedSummary ? (
              <div
                role="status"
                className="rounded-xl bg-[var(--color-cream)]/70 border border-[var(--color-green-ink)]/30 p-6 sm:p-8 text-center space-y-4"
              >
                <CheckCircle2
                  size={40}
                  className="mx-auto text-[var(--color-green-ink)]"
                  aria-hidden="true"
                />
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-extrabold text-[var(--color-ink)]">
                    وصلتنا رسالتك بنجاح
                  </h3>
                  <p className="text-sm text-[var(--color-muted)]">
                    سيقوم الفريق المختص بمراجعة طلبك والتواصل معك عبر{' '}
                    <strong className="text-[var(--color-ink)]">{replyChannelLabel}</strong> في أقرب وقت.
                  </p>
                </div>

                <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-xs space-y-1.5 max-w-md mx-auto">
                  <p className="font-bold text-[var(--color-green-ink)] tabular-nums">
                    رقم المتابعة المرجعي: {submittedSummary.referenceId}
                  </p>
                  <p className="text-[var(--color-muted)]">
                    الموضوع: {submittedSummary.topic}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmittedSummary(null)}
                    className="min-h-[42px] px-5 py-2 rounded-xl border border-[var(--color-green-ink)] text-[var(--color-green-ink)] hover:bg-[var(--color-green)] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    إرسال رسالة أخرى
                  </button>
                  <a
                    href={`https://wa.me/${SUPPORT_WHATSAPP_INTL}?text=${encodeURIComponent(
                      `السلام عليكم، أتابع رسالتي رقم ${submittedSummary.referenceId} بخصوص: ${submittedSummary.topic}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[var(--color-green)] hover:bg-[var(--color-green-hover)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle size={15} aria-hidden="true" />
                    <span>متابعة الطلب عبر واتساب</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="pb-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-extrabold text-[var(--color-ink)]">
                      نموذج المراسلة المباشر
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-[var(--color-muted)]">
                      اختر موضوع التواصل وطريقة الرد المفضلة ليصل طلبك مباشرة إلى القسم المعني.
                    </p>
                  </div>
                </div>

                {/* Quick Topic Selector Buttons */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-[var(--color-ink)]">
                    موضوع المراسلة
                  </span>
                  <div
                    role="group"
                    aria-label="موضوع المراسلة السريع"
                    className="flex flex-wrap gap-2"
                  >
                    {CONTACT_TOPICS.map((item) => {
                      const active = topic === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setTopic(item)}
                          className={`min-h-[36px] max-w-full px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer whitespace-normal sm:whitespace-nowrap text-right ${
                            active
                              ? 'bg-[var(--color-green)] text-white border-[var(--color-green)]'
                              : 'bg-[var(--color-canvas)] text-[var(--color-ink)] border-[var(--color-border)] hover:border-[var(--color-gold)]'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-bold text-[var(--color-ink)] mb-1.5"
                    >
                      الاسم الكامل *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: فهد القحطاني"
                      className="w-full min-h-[44px] rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)]/60 focus:outline-none focus:border-[var(--color-green-ink)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-info"
                      className="block text-xs font-bold text-[var(--color-ink)] mb-1.5"
                    >
                      رقم الجوال أو البريد الإلكتروني *
                    </label>
                    <input
                      id="contact-info"
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="05XXXXXXXX أو name@example.com"
                      className="w-full min-h-[44px] rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)]/60 focus:outline-none focus:border-[var(--color-green-ink)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-region"
                      className="block text-xs font-bold text-[var(--color-ink)] mb-1.5"
                    >
                      المنطقة (اختياري)
                    </label>
                    <select
                      id="contact-region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-green-ink)]"
                    >
                      <option value="">كل مناطق المملكة</option>
                      {SAUDI_REGIONS_13.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-[var(--color-ink)] mb-1.5">
                      طريقة الرد المفضلة
                    </span>
                    <div
                      role="radiogroup"
                      aria-label="طريقة الرد المفضلة"
                      className="flex flex-wrap gap-1.5"
                    >
                      {REPLY_CHANNELS.map((ch) => {
                        const Icon = ch.icon;
                        const active = preferredReply === ch.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setPreferredReply(ch.id)}
                            className={`flex-1 min-w-[92px] min-h-[44px] px-2.5 rounded-xl border text-[11px] font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                              active
                                ? 'bg-[var(--color-cream)] border-[var(--color-green-ink)] text-[var(--color-green-ink)]'
                                : 'bg-[var(--color-canvas)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                            }`}
                          >
                            <Icon size={13} aria-hidden="true" />
                            <span>{ch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-bold text-[var(--color-ink)]"
                    >
                      تفاصيل الرسالة أو الاستفسار *
                    </label>
                    <span className="text-[11px] text-[var(--color-muted)] tabular-nums">
                      {message.length} / 2000
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    rows={4}
                    maxLength={2000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب استفسارك أو تفاصيل الباقة أو طلب التوثيق الذي ترغب فيه..."
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)]/60 focus:outline-none focus:border-[var(--color-green-ink)]"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-xs font-semibold text-red-700 dark:text-red-400">
                    {error}
                  </p>
                )}

                <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={dynamicWhatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[var(--color-green-ink)] hover:underline inline-flex items-center gap-1.5"
                  >
                    <MessageCircle size={14} aria-hidden="true" />
                    <span>أو أرسل هذا الاستفسار مباشرة عبر واتساب</span>
                    <ArrowLeft size={13} aria-hidden="true" />
                  </a>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[var(--color-green)] hover:bg-[var(--color-green-hover)] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Send size={15} aria-hidden="true" />
                    <span>{submitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
