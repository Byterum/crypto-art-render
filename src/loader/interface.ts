export default interface Loader {
  loadFromUri(cid: string): Promise<Buffer>
}