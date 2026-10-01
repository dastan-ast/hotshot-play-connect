import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  clubName?: string
  city?: string
  phone?: string
}

const Email = ({ clubName, city, phone }: Props) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Заявка на подключение клуба принята — HotShot Play</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Заявка принята</Heading>
        <Text style={text}>
          Спасибо! Мы получили заявку на подключение клуба
          {clubName ? ` «${clubName}»` : ''} к HotShot Play.
        </Text>
        <Section style={card}>
          <Text style={row}>Клуб: {clubName || '—'}</Text>
          <Text style={row}>Город: {city || '—'}</Text>
          <Text style={row}>Телефон: {phone || '—'}</Text>
        </Section>
        <Text style={text}>
          Наш администратор проверит заявку и свяжется с вами. После одобрения вы
          получите письмо со ссылкой для входа в кабинет владельца клуба, где можно
          указать адрес, часы работы, цены и количество мест.
        </Text>
        <Text style={footer}>HotShot Play — агрегатор компьютерных клубов Казахстана.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Заявка на подключение клуба принята',
  displayName: 'Заявка клуба получена',
  previewData: { clubName: 'CyberDome', city: 'Astana', phone: '+7 701 000 00 00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1b1033', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#333333' }
const card = {
  backgroundColor: '#f5f2ff',
  borderRadius: '12px',
  padding: '12px 16px',
  margin: '16px 0',
}
const row = { fontSize: '14px', lineHeight: '22px', color: '#1b1033', margin: '2px 0' }
const footer = { fontSize: '12px', color: '#888888', marginTop: '24px' }

export default Email
