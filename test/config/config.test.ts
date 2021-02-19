import { Config } from '../../src';

const config = Config.newConfig('test/config/testini.ini');

describe('multi-line test', () => {
  it('should config.get("multi1::name") to equal r.sub==p.sub&&r.obj==p.obj', function () {
    expect(config.get('multi1::name')).toEqual('r.sub==p.sub&&r.obj==p.obj');
  });

  it('should config.get("multi2::name") to equal r.sub==p.sub&&r.obj==p.obj', function () {
    expect(config.get('multi2::name')).toEqual('r.sub==p.sub&&r.obj==p.obj');
  });

  it('should config.get("multi3::name") to equal r.sub==p.sub&&r.obj==p.obj', function () {
    expect(config.get('multi3::name')).toEqual('r.sub==p.sub&&r.obj==p.obj');
  });

  it('should config.get("multi4::name") to equal r.sub==p.sub&&r.obj==p.obj', function () {
    expect(config.get('multi4::name')).toEqual('');
  });

  it('should config.get("multi5::name") to equal r.sub==p.sub&&r.obj==p.obj', function () {
    expect(config.get('multi5::name')).toEqual('r.sub==p.sub&&r.obj==p.obj');
  });

  it('should config.get("multi6::name") to equal r.sub==p.sub&&r.obj==p.obj&&r.tex==p.tex', function () {
    expect(config.get('multi6::name')).toEqual('r.sub==p.sub&&r.obj==p.obj&&r.tex==p.tex');
  });

  it('should config.get("mysql::mysql.master.host") to equal 10.0.0.1', function () {
    expect(config.get('mysql::mysql.master.host')).toEqual('10.0.0.1');
  });
  it('should config.get("mysql::mysql.master.user") to equal root', function () {
    expect(config.get('mysql::mysql.master.user')).toEqual('root');
  });
});
