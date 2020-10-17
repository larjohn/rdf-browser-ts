import { Controller, Get, Headers, NotAcceptableException, Param, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { parseAll } from '@hapi/accept';
import { MatchType } from './shared/match-type';
import { MediaType } from './shared/media-type';
import { getEnumKeyByEnumValue } from './shared/as-enum';
import { ResourceAction } from './shared/resource-action';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private configService: ConfigService) {
  }

  resBase = this.configService.get<string>('resourceBaseUri');


  @Get('*.:ext')
  async file(@Param() params, @Req() request, @Res() response, @Headers() headers) {
    const action = this.appService.discoverMatch(request);

    const mediaType = this.appService.determineExtension(params.ext);

    return this.handle(mediaType, action, response);


  }




  @Get('*')
  async resource(@Param() params, @Req() request, @Res() response, @Headers() headers) {

    /*
    Is it a recognized resource match? If it is, then redirect to the machine or human
    Is it a recognized machine match? Then give the data
    Is it a recognized human match? Then give the page
    Is it no match? Show an error page
     */

    // Parse a SPARQL query to a JSON object

    const action = this.appService.discoverMatch(request);

    const accept = parseAll(headers);

    const mediaType = this.appService.negotiate(accept.mediaTypes);

    return this.handle(mediaType, action, response);


  }


  private async handle(mediaType: MediaType, action: ResourceAction, response) {

    switch (action.type) {
      case MatchType.HUMAN:
        if (mediaType === MediaType.app_xhtml_xml || mediaType === MediaType.text_html) {
          const rows = await this.appService.getResourceRaw(action.resourceUri);
          return response.render(
            'page',
            { rows },
          );

        } else {

          throw new NotAcceptableException();
        }
      case  MatchType.MACHINE:
        const resource = await this.appService.getResource(action.resourceUri, getEnumKeyByEnumValue(MediaType, mediaType));
        response.set('Content-Type', mediaType);
        resource.pipe(response);
        return response;


      case MatchType.RESOURCE:
        if (mediaType === MediaType.app_xhtml_xml || mediaType === MediaType.text_html) {
          return response.redirect(303, action.humanUrl);
        } else if (
          [MediaType.turtle, MediaType.trig, MediaType.n_triples, MediaType.n_quads, MediaType.n3,
            MediaType.rdf_xml, MediaType.rdf_xml, MediaType.json_ld, MediaType.json]
            .some(type => type === mediaType)) {
          return response.redirect(303, action.machineUrl);
        } else {
          return response.redirect(303, action.humanUrl);

        }

    }
  }


}
