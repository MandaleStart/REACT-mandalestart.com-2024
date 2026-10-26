import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPublicSiteConfig } from '../src/publicSiteConfig.js';

test('uses the public email fallback and does not invent phone details', () => {
  assert.deepEqual(getPublicSiteConfig({}), {
    email: 'info@mandalestart.com',
    phone: null,
    whatsapp: null,
  });
});

test('returns configured email, phone, display value, and WhatsApp number', () => {
  assert.deepEqual(getPublicSiteConfig({
    PUBLIC_CONTACT_EMAIL: 'contact@example.com',
    PUBLIC_CONTACT_PHONE_E164: '+59899123456',
    PUBLIC_CONTACT_PHONE_DISPLAY: '+598 99 123 456',
  }), {
    email: 'contact@example.com',
    phone: { e164: '+59899123456', display: '+598 99 123 456' },
    whatsapp: '59899123456',
  });
});

test('rejects invalid email and incomplete or malformed phone settings', () => {
  assert.throws(() => getPublicSiteConfig({ PUBLIC_CONTACT_EMAIL: 'invalid' }), /correo válida/);
  assert.throws(() => getPublicSiteConfig({ PUBLIC_CONTACT_PHONE_E164: '+59899123456' }), /configurarse juntos/);
  assert.throws(() => getPublicSiteConfig({
    PUBLIC_CONTACT_PHONE_E164: '091123456',
    PUBLIC_CONTACT_PHONE_DISPLAY: '091 123 456',
  }), /formato E\.164/);
});
