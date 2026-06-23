import {
  Box,
  FunctionSquare,
  Mail,
  Settings2,
  ShieldCheck,
  Table2,
  type LucideIcon,
} from 'lucide-react'

import type { ResourceKind } from '../model/types'

const map: Record<ResourceKind, LucideIcon> = {
  table: Table2,
  policy: ShieldCheck,
  'edge-function': FunctionSquare,
  'config-key': Settings2,
  'auth-template': Mail,
  bucket: Box,
}

export function kindIcon(kind: ResourceKind): LucideIcon {
  return map[kind]
}

const kindLabels: Record<ResourceKind, string> = {
  table: 'Table',
  policy: 'Policy',
  'edge-function': 'Edge Function',
  'config-key': 'Config',
  'auth-template': 'Email template',
  bucket: 'Bucket',
}

export function kindLabel(kind: ResourceKind): string {
  return kindLabels[kind]
}

const kindPlurals: Record<ResourceKind, string> = {
  table: 'Tables',
  policy: 'Policies',
  'edge-function': 'Edge Functions',
  'config-key': 'Config',
  'auth-template': 'Email templates',
  bucket: 'File Buckets',
}

export function kindPlural(kind: ResourceKind): string {
  return kindPlurals[kind]
}
