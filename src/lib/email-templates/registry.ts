import type { ComponentType } from 'react'
import { template as leadReceivedTemplate } from './lead-received'
import { template as leadApprovedTemplate } from './lead-approved'
import { template as leadRejectedTemplate } from './lead-rejected'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'lead-received': leadReceivedTemplate,
  'lead-approved': leadApprovedTemplate,
  'lead-rejected': leadRejectedTemplate,
}
