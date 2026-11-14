<script setup lang="ts">
import { useNotificationsStore } from '#engine/stores/notifications'
import { useKeepTypedValue } from '#engine/composables/useKeepTypedValue'
import { isValidEmail } from '#engine/lib/validators'

// `white`: a white card with a hairline, for a brand whose page is cream (default: the tinted container surface).
const { surface = 'tint' } = defineProps<{ surface?: 'tint' | 'white' }>()

const { t } = useI18n()
const { $api } = useNuxtApp()
const notifications = useNotificationsStore()
const config = useRuntimeConfig()
const turnstileSiteKey = config.public.turnstileSiteKey as string

const name = ref('')
const email = ref('')
// An address typed or autofilled before the page hydrated (see useKeepTypedValue).
useKeepTypedValue(email, 'feedback-email')
const serviceType = ref('')
const feedbackType = ref('')
const message = ref('')
const website = ref('') // Honeypot
const submitting = ref(false)
const submitted = ref(false)

// Turnstile
const turnstileToken = ref('')
const turnstileWidgetId = ref<string | null>(null)
const turnstileContainer = ref<HTMLElement | null>(null)

// Set placeholder callback before script injection to avoid race condition
// (script may load before onMounted runs)
if (import.meta.client && turnstileSiteKey) {
  window.onTurnstileLoaded = () => {}
}

if (turnstileSiteKey) {
  useHead({
    script: [
      {
        src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoaded',
        async: true,
        defer: true,
      },
    ],
  })
}

onMounted(() => {
  if (!turnstileSiteKey) return

  const renderWidget = () => {
    if (window.turnstile && turnstileContainer.value) {
      turnstileWidgetId.value = window.turnstile.render(turnstileContainer.value, {
        sitekey: turnstileSiteKey,
        theme: 'light',
        callback: (token: string) => {
          turnstileToken.value = token
        },
        'expired-callback': () => {
          turnstileToken.value = ''
        },
        'error-callback': () => {
          turnstileToken.value = ''
        },
      })
    }
  }

  if (window.turnstile) {
    renderWidget()
  } else {
    window.onTurnstileLoaded = renderWidget
  }
})

onUnmounted(() => {
  if (turnstileWidgetId.value && window.turnstile) {
    window.turnstile.remove(turnstileWidgetId.value)
  }
  window.onTurnstileLoaded = undefined
})

const serviceTypes = ['takeaway', 'dine-in', 'delivery'] as const
const feedbackTypes = ['improvement', 'complaint', 'compliment'] as const

const MESSAGE_MIN = 10

type Field = 'name' | 'email' | 'serviceType' | 'feedbackType' | 'message' | 'captcha'
const FIELDS: readonly Field[] = [
  'name',
  'email',
  'serviceType',
  'feedbackType',
  'message',
  'captcha',
]

// A field shows its error once the customer has left it (text fields) or tried to send the form.
const touched = reactive<Record<Field, boolean>>({
  name: false,
  email: false,
  serviceType: false,
  feedbackType: false,
  message: false,
  captcha: false,
})
const attempted = ref(false)
// Fields the server refused although they passed the checks here; cleared as soon as the field changes.
const serverRefused = ref<Field[]>([])

const messageLength = computed(() => message.value.trim().length)

/** What is wrong with each field right now, whether or not it is shown yet. */
const problems = computed<Partial<Record<Field, string>>>(() => {
  const out: Partial<Record<Field, string>> = {}
  if (name.value.trim() === '') out.name = t('feedback.errors.nameRequired')
  if (email.value.trim() === '') out.email = t('feedback.errors.emailRequired')
  else if (!isValidEmail(email.value)) out.email = t('feedback.errors.emailInvalid')
  if (serviceType.value === '') out.serviceType = t('feedback.errors.serviceTypeRequired')
  if (feedbackType.value === '') out.feedbackType = t('feedback.errors.feedbackTypeRequired')
  if (messageLength.value === 0) out.message = t('feedback.errors.messageRequired')
  else if (messageLength.value < MESSAGE_MIN) {
    const missing = MESSAGE_MIN - messageLength.value
    out.message = t('feedback.errors.messageTooShort', { count: missing }, missing)
  }
  if (turnstileSiteKey !== '' && turnstileToken.value === '')
    out.captcha = t('feedback.errors.captchaRequired')
  for (const field of serverRefused.value) out[field] ??= t('feedback.errors.checkField')
  return out
})

/** The errors on screen: a field's problem once it was left or the form was sent, and every server refusal. */
const errors = computed<Partial<Record<Field, string>>>(() => {
  const out: Partial<Record<Field, string>> = {}
  for (const field of FIELDS) {
    const problem = problems.value[field]
    if (problem && (attempted.value || touched[field] || serverRefused.value.includes(field)))
      out[field] = problem
  }
  return out
})

const errorId = (field: Field) => `feedback-${field}-error`
const describedBy = (field: Field) => (errors.value[field] ? errorId(field) : undefined)

// Editing a field the server refused gives it a fresh chance.
watch([name, email, serviceType, feedbackType, message], (now, before) => {
  const changed = (['name', 'email', 'serviceType', 'feedbackType', 'message'] as const).filter(
    (_field, i) => now[i] !== before[i],
  )
  if (changed.length > 0)
    serverRefused.value = serverRefused.value.filter(
      (f) => !(changed as readonly Field[]).includes(f),
    )
})

const formEl = ref<HTMLFormElement | null>(null)
const summary = ref('')

/** Moves focus to the first field that still needs something, in the order of the form. */
function focusFirstProblem() {
  const first = FIELDS.find((field) => problems.value[field])
  if (!first || !formEl.value) return
  const target =
    first === 'captcha'
      ? turnstileContainer.value
      : formEl.value.querySelector<HTMLElement>(`[data-field="${first}"]`)
  target?.focus({ preventScroll: false })
  target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
}

watch(problems, (now) => {
  if (Object.keys(now).length === 0) summary.value = ''
})

function resetTurnstile() {
  if (window.turnstile && turnstileWidgetId.value) {
    window.turnstile.reset(turnstileWidgetId.value)
  }
  turnstileToken.value = ''
}

async function handleSubmit() {
  if (submitting.value) return
  attempted.value = true
  if (Object.keys(problems.value).length > 0) {
    summary.value = t('feedback.errors.summary')
    await nextTick()
    focusFirstProblem()
    return
  }
  summary.value = ''

  submitting.value = true
  try {
    await $api('/feedback', {
      method: 'POST',
      body: {
        name: name.value.trim(),
        email: email.value.trim(),
        serviceType: serviceType.value,
        feedbackType: feedbackType.value,
        message: message.value.trim(),
        website: website.value,
        turnstileToken: turnstileToken.value,
      },
    })
    submitted.value = true
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    const errorCode = (error as { data?: { error?: string } })?.data?.error
    if (status === 429) {
      notifications.notify({
        message: t('feedback.errorTooManyRequests'),
        variant: 'error',
        duration: 5000,
      })
    } else if (status === 400 && errorCode === 'captcha_failed') {
      notifications.notify({
        message: t('feedback.errorCaptchaFailed'),
        variant: 'error',
        duration: 5000,
      })
    } else if (status === 400) {
      const fields = (error as { data?: { fields?: unknown } })?.data?.fields
      serverRefused.value = Array.isArray(fields)
        ? FIELDS.filter((field) => fields.includes(field))
        : []
      if (serverRefused.value.length > 0) {
        summary.value = t('feedback.errors.summary')
        await nextTick()
        focusFirstProblem()
      }
      notifications.notify({
        message: t('feedback.errorInvalidInput'),
        variant: 'error',
        duration: 5000,
      })
    } else {
      notifications.notify({
        message: t('feedback.errorGeneric'),
        variant: 'error',
        duration: 5000,
      })
    }
  } finally {
    submitting.value = false
    resetTurnstile()
  }
}

function resetForm() {
  name.value = ''
  email.value = ''
  serviceType.value = ''
  feedbackType.value = ''
  message.value = ''
  website.value = ''
  submitted.value = false
  attempted.value = false
  serverRefused.value = []
  summary.value = ''
  for (const field of FIELDS) touched[field] = false
  resetTurnstile()
}

const inputClass = (field: Field) => [
  'w-full bg-white/60 backdrop-blur-xs border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-neutral-900 placeholder:text-neutral-600 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring focus-visible:outline-hidden',
  errors.value[field] ? 'border-red-500' : 'border-neutral-200/80',
]
</script>

<template>
  <div
    :class="[
      surface === 'white' ? 'bg-white border border-neutral-200' : 'bg-tsb-two',
      'rounded-2xl p-6 sm:p-8 h-full',
    ]"
  >
    <!-- Header -->
    <div class="mb-5">
      <h2 class="font-semibold text-neutral-900 mb-1 flex items-center gap-2 text-[15px]">
        <svg
          aria-hidden="true"
          class="w-5 h-5 text-neutral-700"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
        {{ t('feedback.title') }}
      </h2>
      <p class="text-sm text-neutral-600">{{ t('feedback.subtitle') }}</p>
    </div>

    <!-- Success state -->
    <div v-if="submitted" class="text-center py-8">
      <div
        class="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
      >
        <svg
          class="w-7 h-7 text-green-700"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <p class="text-sm text-neutral-700 leading-relaxed max-w-md mx-auto">
        {{ t('feedback.success') }}
      </p>
      <button
        type="button"
        class="mt-4 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors duration-300"
        @click="resetForm"
      >
        {{ t('feedback.sendAnother') }}
      </button>
    </div>

    <!-- Form -->
    <form
      v-else
      ref="formEl"
      method="post"
      novalidate
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <!-- Honeypot (hidden from real users) -->
      <div
        aria-hidden="true"
        style="position: absolute; left: -9999px; opacity: 0; height: 0; overflow: hidden"
        tabindex="-1"
      >
        <label for="website">Website</label>
        <input
          id="website"
          v-model="website"
          type="text"
          name="website"
          autocomplete="off"
          tabindex="-1"
        />
      </div>

      <p id="feedback-required-note" class="text-xs text-neutral-600">
        {{ t('feedback.requiredNote') }}
      </p>

      <!-- Name & Email row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="feedback-name" class="block text-xs font-medium text-neutral-600 mb-1.5">
            {{ t('feedback.name') }} <span aria-hidden="true" class="text-red-700">*</span>
          </label>
          <input
            id="feedback-name"
            v-model="name"
            data-field="name"
            type="text"
            autocomplete="name"
            maxlength="100"
            aria-required="true"
            :aria-invalid="errors.name ? 'true' : undefined"
            :aria-describedby="describedBy('name')"
            :placeholder="t('feedback.namePlaceholder')"
            :class="inputClass('name')"
            @blur="touched.name = true"
          />
          <p v-if="errors.name" :id="errorId('name')" class="text-xs text-red-700 mt-1">
            {{ errors.name }}
          </p>
        </div>
        <div>
          <label for="feedback-email" class="block text-xs font-medium text-neutral-600 mb-1.5">
            {{ t('feedback.email') }} <span aria-hidden="true" class="text-red-700">*</span>
          </label>
          <input
            id="feedback-email"
            v-model="email"
            data-field="email"
            type="email"
            autocomplete="email"
            maxlength="255"
            aria-required="true"
            :aria-invalid="errors.email ? 'true' : undefined"
            :aria-describedby="describedBy('email')"
            :placeholder="t('feedback.emailPlaceholder')"
            :class="inputClass('email')"
            @blur="touched.email = true"
          />
          <p v-if="errors.email" :id="errorId('email')" class="text-xs text-red-700 mt-1">
            {{ errors.email }}
          </p>
        </div>
      </div>

      <!-- Service type pills -->
      <fieldset :aria-describedby="describedBy('serviceType')">
        <legend class="block text-xs font-medium text-neutral-600 mb-2 p-0">
          {{ t('feedback.serviceType') }} <span aria-hidden="true" class="text-red-700">*</span>
        </legend>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(st, i) in serviceTypes"
            :key="st"
            type="button"
            :data-field="i === 0 ? 'serviceType' : undefined"
            :aria-pressed="serviceType === st"
            :class="[
              'px-4 py-2 min-h-11 rounded-xl text-sm font-medium transition-all duration-300 border',
              serviceType === st
                ? 'bg-tsb-four text-primary-700 border-primary-200'
                : errors.serviceType
                  ? 'bg-white border-red-500 text-neutral-600 hover:bg-tsb-four/40'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-tsb-four/40',
            ]"
            @click="serviceType = st"
          >
            {{ t(`feedback.serviceTypes.${st}`) }}
          </button>
        </div>
        <p v-if="errors.serviceType" :id="errorId('serviceType')" class="text-xs text-red-700 mt-1">
          {{ errors.serviceType }}
        </p>
      </fieldset>

      <!-- Feedback type pills -->
      <fieldset :aria-describedby="describedBy('feedbackType')">
        <legend class="block text-xs font-medium text-neutral-600 mb-2 p-0">
          {{ t('feedback.feedbackType') }} <span aria-hidden="true" class="text-red-700">*</span>
        </legend>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(ft, i) in feedbackTypes"
            :key="ft"
            type="button"
            :data-field="i === 0 ? 'feedbackType' : undefined"
            :aria-pressed="feedbackType === ft"
            :class="[
              'px-4 py-2 min-h-11 rounded-xl text-sm font-medium transition-all duration-300 border',
              feedbackType === ft
                ? 'bg-tsb-four text-primary-700 border-primary-200'
                : errors.feedbackType
                  ? 'bg-white border-red-500 text-neutral-600 hover:bg-tsb-four/40'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-tsb-four/40',
            ]"
            @click="feedbackType = ft"
          >
            {{ t(`feedback.feedbackTypes.${ft}`) }}
          </button>
        </div>
        <p
          v-if="errors.feedbackType"
          :id="errorId('feedbackType')"
          class="text-xs text-red-700 mt-1"
        >
          {{ errors.feedbackType }}
        </p>
      </fieldset>

      <!-- Message textarea -->
      <div>
        <label for="feedback-message" class="block text-xs font-medium text-neutral-600 mb-1.5">
          {{ t('feedback.message') }} <span aria-hidden="true" class="text-red-700">*</span>
        </label>
        <textarea
          id="feedback-message"
          v-model="message"
          data-field="message"
          maxlength="2000"
          rows="4"
          aria-required="true"
          :aria-invalid="errors.message ? 'true' : undefined"
          :aria-describedby="errors.message ? errorId('message') : 'feedback-message-hint'"
          :placeholder="t('feedback.messagePlaceholder')"
          :class="[...inputClass('message'), 'resize-none']"
          @blur="touched.message = true"
        />
        <div class="flex items-start justify-between gap-3 mt-1 text-xs">
          <p v-if="errors.message" :id="errorId('message')" class="text-red-700">
            {{ errors.message }}
          </p>
          <p v-else id="feedback-message-hint" class="text-neutral-600">
            {{ t('feedback.messageHint') }}
          </p>
          <p class="text-neutral-600 shrink-0" aria-hidden="true">{{ message.length }} / 2000</p>
        </div>
      </div>

      <!-- Turnstile widget -->
      <div v-if="turnstileSiteKey">
        <div ref="turnstileContainer" tabindex="-1" :aria-describedby="describedBy('captcha')" />
        <p v-if="errors.captcha" :id="errorId('captcha')" class="text-xs text-red-700 mt-1">
          {{ errors.captcha }}
        </p>
      </div>

      <!-- What is still missing, announced when the customer tries to send -->
      <div role="alert" aria-atomic="true">
        <p v-if="summary" class="text-sm text-red-700" data-testid="feedback-summary">
          {{ summary }}
        </p>
      </div>

      <!-- Submit button -->
      <UiButton type="submit" class="w-full sm:w-auto" :disabled="submitting" :loading="submitting">
        {{ submitting ? t('feedback.sending') : t('feedback.submit') }}
      </UiButton>
    </form>
  </div>
</template>
