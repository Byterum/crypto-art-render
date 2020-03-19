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
  cacheToken: Map<TokenId, Map<LeverId, TokenSingleLever>>;
  getMasterToken(contract: string, tokenId: TokenId): Promise<Token>;
  getCurrValueByLeverId(contract: string, leverId: LeverId, tokenId: TokenId): Promise<number>;
}

export interface Token {
  id: TokenId;
  uri: string;
  symbol: string;
}

export const TOKEN_TABLE = 'tokens';
export const CONTROL_TOKEN_TABLE = 'ctltokens';
