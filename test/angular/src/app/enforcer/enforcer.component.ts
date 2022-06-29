import { Component, OnInit } from '@angular/core';
import { newEnforcer, Model, MemoryAdapter, Enforcer } from 'casbin-core';

@Component({
  selector: 'app-enforcer',
  templateUrl: './enforcer.component.html',
  styleUrls: ['./enforcer.component.css']
})

export class EnforcerComponent implements OnInit {

  model = new Model(`
    [request_definition]
    r = sub, obj, act

    [policy_definition]
    p = sub, obj, act

    [policy_effect]
    e = some(where (p.eft == allow))

    [matchers]
    m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
  `);
  adapter = new MemoryAdapter(`
    p, alice, data1, read
    p, bob, data2, write
  `);
  enforcer!: Enforcer;
  title = 'Casbin';
  sub!: string;
  obj!: string;
  act!: string;
  result: boolean = false;

  constructor() { 
    this.sub = 'alice';
    this.obj = 'data1';
    this.act = 'read';
    newEnforcer(this.model, this.adapter).then(e => {
      this.enforcer = e;
      this.enforcer.enforce(this.sub, this.obj, this.act).then((res) => {
        this.result = res;
      })
    });
  }

  ngOnInit(): void { }
}
