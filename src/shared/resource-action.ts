import { MatchType } from './match-type';

export class ResourceAction {
  url: string;
  type: MatchType;
  humanUrl: string;
  machineUrl: string;
  resourceUri: string;
}
