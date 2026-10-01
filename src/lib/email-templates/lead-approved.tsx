import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  clubName?: string
  actionUrl?: string
}

const Email = ({ clubName, actionUrl }: Props) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Клуб одобрен — задайте пароль и войдите в кабинет</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Клуб одобрен</Heading>
        <Text style={text}>
          Заявка на подключение клуба{clubName ? ` «${clubName}»` : ''} одобрена.
          Для вас создан кабинет владельца в HotShot Play.
        </Text>
        <Text style={text}>
          Нажмите кнопку ниже, чтобы задать пароль и войти. Затем заполните адрес,
          часы работы, цены и количество мест — после этого клуб появится на карте.
        </Text>
        {actionUrl ? (
          <>
            <Button style={button} href={actionUrl}>
              Задать пароль и войти
            </Button>
            <Text style={small}>
              Если кнопка не открывается, скопируйте ссылку:{' '}
              <Link href={actionUrl} style={link}>
                {actionUrl}
              </Link>
            </Text>
          </>
        ) : null}
        <Text style={footer}>HotShot Play — агрегатор компьютерных клубов Казахстана.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Ваш клуб одобрен — вход в кабинет HotShot Play',
  displayName: 'Клуб одобрен (приглашение владельца)',
  previewData: { clubName: 'CyberDome', actionUrl: 'https://headshotkz.app/set-password' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1b1033', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#333333' }
const button = {
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  borderRadius: '10px',
  padding: '12px 22px',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  display: 'inline-block',
  margin: '12px 0',
}
const small = { fontSize: '12px', color: '#666666', wordBreak: 'break-all' as const }
const link = { color: '#7c3aed' }
const footer = { fontSize: '12px', color: '#888888', marginTop: '24px' }

export default Email
