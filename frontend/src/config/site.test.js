import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  fallbackContact,
  mailtoUrl,
  normalizeContactConfig,
  telUrl,
  whatsappShareUrl,
  whatsappUrl,
} from './site.js';

test('normalizes an email-only public contact and does not invent a phone', () => {
  assert.deepEqual(normalizeContactConfig({
    email: 'contact@example.com',
    phone: null,
    whatsapp: null,
  }), {
    email: 'contact@example.com',
    phone: null,
    whatsapp: null,
  });
  assert.equal(telUrl(fallbackContact), null);
  assert.equal(whatsappUrl(fallbackContact), null);
});

test('builds contact links from the backend-provided public contact details', () => {
  const contact = normalizeContactConfig({
    email: 'contact@example.com',
    phone: { e164: '+59899123456', display: '+598 99 123 456' },
    whatsapp: '59899123456',
  });

  assert.equal(telUrl(contact), 'tel:+59899123456');
  assert.equal(whatsappUrl(contact, 'Hola, necesito información'), 'https://wa.me/59899123456?text=Hola%2C%20necesito%20informaci%C3%B3n');
  assert.equal(mailtoUrl(contact, 'Consulta del área'), 'mailto:contact@example.com?subject=Consulta%20del%20%C3%A1rea');
});

test('creates WhatsApp share links with the shared wa.me endpoint', () => {
  assert.equal(
    whatsappShareUrl('Consulta web: https://example.com/contact'),
    'https://wa.me/?text=Consulta%20web%3A%20https%3A%2F%2Fexample.com%2Fcontact',
  );
});

test('rejects malformed or inconsistent public contact data', () => {
  assert.throws(() => normalizeContactConfig({ email: 'not-an-email', phone: null, whatsapp: null }));
  assert.throws(() => normalizeContactConfig({
    email: 'contact@example.com',
    phone: { e164: '+59899123456', display: '+598 99 123 456' },
    whatsapp: '59800000000',
  }));
});
