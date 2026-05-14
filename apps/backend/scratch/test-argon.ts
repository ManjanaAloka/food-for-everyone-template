import argon2 from 'argon2';

async function main() {
  try {
    const hash = await argon2.hash('password123');
    console.log('Hash successful:', hash);
    const match = await argon2.verify(hash, 'password123');
    console.log('Verify successful:', match);
  } catch (err) {
    console.error('Argon2 failure:', err);
  }
}

main();
