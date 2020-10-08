import { Controller, Get, Headers, NotAcceptableException, Param, Req, Res } from '@nestjs/common';
import { AppService, MatchType } from './app.service';
import { ConfigService } from '@nestjs/config';
import { ConstructQuery, Generator, Parser } from 'sparqljs';
import * as SparqlClient from 'sparql-http-client';
import { streamToRx } from 'rxjs-stream';
import { map, toArray } from 'rxjs/operators';
import { parseAll } from '@hapi/accept';

enum MediaTypes {
  app_xhtml_xml = 'application/xhtml+xml',
  text_html = 'text/html',
  rdf_xml = 'application/rdf+xml',
}


@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private configService: ConfigService) {
  }

  resBase = this.configService.get<string>('resourceBaseUri');

  @Get('*')
  async resource(@Param() params, @Req() request, @Res() response, @Headers() headers) {

    /*
    Is it a recognized resource match? If it is, then redirect to the machine or human
    Is it a recognized machine match? Then give the data
    Is it a recognized human match? Then give the page
    Is it no match? Show an error page
     */

    // Parse a SPARQL query to a JSON object

    const action = this.appService.discoverMatch(this.appService.getFullUrl(request));

    const accept = parseAll(headers);

    switch (action.type) {
      case MatchType.HUMAN:
        if (accept.mediaTypes[0] === MediaTypes.app_xhtml_xml || accept.mediaTypes[0] === MediaTypes.text_html) {
          const rows = await this.appService.getResource(action.resourceUri);
          return response.render(
            'page',
            { rows },
          );

        } else {

          throw new NotAcceptableException();
        }
      case  MatchType.MACHINE:
        if (accept.mediaTypes[0] === MediaTypes.rdf_xml) {
          return response.json(await this.appService.getResource(action.resourceUri));
        } else {

          throw new NotAcceptableException();
        }
      case MatchType.RESOURCE:
        if (accept.mediaTypes[0] === MediaTypes.app_xhtml_xml || accept.mediaTypes[0] === MediaTypes.text_html) {
          return response.redirect(303, action.humanUrl);
        } else if (accept.mediaTypes[0] === MediaTypes.rdf_xml) {
          return response.redirect(303, action.machineUrl);
        } else {

          throw new NotAcceptableException();
        }

    }


  }
}
