import {
  ChainAPI,
  TokenSingleLever,
  TokenId,
  LeverId,
  CONTROL_TOKEN_TABLE,
  TOKEN_TABLE,
  Token
} from "./datatype";
import { Api, JsonRpc } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { TextEncoder, TextDecoder } from 'util';
import fetch from 'node-fetch';


export default class EosAPI implements ChainAPI {
  cacheMasterToken: Map<TokenId, Token>;
  cacheToken: Map<TokenId, Map<LeverId, TokenSingleLever>>;
  api: Api;

  constructor(endpoint: string = "https://api-kylin.eoslaomao.com", privKey?: string) {
    const rpc = new JsonRpc(endpoint, { fetch: fetch as any });
    const signatureProvider = new JsSignatureProvider([privKey])
    this.api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
    this.cacheMasterToken = new Map<TokenId, Token>();
    this.cacheToken = new Map<TokenId, Map<LeverId, TokenSingleLever>>();
  }

  async getMasterToken(contract: string, tokenId: TokenId): Promise<Token> {
    const masterToken = this.cacheMasterToken.get(tokenId);
    if (masterToken) return masterToken;

    const resp = await this.api.rpc.get_table_rows({
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
    const resp = await this.api.rpc.get_table_rows({
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

  async mintArtwork(contract: string, artist: string, uri: string, collaborators: Array<string>) {
    return await this.api.transact({
      actions: [{
        account: contract,
        name: 'mintartwork',
        authorization: [{
          actor: contract,
          permission: 'active'
        }],
        data: {
          to: artist,
          uri,
          collaborators
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    })
  }

  async setuptoken(contract: string, tokenHolder: string, tokenId: TokenId, minValues: number[], maxValues: number[], currValues: number[]) {
    return await this.api.transact({
      actions: [{
        account: contract,
        name: 'setuptoken',
        authorization: [{
          actor: tokenHolder,
          permission: 'active'
        }],
        data: {
          token_id: tokenId,
          min_values: minValues,
          max_vaules: maxValues,
          curr_values: currValues
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    })
  }

  async updatetoken(contract: string, tokenHolder: string, tokenId: TokenId, leverIds: number[], currValues: number[]) {
    return await this.api.transact({
      actions: [{
        account: contract,
        name: 'updatetoken',
        authorization: [{
          actor: tokenHolder,
          permission: 'active'
        }],
        data: {
          token_id: tokenId,
          lever_ids: leverIds,
          curr_values: currValues
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    })
  }
}