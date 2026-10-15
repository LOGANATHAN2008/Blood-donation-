// pages/CreateRequestPage.tsx
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Droplets,
  Minus,
  Plus,
  AlertTriangle,
  Phone,
  MapPin,
  User,
  Building2,
  Calendar,
  FileText,
  Eye,
  EyeOff,
  ChevronLeft,
} from 'lucide-react'
import { createRequestSchema, type CreateRequestFormData } from '../lib/schema'
import { createEmergencyRequest } from '../lib/api'
import type { BloodGroup, BloodComponent, Urgency } from '../types'

// ── Constants ─────────────────────────────────────────────
const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const COMPONENTS: { value: BloodComponent; label: string }[] = [
  { value: 'whole_blood', label: 'component_whole' },
  { value: 'platelets',   label: 'component_platelets' },
  { value: 'plasma',      label: 'component_plasma' },
  { value: 'any',         label: 'component_any' },
]
const URGENCIES: { value: Urgency; label: string }[] = [
  { value: 'critical',     label: 'urgency_critical' },
  { value: 'today',        label: 'urgency_today' },
  { value: 'within_3_days', label: 'urgency_3days' },
]
const CITY_KEY = 'bs_last_city'

/** Default datetime = now + 4 hours, formatted for datetime-local input */
function defaultNeededBy(): string {
  const d = new Date(Date.now() + 4 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Sub-components ─────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="label">{children}</p>
}

function FieldError({ msg }: { msg?: string }) {
  const { t } = useTranslation()
  if (!msg) return null
  return <p className="error-text">{t(msg, { defaultValue: msg })}</p>
}

// ── Main page ──────────────────────────────────────────────
export default function CreateRequestPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestFormData>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      component: 'whole_blood',
      units: 1,
      neededBy: defaultNeededBy(),
      showPhoneOnImage: false,
      lang: (i18n.language as 'en' | 'ta' | 'kn' | 'hi') || 'en',
      city: localStorage.getItem(CITY_KEY) ?? '',
    },
  })

  const units = watch('units')
  const selectedGroup = watch('bloodGroup')
  const selectedComponent = watch('component')
  const selectedUrgency = watch('urgency')
  const showPhone = watch('showPhoneOnImage')
  const noteVal = watch('note') ?? ''

  // Persist city to localStorage on change
  const cityVal = watch('city')
  useEffect(() => {
    if (cityVal) localStorage.setItem(CITY_KEY, cityVal)
  }, [cityVal])

  const onSubmit = async (data: CreateRequestFormData) => {
    try {
      const { id } = await createEmergencyRequest({
        ...data,
        contactPhone: data.contactPhone.replace(/\D/g, '').replace(/^91/, ''),
      })
      toast.success(t('success_posted'))
      navigate(`/r/${id}`)
    } catch (e) {
      console.error(e)
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 pb-32 animate-fade-in">
      {/* ── Header ── */}
      <div className="pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>
            {t('create_title')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('create_sub')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

        {/* ══ Blood Group ══ */}
        <div className="card">
          <SectionLabel>
            <Droplets size={12} className="inline mr-1" />
            {t('blood_group_label')} *
          </SectionLabel>
          <Controller
            name="bloodGroup"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    id={`bg-chip-${bg.replace('+', 'pos').replace('-', 'neg')}`}
                    onClick={() => field.onChange(bg)}
                    className={`chip h-14 text-lg font-black tracking-wide ${field.value === bg ? 'selected' : ''}`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            )}
          />
          <FieldError msg={errors.bloodGroup?.message} />
        </div>

        {/* ══ Component + Units ══ */}
        <div className="card flex flex-col gap-4">
          {/* Component */}
          <div>
            <SectionLabel>{t('component_label')}</SectionLabel>
            <Controller
              name="component"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {COMPONENTS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      className={`chip px-4 py-2 ${field.value === value ? 'selected' : ''}`}
                    >
                      {t(label)}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Units stepper */}
          <div>
            <SectionLabel>{t('units_label')}</SectionLabel>
            <div className="flex items-center gap-4">
              <button
                type="button"
                id="btn-units-minus"
                className="stepper-btn"
                disabled={units <= 1}
                onClick={() => setValue('units', Math.max(1, units - 1))}
              >
                <Minus size={18} />
              </button>
              <span
                className="text-3xl font-black w-12 text-center tabular-nums"
                style={{ color: 'var(--color-text)' }}
              >
                {units}
              </span>
              <button
                type="button"
                id="btn-units-plus"
                className="stepper-btn"
                disabled={units >= 10}
                onClick={() => setValue('units', Math.min(10, units + 1))}
              >
                <Plus size={18} />
              </button>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                unit{units > 1 ? 's' : ''}
              </span>
            </div>
            <FieldError msg={errors.units?.message} />
          </div>
        </div>

        {/* ══ Patient + Hospital ══ */}
        <div className="card flex flex-col gap-4">
          {/* Patient name */}
          <div>
            <label htmlFor="patientName" className="label">
              <User size={12} className="inline mr-1" />
              {t('patient_name')} *
            </label>
            <input
              id="patientName"
              {...register('patientName')}
              placeholder="e.g. Ravi K."
              className={`input-field ${errors.patientName ? 'error' : ''}`}
            />
            <FieldError msg={errors.patientName?.message} />
          </div>

          {/* Hospital name */}
          <div>
            <label htmlFor="hospitalName" className="label">
              <Building2 size={12} className="inline mr-1" />
              {t('hospital_name')} *
            </label>
            <input
              id="hospitalName"
              {...register('hospitalName')}
              placeholder="e.g. Apollo Hospital"
              className={`input-field ${errors.hospitalName ? 'error' : ''}`}
            />
            <FieldError msg={errors.hospitalName?.message} />
          </div>

          {/* Area */}
          <div>
            <label htmlFor="hospitalArea" className="label">
              <MapPin size={12} className="inline mr-1" />
              {t('hospital_area')} *
            </label>
            <input
              id="hospitalArea"
              {...register('hospitalArea')}
              placeholder="e.g. Anna Nagar"
              className={`input-field ${errors.hospitalArea ? 'error' : ''}`}
            />
            <FieldError msg={errors.hospitalArea?.message} />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="label">
              {t('city')} *
            </label>
            <input
              id="city"
              {...register('city')}
              placeholder="e.g. Chennai"
              className={`input-field ${errors.city ? 'error' : ''}`}
            />
            <FieldError msg={errors.city?.message} />
          </div>
        </div>

        {/* ══ Time + Urgency ══ */}
        <div className="card flex flex-col gap-4">
          {/* Needed by */}
          <div>
            <label htmlFor="neededBy" className="label">
              <Calendar size={12} className="inline mr-1" />
              {t('needed_by')} *
            </label>
            <input
              id="neededBy"
              type="datetime-local"
              {...register('neededBy')}
              className={`input-field ${errors.neededBy ? 'error' : ''}`}
            />
            <FieldError msg={errors.neededBy?.message} />
          </div>

          {/* Urgency chips */}
          <div>
            <SectionLabel>{t('urgency')} *</SectionLabel>
            <Controller
              name="urgency"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  {URGENCIES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      className={`chip justify-start px-5 py-3 text-sm ${field.value === value ? 'selected' : ''}`}
                    >
                      {t(label)}
                    </button>
                  ))}
                </div>
              )}
            />
            <FieldError msg={errors.urgency?.message} />
          </div>
        </div>

        {/* ══ Contact ══ */}
        <div className="card flex flex-col gap-4">
          <div>
            <label htmlFor="contactName" className="label">
              <User size={12} className="inline mr-1" />
              {t('contact_name')} *
            </label>
            <input
              id="contactName"
              {...register('contactName')}
              placeholder="Your name"
              className={`input-field ${errors.contactName ? 'error' : ''}`}
            />
            <FieldError msg={errors.contactName?.message} />
          </div>

          <div>
            <label htmlFor="contactPhone" className="label">
              <Phone size={12} className="inline mr-1" />
              {t('contact_phone')} *
            </label>
            <input
              id="contactPhone"
              type="tel"
              inputMode="numeric"
              {...register('contactPhone')}
              placeholder="9876543210"
              maxLength={13}
              className={`input-field ${errors.contactPhone ? 'error' : ''}`}
            />
            <FieldError msg={errors.contactPhone?.message} />
          </div>
        </div>

        {/* ══ Note + Toggle ══ */}
        <div className="card flex flex-col gap-4">
          {/* Note */}
          <div>
            <label htmlFor="note" className="label">
              <FileText size={12} className="inline mr-1" />
              {t('note')}
            </label>
            <textarea
              id="note"
              {...register('note')}
              rows={3}
              maxLength={140}
              placeholder="Any additional details for donors…"
              className={`input-field resize-none ${errors.note ? 'error' : ''}`}
            />
            <div className="flex justify-between items-center">
              <FieldError msg={errors.note?.message} />
              <span
                className="text-xs ml-auto"
                style={{ color: noteVal.length > 120 ? '#D32F2F' : 'var(--color-text-muted)' }}
              >
                {noteVal.length}/140
              </span>
            </div>
          </div>

          {/* Show phone toggle */}
          <button
            type="button"
            id="toggle-show-phone"
            onClick={() => setValue('showPhoneOnImage', !showPhone)}
            className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 text-left active:scale-98"
            style={{
              background: showPhone ? 'rgba(211,47,47,.1)' : 'var(--color-surface-2)',
              border: `2px solid ${showPhone ? 'var(--color-accent)' : 'var(--color-border)'}`,
            }}
          >
            <span
              className="flex-shrink-0 w-11 h-6 rounded-full relative transition-all duration-300"
              style={{ background: showPhone ? 'var(--color-accent)' : 'var(--color-border)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300"
                style={{ transform: showPhone ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {showPhone ? <Eye size={14} className="inline mr-1" /> : <EyeOff size={14} className="inline mr-1" />}
                {t('show_phone_toggle')}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {showPhone ? 'Phone visible on share image' : 'Phone hidden on share image (recommended)'}
              </span>
            </span>
          </button>
        </div>

        {/* Disclaimer */}
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs"
          style={{ background: 'rgba(211,47,47,.07)', color: 'var(--color-text-muted)' }}
        >
          <AlertTriangle
            size={14}
            className="shrink-0 mt-0.5"
            style={{ color: 'var(--color-accent)' }}
          />
          {t('disclaimer')}
        </div>

        {/* Hidden: track which blood group / component / urgency are selected for debugging */}
        <input type="hidden" value={selectedGroup ?? ''} readOnly />
        <input type="hidden" value={selectedComponent} readOnly />
        <input type="hidden" value={selectedUrgency ?? ''} readOnly />
      </form>

      {/* ══ Sticky Submit ══ */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 z-40"
        style={{ background: 'linear-gradient(to top, var(--color-bg) 80%, transparent)' }}
      >
        <div className="max-w-xl mx-auto">
          <button
            id="btn-submit-request"
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="btn-primary py-5 text-lg"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                {t('submitting')}
              </>
            ) : (
              <>
                <Droplets size={22} strokeWidth={3} />
                {t('submit')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
