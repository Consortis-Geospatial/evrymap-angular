import { IAddressSearch } from '../interfaces/address-search.interface';

export interface ISearchResult {
  address?: IAddressSearch[];
  layers?: any;
}

export class SearchResultModel implements ISearchResult {
  id: number;
  address?: IAddressSearch[];
  layers?: any;

  constructor(value?: ISearchResult) {
    if (value) {
      Object.assign(this, value);
    }
  }
}
