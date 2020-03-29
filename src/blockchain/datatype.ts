export type TokenId = number;
export type LeverId = number;

export interface TokenSingleLever {
  minValue: number;
  maxValue: number;
  currValue: number;
}

export enum Platform {
  EOS = 'eos',
  ETH = 'eth'
}

export interface ChainAPI {
  cacheMasterToken: Map<TokenId, Token>;
  getAvailableTokenId(contract: string): Promise<TokenId>;
  getMasterToken(contract: string, tokenId: TokenId): Promise<Token>;
  getCurrValueByLeverId(contract: string, leverId: LeverId, tokenId: TokenId): Promise<number>;
  mintArtwork(contract: string, issuer: string, artist: string, uri: string, collaborators: Array<string>);
  setuptoken(contract: string, tokenHolder: string, tokenId: TokenId, minValues: number[], maxValues: number[], currValues: number[]);
  updatetoken(contract: string, tokenHolder: string, tokenId: TokenId, leverIds: number[], newValues: number[]);
}

export interface Token {
  id: TokenId;
  uri: string;
  symbol: string;
}

export const TOKEN_TABLE = 'tokens';
export const CONTROL_TOKEN_TABLE = 'ctltokens';
