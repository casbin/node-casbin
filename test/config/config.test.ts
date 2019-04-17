import { Config } from '../../src';

const config = Config.newConfig('test/config/testini.ini');

describe('multi-line test', () => {
  it('should config.get("multi1::name") to equal r.sub==p.sub&&r.obj==p.obj', function() {
    expect(config.get('multi1::name')).toEqual('r.sub==p.sub&&r.obj==p.obj');
  });

  it('should config.get("multi2::name") to equal r.sub==p.sub&&r.obj==p.obj', function() {
    expect(config.get('multi2::name')).toEqual('r.sub==p.sub&&r.obj==p.obj');
  });

  it('should config.get("multi3::name") to equal r.sub==p.sub&&r.obj==p.obj', function() {
    expect(config.get('multi3::name')).toEqual('r.sub==p.sub&&r.obj==p.obj');
  });

  it('should config.get("multi4::name") to equal r.sub==p.sub&&r.obj==p.obj', function() {
    expect(config.get('multi4::name')).toEqual('');
  });

  it('should config.get("multi5::name") to equal r.sub==p.sub&&r.obj==p.obj', function() {
    expect(config.get('multi5::name')).toEqual('r.sub==p.sub&&r.obj==p.obj');
  });
});
