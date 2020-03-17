import { ChainAPI, TokenSingleLever, TokenId, LeverId } from "./datatype";
import { JsonRpc } from 'eosjs';
import fetch from 'node-fetch';

const BP_ENDPOINT = "https://api-kylin.eoslaomao.com";

export default class EosAPI implements ChainAPI {
  cacheToken: Map<TokenId, Map<LeverId, TokenSingleLever>>;
  rpc: JsonRpc;

  constructor() {
    this.rpc = new JsonRpc(BP_ENDPOINT, { fetch: fetch as any });
    this.cacheToken = new Map<TokenId, Map<LeverId, TokenSingleLever>>();
  }

  async getCurrValueByLeverId(leverId: LeverId, tokenId: LeverId): Promise<number> {
    let cache = this.cacheToken.get(tokenId);
    if (!cache) {
      cache = new Map<LeverId, TokenSingleLever>();
      this.cacheToken.set(tokenId, cache);
    }
    let lever = cache.get(leverId);
    if (lever) {
      return lever.currValue;
    }
    const resp = await this.rpc.get_table_rows({
      json: true,
    })

    if (resp.rows.length > 0) {
      resp.rows.forEach((row: any) => {
        cache.set(row.id, {
          minValue: row.min_value,
          maxValue: row.max_value,
          currValue: row.curr_value
        })
      })
    }
  }

}