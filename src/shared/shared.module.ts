import { Module } from '@nestjs/common';
import { AppService } from '../app.service';
import { SparqlService } from './services/sparql.service';

@Module({

  providers: [SparqlService],
  exports: [SparqlService],

})
export class SharedModule {}
