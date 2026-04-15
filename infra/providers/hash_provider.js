import bcrypt from 'bcrypt';

export class HashProvider {
  async generateHash(payload) {
    return bcrypt.hash(payload, 10);
  }

  async compareHash(payload, hashed) {
    return bcrypt.compare(payload, hashed);
  }
}