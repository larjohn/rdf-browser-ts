import { Controller, Get, Headers, NotAcceptableException, Param, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { parseAll } from '@hapi/accept';
import { MatchType } from './shared/match-type';
import { MediaType } from './shared/media-type';
import { getEnumKeyByEnumValue } from './shared/as-enum';



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
        if (accept.mediaTypes[0] === MediaType.app_xhtml_xml || accept.mediaTypes[0] === MediaType.text_html) {
          const rows = await this.appService.getResourceRaw(action.resourceUri);
          return response.render(
            'page',
            { rows },
          );

        } else {

          throw new NotAcceptableException();
        }
      case  MatchType.MACHINE:
          const resource = await this.appService.getResource(action.resourceUri, getEnumKeyByEnumValue(MediaType,  accept.mediaTypes[0]));
          response.set('Content-Type', accept.mediaTypes[0]);
          resource.pipe(response);
          return response;


      case MatchType.RESOURCE:
        if ( accept.mediaTypes[0] === MediaType.app_xhtml_xml || accept.mediaTypes[0] === MediaType.text_html) {
          return response.redirect(303, action.humanUrl);
        } else
        {
          return response.redirect(303, action.machineUrl);
        }

    }


  }
}
