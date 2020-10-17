import { Quad, Stream } from 'rdf-js';
import { Readable, Transform } from 'stream';

export interface Parser {
  streamToStream(input: Stream<Quad>): Readable;
  arrayToStream (input: Quad[]): Readable;
  arrayToText (input: Quad[]): Promise<string>;
  streamToText (input: Stream<Quad>): Promise<string>

}

export abstract class BaseParser implements Parser{
  abstract arrayToStream(input: Quad[]): Readable;

  abstract arrayToText(input: Quad[]): Promise<string>;

  abstract streamToStream(input: Stream<Quad> & Readable): Readable;

  abstract streamToText(input: Stream<Quad> & Readable): Promise<string>;

  protected readStream(stream, encoding = "utf8"): Promise<string> {

    stream.setEncoding(encoding);

    return new Promise((resolve, reject) => {
      let data = "";

      stream.on("data", chunk => data += chunk);
      stream.on("end", () => resolve(data));
      stream.on("error", error => reject(error));
    });
  }

}