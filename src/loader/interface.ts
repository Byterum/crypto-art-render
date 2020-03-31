export interface Loader {
  loadFromUri(cid: string): Promise<Buffer>
}