import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CallQueueBody, LoginBody, QueuesService } from '../queue/queues.service';

// path และ response เหมือน web-aranhos-api /api/v2/queues/* ทุกตัว (ดู web-aranhos-api/src/queues/queues.controller.ts)
@Controller({ path: 'queues', version: '2' })
export class CompatV2Controller {
  constructor(private readonly queuesService: QueuesService) {}

  @Get('search-queue/:slug')
  searchQueue(@Param('slug') slug: string) {
    return this.queuesService.searchQueue(slug);
  }

  @Get('my-queue/:vn')
  myQueue(@Param('vn') vn: string) {
    return this.queuesService.myQueue(vn);
  }

  @Get('kskdepart')
  findAllKskdepart() {
    return this.queuesService.findAllKskdepart();
  }

  @Get('callname-by-depcode/:curDep')
  callNameByDepcode(@Param('curDep') curDep: string) {
    return this.queuesService.callNameByDepcode(curDep);
  }

  @Get('next-queue/:curDep')
  nextQueue(@Param('curDep') curDep: string) {
    return this.queuesService.nextQueue(curDep);
  }

  @Get('stay-queue/:curDep')
  stayQueue(@Param('curDep') curDep: string) {
    return this.queuesService.stayQueue(curDep);
  }

  @Get('history-queue/:curDep')
  historyQueue(@Param('curDep') curDep: string) {
    return this.queuesService.historyQueue(curDep);
  }

  @Get('call-name/:curDep')
  callName(@Param('curDep') curDep: string) {
    return this.queuesService.callName(curDep);
  }

  @Patch('pass-queue/:curDep')
  updatePassQueue(@Param('curDep') curDep: string) {
    return this.queuesService.callName(curDep);
  }

  @Post('login')
  authQueue(@Body() data: LoginBody) {
    return this.queuesService.authQueue(data);
  }

  @Post('call-queue')
  handleCallQueue(@Body() dto: CallQueueBody) {
    return this.queuesService.handleCallQueue(dto);
  }

  @Post('stay-queue')
  handleStayQueue(@Body() dto: CallQueueBody) {
    return this.queuesService.handleStayQueue(dto);
  }

  @Post('across-queue')
  handleAcrossQueue(@Body() dto: CallQueueBody) {
    return this.queuesService.handleAcrossQueue(dto);
  }
}
