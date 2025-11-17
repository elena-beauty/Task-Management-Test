import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../typeorm-datasource';
import { User } from '../../users/user.entity';
import { Team } from '../../teams/team.entity';
import { TeamMembership, TeamRole } from '../../teams/team-membership.entity';
import { Todo, TodoStatus } from '../../todos/todo.entity';

async function seed() {
  await AppDataSource.initialize();
  try {
    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);
    const membershipRepo = AppDataSource.getRepository(TeamMembership);
    const todoRepo = AppDataSource.getRepository(Todo);

    let owner = await userRepo.findOne({ where: { email: 'owner@example.com' } });
    if (!owner) {
      owner = await userRepo.save(
        userRepo.create({
          email: 'owner@example.com',
          name: 'Demo Owner',
          passwordHash: await bcrypt.hash('Passw0rd!', 10),
        }),
      );
    }

    let teammate = await userRepo.findOne({
      where: { email: 'teammate@example.com' },
    });
    if (!teammate) {
      teammate = await userRepo.save(
        userRepo.create({
          email: 'teammate@example.com',
          name: 'Demo Teammate',
          passwordHash: await bcrypt.hash('Passw0rd!', 10),
        }),
      );
    }

    let team = await teamRepo.findOne({
      where: { name: 'Sample Team' },
      relations: ['owner'],
    });
    if (!team) {
      team = await teamRepo.save(
        teamRepo.create({
          name: 'Sample Team',
          description: 'Example workspace for new users',
          owner,
        }),
      );
    }

    const existingOwnerMembership = await membershipRepo.findOne({
      where: { team: { id: team.id }, user: { id: owner.id } },
    });
    if (!existingOwnerMembership) {
      await membershipRepo.save(
        membershipRepo.create({
          team,
          user: owner,
          role: TeamRole.OWNER,
        }),
      );
    }

    const existingMemberMembership = await membershipRepo.findOne({
      where: { team: { id: team.id }, user: { id: teammate.id } },
    });
    if (!existingMemberMembership) {
      await membershipRepo.save(
        membershipRepo.create({
          team,
          user: teammate,
          role: TeamRole.MEMBER,
        }),
      );
    }

    const existingOwnerTodos = await todoRepo.count({
      where: {
        team: { id: team.id },
        assignee: { id: owner.id },
      },
    });

    if (existingOwnerTodos < 30) {
      const statuses = [
        TodoStatus.BACKLOG,
        TodoStatus.IN_PROGRESS,
        TodoStatus.DONE,
        TodoStatus.BLOCKED,
      ];

      const todosToCreate: Todo[] = [];
      for (let i = existingOwnerTodos; i < 30; i += 1) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + ((i % 10) + 1));

        todosToCreate.push(
          todoRepo.create({
            title: `Demo Task #${i + 1}`,
            description: `Sample work item ${i + 1} for onboarding walkthrough.`,
            status: statuses[i % statuses.length],
            dueDate,
            team,
            assignee: owner,
          }),
        );
      }

      await todoRepo.save(todosToCreate);
    }

    // eslint-disable-next-line no-console
    console.log('Seed data ready. Login with owner@example.com / Passw0rd!');
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to seed database', error);
  process.exit(1);
});

