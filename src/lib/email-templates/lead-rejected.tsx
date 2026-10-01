import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  clubName?: string
  reason?: string
}

const Email = ({ clubName, reason }: Props) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Решение по заявке клуба — HotShot Play</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Заявка отклонена</Heading>
        <Text style={text}>
          К сожалению, мы пока не можем подключить клуб
          {clubName ? ` «${clubName}»` : ''} к HotShot Play.
        </Text>
        {reason ? <Text style={reasonBox}>Причина: {reason}</Text> : null}
        <Text style={text}>
          Если считаете, что это ошибка, или хотите уточнить детали — просто ответьте
          на это письмо или подайте заявку заново с дополненными данными.
        </Text>
        <Text style={footer}>HotShot Play — агрегатор компьютерных клубов Казахстана.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Решение по заявке на подключение клуба',
  displayName: 'Заявка клуба отклонена',
  previewData: { clubName: 'CyberDome', reason: 'Не указан точный адрес клуба' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1b1033', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#333333' }
const reasonBox = {
  backgroundColor: '#fdf2f2',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  color: '#8a1c1c',
}
const footer = { fontSize: '12px', color: '#888888', marginTop: '24px' }

export default Email
