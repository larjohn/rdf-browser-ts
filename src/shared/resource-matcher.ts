export class ResourceMatcher {

  pattern: RegExp;
  human: string;
  machine: string;
  resource: string;

  constructor(config) {
    this.pattern = RegExp(config.pattern);
    this.human = (config.human);
    this.machine = (config.machine);
    this.resource = (config.resource);
  }


  matches(url: string): boolean {
    return this.pattern.test(url);
  }

  isHuman(url): boolean {
    return this.getHuman(url) === url;
  }

  isMachine(url): boolean {
    return this.getMachine(url) === url;
  }

  getHuman(url): string {
    return url.replace(this.pattern, this.human);
  }

  getMachine(url): string {
    return url.replace(this.pattern, this.machine);
  }


  getResource(url): string {
    return url.replace(this.pattern, this.resource);
  }

}
