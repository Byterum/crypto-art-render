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

interface EosAPIOption {
  endpoint: string;
  privKey: string;
}

export const defaultEosAPIOption: EosAPIOption = {
  endpoint: "http://localhost:8888",
  privKey: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'
}

export default class EosAPI implements ChainAPI {
  cacheMasterToken: Map<TokenId, Token>;
  api: Api;

  constructor(options?: EosAPIOption) {
    const opts = Object.assign({}, defaultEosAPIOption, options || {});
    const rpc = new JsonRpc(opts.endpoint, { fetch: fetch as any });
    const signatureProvider = new JsSignatureProvider([opts.privKey])
    this.api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
    this.cacheMasterToken = new Map<TokenId, Token>();
  }

  /**
   * Fetch next available token id that can be set as master token id.
   * @param contract Artwork contract account 
   */
  async getAvailableTokenId(contract: string): Promise<TokenId> {
    const resp = await this.api.rpc.get_table_rows({
      json: true,
      code: contract,
      scope: contract,
      table: TOKEN_TABLE,
      limit: -1
    })

    if (resp.rows.length > 0) {
      // set cache
      resp.rows.forEach(row => {
        if (row.id === row.master_token_id) {
          // is master token
          this.cacheMasterToken.set(row.id, {
            id: row.id,
            uri: row.uri,
            symbol: row.value.split(' ')[1]
          });
        }
      })
      const last = resp.rows[resp.rows.length - 1];
      return last.id + 1;
    }
    return 0;
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
      const cache = {
        id: token.id,
        uri: token.uri,
        symbol: token.value.split(' ')[1]
      }
      this.cacheMasterToken.set(tokenId, cache);
      return cache;
    }
    return null;
  }

  async getCurrValueByLeverId(contract: string, leverId: LeverId, tokenId: TokenId): Promise<number> {
    const resp = await this.api.rpc.get_table_rows({
      json: true,
      code: contract,
      scope: contract,
      table: CONTROL_TOKEN_TABLE,
      lower_bound: tokenId,
      limit: 1
    })

    if (resp.rows.length > 0) {
      return resp.rows[0].curr_values[leverId];
    }

    return 0;
  }

  async mintArtwork(contract: string, issuer: string, artist: string, uri: string, collaborators: Array<string>) {
    return await this.api.transact({
      actions: [{
        account: contract,
        name: 'mintartwork',
        authorization: [{
          actor: issuer,
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
          max_values: maxValues,
          curr_values: currValues
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    })
  }

  async updatetoken(contract: string, tokenHolder: string, tokenId: TokenId, leverIds: number[], newValues: number[]) {
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
          new_values: newValues
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    })
  }
}