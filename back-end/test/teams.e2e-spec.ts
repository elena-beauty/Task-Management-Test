import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Teams (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let teamId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create a user and obtain a JWT for all team tests
    const email = `teams-e2e+${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Teams E2E User',
        email,
        password: 'Passw0rd!',
      })
      .expect(201);

    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /teams should create a new team for the user', async () => {
    const res = await request(app.getHttpServer())
      .post('/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'E2E Teams Test',
        description: 'Team created during teams e2e tests',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', 'E2E Teams Test');

    teamId = res.body.id;
  });

  it('GET /teams should list teams for the authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .get('/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /teams/:teamId/members should list team members', async () => {
    const res = await request(app.getHttpServer())
      .get(`/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /teams/:teamId/members should add a team member', async () => {
    const res = await request(app.getHttpServer())
      .post(`/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: `teams-member+${Date.now()}@example.com`,
        name: 'Teams Member',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
  });

  it('POST /teams/:teamId/invite should invite a team member', async () => {
    const res = await request(app.getHttpServer())
      .post(`/teams/${teamId}/invite`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: `teams-invite+${Date.now()}@example.com`,
        name: 'Teams Invitee',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
  });
});


