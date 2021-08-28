import { newEnforcer } from './enforcer';

export class EnforceContext {
  public pType: string;
  public rType: string;
  public eType: string;
  public mType: string;

  constructor(rType: string, pType: string, eType: string, mType: string) {
    this.pType = pType;
    this.eType = eType;
    this.mType = mType;
    this.rType = rType;
  }
}
export class NewEnforceContext {
  constructor(index: string) {
    return new EnforceContext('r' + index, 'p' + index, 'e' + index, 'm' + index);
  }
}
