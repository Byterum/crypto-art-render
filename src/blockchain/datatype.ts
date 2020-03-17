export type TokenId = number;
export type LeverId = number;

export interface TokenSingleLever {
  minValue: number;
  maxValue: number;
  currValue: number;
}

export interface ChainAPI {
  cacheToken: Map<TokenId, Map<LeverId, TokenSingleLever>>;
  getCurrValueByLeverId(leverId: LeverId, tokenId: TokenId): Promise<number>;
}

export class Token {

}