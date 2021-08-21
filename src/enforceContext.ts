// If you need multiple policy definitions or multiple matcher,
// you can use like p2, m2. In fact, all of the above four sections can use multiple types and the syntax is r+number
// such as r2, e2. By default these four sections should correspond one to one
// Such as your r2 will only use matcher m2 to match policies p2.

export class EnforceContext {
  public ptype: string;
  public rtype: string;
  public etype: string;
  public mtype: string;

  constructor(rType: string, pType: string, eType: string, mType: string) {
    this.ptype = pType;
    this.etype = eType;
    this.mtype = mType;
    this.rtype = rType;
  }
}
