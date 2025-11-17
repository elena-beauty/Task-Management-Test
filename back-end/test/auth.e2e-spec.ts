import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register should create a new user and return a token', async () => {
    const email = `auth-e2e+${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Auth E2E User',
        email,
        password: 'Passw0rd!',
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('email', email.toLowerCase());

    accessToken = res.body.accessToken;
    userId = res.body.user.id;
  });

  it('POST /auth/login should authenticate an existing user', async () => {
    const email = `auth-login+${Date.now()}@example.com`;

    // Ensure the user exists
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Auth Login User',
        email,
        password: 'Passw0rd!',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: 'Passw0rd!',
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
  });

  it('GET /auth/me should return current user with valid JWT', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('sub', userId);
  });
});


