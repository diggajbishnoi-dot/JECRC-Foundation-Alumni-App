import {
  generateE2EKeyPair,
  encryptClientMessage,
  decryptClientMessage,
} from './e2e-encryption';

describe('End-to-End (E2E) Client-Side Zero-Knowledge Encryption (P2-001)', () => {
  it('should encrypt plaintext on sender device and decrypt on receiver device', async () => {
    // Client A (Alice) & Client B (Bob) generate keypairs on their respective devices
    const aliceKeys = await generateE2EKeyPair();
    const bobKeys = await generateE2EKeyPair();

    const secretPlaintext = 'Private message: Hello Bob, let us discuss career opportunities!';

    // Alice encrypts plaintext using her private key + Bob's public key
    const encrypted = await encryptClientMessage(
      secretPlaintext,
      aliceKeys.privateKeyJwk,
      bobKeys.publicKeyRawHex,
    );

    // Verify ciphertext is NOT plaintext
    expect(encrypted.encryptedContent).not.toEqual(secretPlaintext);
    expect(encrypted.encryptedContent).not.toContain('Hello Bob');
    expect(encrypted.nonce).toBeDefined();

    // Bob decrypts payload using his private key + Alice's public key
    const decrypted = await decryptClientMessage(
      encrypted.encryptedContent,
      encrypted.nonce,
      bobKeys.privateKeyJwk,
      aliceKeys.publicKeyRawHex,
    );

    expect(decrypted).toBe(secretPlaintext);
  });

  it('should FAIL decryption if unauthorized client (Eve) attempts to decrypt using her private key', async () => {
    const aliceKeys = await generateE2EKeyPair();
    const bobKeys = await generateE2EKeyPair();
    const eveKeys = await generateE2EKeyPair(); // Unauthorized third party

    const secretPlaintext = 'Top Secret Alumni Advice';

    const encrypted = await encryptClientMessage(
      secretPlaintext,
      aliceKeys.privateKeyJwk,
      bobKeys.publicKeyRawHex,
    );

    // Eve tries to decrypt with her private key
    await expect(
      decryptClientMessage(
        encrypted.encryptedContent,
        encrypted.nonce,
        eveKeys.privateKeyJwk,
        aliceKeys.publicKeyRawHex,
      ),
    ).rejects.toThrow();
  });

  it('should FAIL decryption if ciphertext or nonce is tampered with', async () => {
    const aliceKeys = await generateE2EKeyPair();
    const bobKeys = await generateE2EKeyPair();

    const encrypted = await encryptClientMessage(
      'Authentic Message',
      aliceKeys.privateKeyJwk,
      bobKeys.publicKeyRawHex,
    );

    // Tampered ciphertext
    const tamperedCiphertext = encrypted.encryptedContent.replace(/^./, 'X');

    await expect(
      decryptClientMessage(
        tamperedCiphertext,
        encrypted.nonce,
        bobKeys.privateKeyJwk,
        aliceKeys.publicKeyRawHex,
      ),
    ).rejects.toThrow();
  });

  it('P2-006 Security Verification: Wire format contains ONLY base64 ciphertext & nonce, never plaintext', async () => {
    const aliceKeys = await generateE2EKeyPair();
    const bobKeys = await generateE2EKeyPair();

    const sensitiveText = 'CONFIDENTIAL_OFFER_DETAILS_$150K_ANNUAL';

    const payload = await encryptClientMessage(
      sensitiveText,
      aliceKeys.privateKeyJwk,
      bobKeys.publicKeyRawHex,
    );

    // Wire payload check
    const serializedWirePayload = JSON.stringify(payload);
    expect(serializedWirePayload).not.toContain(sensitiveText);
    expect(payload.encryptedContent).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(payload.nonce).toMatch(/^[A-Za-z0-9+/=]+$/);

    // Recipient decryption check
    const restored = await decryptClientMessage(
      payload.encryptedContent,
      payload.nonce,
      bobKeys.privateKeyJwk,
      aliceKeys.publicKeyRawHex,
    );
    expect(restored).toBe(sensitiveText);
  });
});
