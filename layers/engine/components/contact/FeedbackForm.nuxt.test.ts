// FeedbackForm (contact page): every field is required and the form says which one is missing. The send button stays
// on; pressing it with something missing marks each field in red with its own message, announces a summary and moves
// focus to the first one. A field the server refuses (an email the API rejects) is marked the same way. `$api` is the
// boundary; i18n is stubbed, so a test asserts which message was picked, not its wording.
// Run: `vp test run layers/engine/components/contact/FeedbackForm.nuxt.test.ts`.
import type * as VueI18NModule from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { settle } from '../../../../test/helpers/settle'

const api = vi.hoisted(() => vi.fn())
mockNuxtImport(
  'useNuxtApp',
  (original) => () =>
    new Proxy(original(), {
      get: (target, key, receiver) => (key === '$api' ? api : Reflect.get(target, key, receiver)),
    }),
)
vi.mock('vue-i18n', async (importOriginal) => {
  const { fakeI18n } = await import('../../../../test/helpers/i18n')
  return { ...(await importOriginal<typeof VueI18NModule>()), useI18n: fakeI18n }
})

const { default: FeedbackForm } = await import('./FeedbackForm.vue')

const mountForm = () => mountSuspended(FeedbackForm, { attachTo: document.body })
type Form = Awaited<ReturnType<typeof mountForm>>

const fillAll = async (
  form: Form,
  overrides: Partial<Record<'name' | 'email' | 'message', string>> = {},
) => {
  await form.get('#feedback-name').setValue(overrides.name ?? 'Eva')
  await form.get('#feedback-email').setValue(overrides.email ?? 'eva@example.test')
  await pill(form, 'feedback.serviceTypes.takeaway').trigger('click')
  await pill(form, 'feedback.feedbackTypes.compliment').trigger('click')
  await form.get('#feedback-message').setValue(overrides.message ?? 'Les gyozas étaient parfaits')
}
const pill = (form: Form, label: string) => {
  const button = form.findAll('button').find((b) => b.text() === label)
  if (!button) throw new Error(`no button ${label}`)
  return button
}
const send = async (form: Form) => {
  await form.get('form').trigger('submit')
  await settle()
}
const error = (form: Form, field: string) => form.find(`#feedback-${field}-error`)

beforeEach(() => {
  api.mockReset()
})

describe('required fields', () => {
  it('are marked with an asterisk and aria-required, with a note that explains it', async () => {
    const form = await mountForm()
    expect(form.get('#feedback-required-note').text()).toBe('feedback.requiredNote')
    for (const id of ['#feedback-name', '#feedback-email', '#feedback-message'])
      expect(form.get(id).attributes('aria-required'), id).toBe('true')
    expect(form.findAll('span[aria-hidden="true"]').filter((s) => s.text() === '*')).toHaveLength(5)
    form.unmount()
  })

  it('leave the send button on, so pressing it can say what is missing', async () => {
    const form = await mountForm()
    expect(form.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
    form.unmount()
  })

  it('show nothing before the customer has done anything', async () => {
    const form = await mountForm()
    for (const field of ['name', 'email', 'serviceType', 'feedbackType', 'message'])
      expect(error(form, field).exists(), field).toBe(false)
    expect(form.find('[data-testid="feedback-summary"]').exists()).toBe(false)
    form.unmount()
  })

  it('pressing send on an empty form marks every field, announces a summary and sends nothing', async () => {
    const form = await mountForm()
    await send(form)

    expect(error(form, 'name').text()).toBe('feedback.errors.nameRequired')
    expect(error(form, 'email').text()).toBe('feedback.errors.emailRequired')
    expect(error(form, 'serviceType').text()).toBe('feedback.errors.serviceTypeRequired')
    expect(error(form, 'feedbackType').text()).toBe('feedback.errors.feedbackTypeRequired')
    expect(error(form, 'message').text()).toBe('feedback.errors.messageRequired')
    expect(form.get('[data-testid="feedback-summary"]').text()).toBe('feedback.errors.summary')
    expect(form.get('#feedback-name').attributes('aria-invalid')).toBe('true')
    expect(form.get('#feedback-name').attributes('aria-describedby')).toBe('feedback-name-error')
    expect(document.activeElement?.id).toBe('feedback-name')
    expect(api).not.toHaveBeenCalled()
    form.unmount()
  })

  it('focus goes to the first field still missing', async () => {
    const form = await mountForm()
    await form.get('#feedback-name').setValue('Eva')
    await form.get('#feedback-email').setValue('eva@example.test')
    await send(form)
    expect(document.activeElement?.textContent?.trim()).toBe('feedback.serviceTypes.takeaway')
    form.unmount()
  })

  it('a text field is checked when the customer leaves it', async () => {
    const form = await mountForm()
    await form.get('#feedback-email').setValue('eva@example')
    await form.get('#feedback-email').trigger('blur')
    expect(error(form, 'email').text()).toBe('feedback.errors.emailInvalid')
    expect(error(form, 'name').exists()).toBe(false)
    form.unmount()
  })

  it('whitespace does not count, and a short message says how many characters are left', async () => {
    const form = await mountForm()
    await fillAll(form, { name: '   ', message: '  court    ' })
    await send(form)
    expect(error(form, 'name').text()).toBe('feedback.errors.nameRequired')
    expect(error(form, 'message').text()).toBe('feedback.errors.messageTooShort{"count":5}#5')
    expect(api).not.toHaveBeenCalled()
    form.unmount()
  })

  it('an error goes away as soon as the field is fixed, and so does the summary', async () => {
    const form = await mountForm()
    await fillAll(form, { name: '' })
    await send(form)
    expect(error(form, 'name').exists()).toBe(true)
    await form.get('#feedback-name').setValue('Eva')
    expect(error(form, 'name').exists()).toBe(false)
    expect(form.find('[data-testid="feedback-summary"]').exists()).toBe(false)
    form.unmount()
  })

  it('the message shows its minimum as a hint until there is an error to show', async () => {
    const form = await mountForm()
    expect(form.get('#feedback-message-hint').text()).toBe('feedback.messageHint')
    expect(form.get('#feedback-message').attributes('aria-describedby')).toBe(
      'feedback-message-hint',
    )
    form.unmount()
  })
})

describe('sending', () => {
  it('a complete form is sent trimmed', async () => {
    api.mockResolvedValue({ status: 'ok' })
    const form = await mountForm()
    await fillAll(form, { name: '  Eva  ', email: ' eva@example.test ' })
    await send(form)
    expect(api).toHaveBeenCalledWith('/feedback', {
      method: 'POST',
      body: {
        name: 'Eva',
        email: 'eva@example.test',
        serviceType: 'takeaway',
        feedbackType: 'compliment',
        message: 'Les gyozas étaient parfaits',
        website: '',
        turnstileToken: '',
      },
    })
    expect(form.text()).toContain('feedback.success')
    form.unmount()
  })

  it('a field the server refuses is marked until the customer changes it', async () => {
    api.mockRejectedValue({
      response: { status: 400 },
      data: { error: 'invalid_input', fields: ['email'] },
    })
    const form = await mountForm()
    await fillAll(form)
    await send(form)
    expect(error(form, 'email').text()).toBe('feedback.errors.checkField')
    expect(form.get('[data-testid="feedback-summary"]').text()).toBe('feedback.errors.summary')
    expect(document.activeElement?.id).toBe('feedback-email')

    await form.get('#feedback-email').setValue('eva2@example.test')
    expect(error(form, 'email').exists()).toBe(false)
    form.unmount()
  })

  it('a refusal without a field list keeps the form clean of field errors', async () => {
    api.mockRejectedValue({ response: { status: 400 }, data: { error: 'invalid_input' } })
    const form = await mountForm()
    await fillAll(form)
    await send(form)
    expect(error(form, 'email').exists()).toBe(false)
    expect((form.get('#feedback-message').element as HTMLTextAreaElement).value).toBe(
      'Les gyozas étaient parfaits',
    )
    form.unmount()
  })
})
