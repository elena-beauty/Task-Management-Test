import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Todos (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let teamId: string;
  let todoId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create a user and team used for all todo tests
    const email = `todos-e2e+${Date.now()}@example.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Todos E2E User',
        email,
        password: 'Passw0rd!',
      })
      .expect(201);

    accessToken = registerRes.body.accessToken;

    const teamRes = await request(app.getHttpServer())
      .post('/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Todos E2E Team',
        description: 'Team used for todos e2e tests',
      })
      .expect(201);

    teamId = teamRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /todos should create a todo in the team', async () => {
    const res = await request(app.getHttpServer())
      .post('/todos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Todos e2e todo',
        description: 'This is a test todo created via todos e2e tests',
        teamId,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title', 'Todos e2e todo');
    expect(res.body.team).toHaveProperty('id', teamId);

    todoId = res.body.id;
  });

  it('GET /todos should list todos for the team', async () => {
    const res = await request(app.getHttpServer())
      .get('/todos')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ teamId })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /todos/:id should return a single todo', async () => {
    const res = await request(app.getHttpServer())
      .get(`/todos/${todoId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('id', todoId);
  });

  it('PATCH /todos/:id should update a todo', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/todos/${todoId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Todos e2e updated',
      })
      .expect(200);

    expect(res.body).toHaveProperty('id', todoId);
    expect(res.body).toHaveProperty('title', 'Todos e2e updated');
  });

  it('DELETE /todos/:id should delete a todo', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/todos/${todoId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('deleted', true);
  });
});


