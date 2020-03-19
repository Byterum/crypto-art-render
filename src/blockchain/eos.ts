import {
  ChainAPI,
  TokenSingleLever,
  TokenId,
  LeverId,
  CONTROL_TOKEN_TABLE,
  TOKEN_TABLE,
  Token
} from "./datatype";
import { JsonRpc } from 'eosjs';
import fetch from 'node-fetch';


export default class EosAPI implements ChainAPI {
  cacheMasterToken: Map<TokenId, Token>;
  cacheToken: Map<TokenId, Map<LeverId, TokenSingleLever>>;
  rpc: JsonRpc;

  constructor(endpoint: string = "https://api-kylin.eoslaomao.com") {
    this.rpc = new JsonRpc(endpoint, { fetch: fetch as any });
    this.cacheMasterToken = new Map<TokenId, Token>();
    this.cacheToken = new Map<TokenId, Map<LeverId, TokenSingleLever>>();
  }

  async getMasterToken(contract: string, tokenId: TokenId): Promise<Token> {
    const masterToken = this.cacheMasterToken.get(tokenId);
    if (masterToken) return masterToken;

    const resp = await this.rpc.get_table_rows({
      json: true,
      code: contract,
      scope: contract,
      table: TOKEN_TABLE,
      lower_bound: tokenId,
      limit: 1
    })

    if (resp.rows.length > 0) {
      const token = resp.rows[0];
      this.cacheMasterToken.set(tokenId, token);
      return {
        id: token.id,
        uri: token.uri,
        symbol: token.value.split(' ')[1]
      };
    }
    return null;
  }

  async getCurrValueByLeverId(contract: string, leverId: LeverId, tokenId: TokenId): Promise<number> {
    let cache = this.cacheToken.get(tokenId);
    if (!cache) {
      cache = new Map<LeverId, TokenSingleLever>();
      this.cacheToken.set(tokenId, cache);
    }
    let lever = cache.get(leverId);
    if (lever) {
      return Number(lever.currValue);
    }
    const resp = await this.rpc.get_table_rows({
      json: true,
      code: contract,
      scope: contract,
      table: CONTROL_TOKEN_TABLE,
      lower_bound: tokenId,
      limit: 1
    })

    if (resp.rows.length > 0) {
      const token = resp.rows[0];
      token.curr_value((val, i) => {
        cache.set(i, {
          minValue: token.min_value[i],
          maxValue: token.max_value[i],
          currValue: val
        })
      })
      return token.curr_value[leverId]
    }

    return undefined;
  }
}