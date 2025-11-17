import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('AI (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create a user to authenticate AI calls
    const email = `ai-e2e+${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'AI E2E User',
        email,
        password: 'Passw0rd!',
      })
      .expect(201);

    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /ai/suggestions should return an AI suggestion or heuristic fallback', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai/suggestions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        prompt: 'Plan sprint tasks for this week',
        teamContext: 'frontend team focusing on UI polish',
      })
      .expect(201);

    expect(res.body).toHaveProperty('titleSuggestion');
    expect(res.body).toHaveProperty('descriptionSuggestion');
    expect(res.body).toHaveProperty('recommendedStatus');
    expect(res.body).toHaveProperty('confidence');
    expect(res.body).toHaveProperty('reasoning');
  });
});


