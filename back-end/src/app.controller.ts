import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'Team Tasks API',
      timestamp: new Date().toISOString(),
    };
  }
}

